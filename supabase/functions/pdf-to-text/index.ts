// pdf-to-text Edge Function
// Extracts plain text from uploaded PDF, TXT, or MD files.
// Replaces the Next.js /api/pdf-to-text route (which used child_process.spawn,
// incompatible with Cloudflare Workers).
//
// Request:  multipart/form-data with a `file` field
// Response: { text: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Common PDF font artifacts: ligatures, soft hyphens, non-breaking spaces, etc.
const LIGATURES: Record<string, string> = {
  '\uFB00': 'ff',  // ﬀ
  '\uFB01': 'fi',  // ﬁ
  '\uFB02': 'fl',  // ﬂ
  '\uFB03': 'ffi', // ﬃ
  '\uFB04': 'ffl', // ﬄ
  '\uFB05': 'st',  // ﬅ
  '\uFB06': 'st',  // ﬆ
  '\u00AD': '',    // soft hyphen
  '\u00A0': ' ',   // non-breaking space
  '\u2019': "'",   // right single quotation mark
  '\u2018': "'",   // left single quotation mark
  '\u201C': '"',   // left double quotation mark
  '\u201D': '"',   // right double quotation mark
  '\u2013': '-',   // en dash
  '\u2014': '--',  // em dash
  '\u2026': '...', // ellipsis
}

const LIGATURE_RE = new RegExp(Object.keys(LIGATURES).join('|'), 'g')

function cleanText(str: string): string {
  return str
    .replace(LIGATURE_RE, (ch) => LIGATURES[ch] ?? ch)
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse multiple spaces into one
    .replace(/ {2,}/g, ' ')
}

function formatParagraphs(text: string): string {
  return text
    // Fix hyphenated line-breaks: "some-\nword" → "someword"
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // Merge wrapped lines: line not ending in sentence punctuation,
    // followed by a single newline, then lowercase/digit = continuation
    .replace(/([^\n.!?:;])\n(?!\n)([a-z\d("])/g, '$1 $2')
    // Collapse 3+ blank lines into one paragraph break
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdfText(bytes: Uint8Array): Promise<{ text: string; pageMap: number[] }> {
  const { getDocumentProxy, extractText } = await import('https://esm.sh/unpdf@0.11.0')
  const pdf = await getDocumentProxy(bytes)
  const { text } = await extractText(pdf, { mergePages: false })
  const indexed = (text as string[]).map((t, i) => ({
    pageNum: i + 1,
    text: formatParagraphs(cleanText(t)),
  }))
  const nonEmpty = indexed.filter(p => p.text.length > 0)
  return {
    text: nonEmpty.map(p => p.text).join('\n\n---\n\n'),
    pageMap: nonEmpty.map(p => p.pageNum),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller identity
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'txt' || ext === 'md') {
      return new Response(JSON.stringify({ text: await file.text() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (ext !== 'pdf') {
      return new Response(JSON.stringify({ error: `Unsupported file type: .${ext}. Supported: pdf, txt, md` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const { text, pageMap } = await extractPdfText(bytes)

    return new Response(JSON.stringify({ text, pageMap }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('pdf-to-text error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Extraction failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
