/**
 * PDF text extraction.
 * - PDFs are processed by the Cloud Run Marker worker via create-document-job.
 * - Plain text / Markdown files are read directly.
 * - The legacy pdf-to-text edge function is kept for local dev fallback only.
 */
import { supabase } from './supabase'

export interface ExtractedImage {
  pageNum: number
  index: number
  blob: Blob
}

export interface ExtractedContent {
  markdown: string
  images: ExtractedImage[]
}

async function extractViaEdgeFunction(file: File): Promise<{ text: string; pageMap: number[] }> {
  const formData = new FormData()
  formData.append('file', file)

  const { data, error } = await supabase.functions.invoke('pdf-to-text', {
    body: formData,
  })

  if (error) throw new Error(error.message || 'PDF extraction failed')
  if (!data?.text) throw new Error('No text returned from pdf-to-text function')

  return { text: data.text as string, pageMap: (data.pageMap as number[]) ?? [] }
}

export async function extractPdfContent(file: File): Promise<ExtractedContent> {
  const { text } = await extractViaEdgeFunction(file)
  return { markdown: text, images: [] }
}

async function extractPdfTextClientSide(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const buf = await file.arrayBuffer()
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise

  const pageTexts: string[] = []
  for (let pn = 1; pn <= pdfDoc.numPages; pn++) {
    const page = await pdfDoc.getPage(pn)
    const content = await page.getTextContent()
    const text = (content.items as any[])
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/ {2,}/g, ' ')
      .trim()
    if (text) pageTexts.push(text)
  }

  return pageTexts.join('\n\n---\n\n')
}

/**
 * Reflow raw pdfjs plain text into readable paragraphs.
 *
 * pdfjs output is flat page text joined by \n\n---\n\n separators.
 * This splits each page into sentences and groups them into paragraphs
 * targeting ~targetChars characters each. A sentence is never broken;
 * paragraphs may exceed the target slightly to avoid orphan sentences.
 */
/**
 * Reflow raw pdfjs plain text into readable paragraphs.
 *
 * - Targets ~targetChars characters per paragraph (default 200)
 * - Never breaks mid-sentence
 * - Strips superscript footnote markers (¹²³…) and inline [n] refs from body text
 * - Detects footnote/reference blocks (lines like "1 Some note text") and
 *   moves them to an italicised footnotes section at the end of each page
 */
export function chunkPdfText(rawText: string, targetChars = 200): string {
  const PAGE_SEP = '\n\n---\n\n'
  const pages = rawText.split(PAGE_SEP)
  const output: string[] = []

  // Superscript unicode digits → [[n]] inline markers
  const SUPERSCRIPT_DIGITS: Record<string, string> =
    {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'}
  const SUPERSCRIPT_RE = /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g
  // Inline reference markers like [1], [12]
  const INLINE_REF_RE = /\[(\d+)\]/g
  // A footnote entry: digit(s) at a word boundary followed by a space and text.
  // We look for these after splitting a page into candidate "sentences".
  const FOOTNOTE_ENTRY_RE = /^\d{1,3}\s+[A-Za-z]/

  // Common abbreviations whose periods must not split sentences
  const ABBR = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'Mt',
                 'vs', 'etc', 'e\\.g', 'i\\.e', 'Fig', 'No', 'Vol',
                 'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep',
                 'Oct', 'Nov', 'Dec', 'Lt', 'Sgt', 'Cpl', 'Gen', 'Rep', 'Op']
  const ABBR_RE = new RegExp(`\\b(${ABBR.join('|')})\\.`, 'g')

  for (const page of pages) {
    let text = page.trim().replace(/\s+/g, ' ')
    if (!text) continue

    // Convert superscript chars and [n] refs to [[n]] inline markers (preserved for reader)
    text = text
      .replace(SUPERSCRIPT_RE, m => `[[${m.split('').map(c => SUPERSCRIPT_DIGITS[c] ?? '').join('')}]]`)
      .replace(INLINE_REF_RE, (_, n) => `[[${n}]]`)
      .replace(/\s{2,}/g, ' ').trim()

    // Split into candidate sentences first so we can separate footnote entries
    const prot = text.replace(ABBR_RE, '$1\x00')
    const allSentences = prot
      .split(/(?<=[.!?…])\s+(?=["""'\u2018\u201CA-Z0-9])/)
      .map(s => s.replace(/\x00/g, '.').trim())
      .filter(Boolean)

    // Separate footnote entries from body sentences.
    // Footnotes tend to cluster near the end of a page and match FOOTNOTE_ENTRY_RE.
    const bodySentences: string[] = []
    const footnoteSentences: string[] = []
    let inFootnotes = false

    for (const s of allSentences) {
      if (!inFootnotes && FOOTNOTE_ENTRY_RE.test(s) && s.length < 180) {
        inFootnotes = true
      }
      if (inFootnotes) {
        footnoteSentences.push(s)
      } else {
        bodySentences.push(s)
      }
    }

    // Chunk body sentences into ~targetChars paragraphs
    const paragraphs: string[] = []
    let current: string[] = []
    let charCount = 0

    for (const sentence of bodySentences) {
      if (charCount > 0 && charCount + sentence.length > targetChars) {
        paragraphs.push(current.join(' '))
        current = [sentence]
        charCount = sentence.length
      } else {
        current.push(sentence)
        charCount += sentence.length + 1
      }
    }
    if (current.length) paragraphs.push(current.join(' '))

    output.push(...paragraphs)

    // Parse and store footnotes in a structured block the reader can extract
    if (footnoteSentences.length > 0) {
      const combined = footnoteSentences.join(' ')
      const rawEntries = combined.split(/(?=\b\d{1,3}\s+[A-Za-z])/).filter(Boolean)
      const entries: string[] = []
      for (const entry of rawEntries) {
        const m = entry.trim().match(/^(\d{1,3})\s+(.+)/)
        if (m) entries.push(`${m[1]}|${m[2].trim()}`)
      }
      if (entries.length > 0) {
        output.push(`%%fn%%\n${entries.join('\n')}\n%%/fn%%`)
      }
    }
  }

  return output.join('\n\n')
}

export async function fileToText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'txt':
    case 'md':
      return file.text()
    case 'pdf':
      return extractPdfTextClientSide(file)
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: .pdf, .txt, .md`)
  }
}

export async function fileToTextWithPageMap(file: File): Promise<{ text: string; pageMap: number[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'txt':
    case 'md':
      return { text: await file.text(), pageMap: [] }
    case 'pdf':
      return extractViaEdgeFunction(file)
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: .pdf, .txt, .md`)
  }
}

/**
 * Upload a PDF to Supabase Storage, process it via Jina Reader, then delete
 * the uploaded file. Billing is recorded server-side via /api/process-pdf.
 */
export async function processDocumentViaJina(
  file: File,
  userId: string,
  onStatus?: (status: string) => void,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `users/${userId}/uploads/${Date.now()}_${safeName}`

  onStatus?.('uploading')
  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: true })
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  onStatus?.('processing')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch('/api/process-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath, authToken: session.access_token }),
    })
    const d = await res.json()
    if (d.error) throw new Error(d.error)
    return d.markdown as string
  } catch (err) {
    // Clean up if the API route didn't handle deletion (e.g. auth failure)
    await supabase.storage.from('documents').remove([storagePath]).catch(() => {})
    throw err
  }
}

/**
 * Upload a PDF to Supabase Storage, submit to Mathpix for high-quality math OCR,
 * poll for completion, then delete the stored file.
 */
export async function processDocumentViaMathpix(
  file: File,
  userId: string,
  onStatus?: (status: string) => void,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `users/${userId}/uploads/${Date.now()}_${safeName}`

  onStatus?.('uploading')
  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: true })
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    onStatus?.('queuing')
    const submitRes = await fetch('/api/mathpix-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath, authToken: session.access_token }),
    })
    const submitData = await submitRes.json()
    if (submitData.error) throw new Error(submitData.error)

    const { mathpixPdfId, userId: uid } = submitData

    // Poll until complete (up to 30 min, every 5 seconds)
    const POLL_MS = 5_000
    const deadline = Date.now() + 30 * 60 * 1_000

    onStatus?.('processing')
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_MS))

      const statusRes = await fetch(
        `/api/mathpix-status?pdfId=${encodeURIComponent(mathpixPdfId)}&storagePath=${encodeURIComponent(storagePath)}&userId=${encodeURIComponent(uid)}`
      )
      const statusData = await statusRes.json()
      if (statusData.error) throw new Error(statusData.error)

      if (typeof statusData.progressPct === 'number' && statusData.progressPct > 0) {
        onProgress?.(statusData.progressPct)
      }

      if (statusData.status === 'completed') {
        return statusData.markdown as string
      }
    }

    throw new Error('Mathpix processing timed out after 30 minutes')
  } catch (err) {
    await supabase.storage.from('documents').remove([storagePath]).catch(() => {})
    throw err
  }
}

/**
 * Upload a document to the Cloud Run Marker worker pipeline and return the
 * readable markdown once processing is complete.
 *
 * Flow:
 *   1. Upload raw file to documents bucket at users/<userId>/uploads/<filename>
 *   2. Call create-document-job edge function
 *   3. Poll get-document-job until status is "done" or "failed"
 *   4. Download and return readable.md content
 */
export async function processDocumentViaCloudRun(
  file: File,
  userId: string,
  profile: 'default' | 'study' | 'mobile' | 'dense' = 'default',
  onStatus?: (status: string) => void,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `users/${userId}/uploads/${Date.now()}_${safeName}`

  onStatus?.('uploading')
  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: true })
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  onStatus?.('queuing')
  const { data: jobData, error: jobErr } = await supabase.functions.invoke('create-document-job', {
    body: { bucket: 'documents', path: storagePath, profile, processingMethod: 'nougat' },
  })
  if (jobErr) throw new Error(`Failed to create document job: ${jobErr.message}`)

  const jobId: string = jobData.job_id
  if (!jobId) throw new Error('create-document-job did not return a job_id')

  // Poll until done or failed (up to 30 minutes, every 5 seconds)
  const POLL_INTERVAL_MS = 5_000
  const TIMEOUT_MS = 30 * 60 * 1_000
  const deadline = Date.now() + TIMEOUT_MS

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

    const { data: statusData, error: statusErr } = await supabase.functions.invoke('get-document-job', {
      body: { id: jobId },
    })
    if (statusErr) continue  // transient — keep polling

    const { job, signed_urls } = statusData

    if (job.status === 'done') {
      onStatus?.('downloading')
      const url: string = signed_urls?.readable_markdown ?? signed_urls?.raw_markdown
      if (!url) throw new Error('Job done but no output URL returned')

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to download processed markdown: ${res.status}`)
      return await res.text()
    }

    if (job.status === 'failed') {
      throw new Error(`Document processing failed: ${job.error ?? 'unknown error'}`)
    }

    onStatus?.(job.status)

    // Forward real per-page progress from the worker when available.
    // progress_pct is 0-100 within the 'processing' stage.
    if (job.status === 'processing' && typeof job.progress_pct === 'number' && job.progress_pct > 0) {
      onProgress?.(job.progress_pct)
    }
  }

  throw new Error('Document processing timed out after 30 minutes')
}
