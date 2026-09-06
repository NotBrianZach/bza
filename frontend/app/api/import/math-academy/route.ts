import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const CHAR_PAGE_LENGTH = 420

async function getUserId(req: NextRequest): Promise<string | null> {
  // 1. Try cookie-based auth (browser session)
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabaseServerClient")
    const { NextResponse } = await import("next/server")
    let response = NextResponse.json({})
    const cookieClient = createSupabaseServerClient(req, () => response, (r: any) => { response = r })
    const { data: { user } } = await cookieClient.auth.getUser()
    if (user?.id) return user.id
  } catch {}

  // 2. Try Bearer token (extension token or Supabase JWT)
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")
  if (authHeader) {
    // Check if it is an extension token (64-char hex)
    if (/^[a-f0-9]{64}$/.test(authHeader)) {
      const crypto = await import("crypto")
      const tokenHash = crypto.createHash("sha256").update(authHeader).digest("hex")
      const { data } = await supabase.from("extension_tokens").select("user_id").eq("token_hash", tokenHash).maybeSingle()
      if (data?.user_id) {
        await supabase.from("extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash)
        return data.user_id
      }
    }
    // Try as Supabase JWT
    const { data: { user } } = await supabase.auth.getUser(authHeader)
    if (user?.id) return user.id
  }

  // 3. Fallback: configured default user
  if (process.env.BZA_DEFAULT_USER_ID) return process.env.BZA_DEFAULT_USER_ID
  return null
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

function corsJson(data: any, init?: ResponseInit) {
  const resp = NextResponse.json(data, init)
  resp.headers.set('Access-Control-Allow-Origin', '*')
  return resp
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) {
    return corsJson({ error: 'No user found. Set BZA_DEFAULT_USER_ID or send Authorization header.' }, { status: 401 })
  }

  // Read raw ZIP body
  const zipBytes = await req.arrayBuffer()
  if (zipBytes.byteLength === 0) {
    return corsJson({ error: 'Empty request body' }, { status: 400 })
  }

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(zipBytes)
  } catch {
    return corsJson({ error: 'Invalid ZIP archive' }, { status: 400 })
  }

  // Read manifest
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    return corsJson({ error: 'Missing manifest.json' }, { status: 400 })
  }
  const manifest = JSON.parse(await manifestFile.async('text'))
  if (manifest.format !== 'bza') {
    return corsJson({ error: 'Not a .bza archive' }, { status: 400 })
  }

  // Merge all topic markdown files into single content
  const topics = manifest.content || []
  const contentParts: string[] = []
  for (const topic of topics) {
    const file = zip.file(topic.file)
    if (file) {
      contentParts.push(await file.async('text'))
    }
  }
  const content = contentParts.join('\n\n---\n\n')
  if (!content) {
    return corsJson({ error: 'No content found in archive' }, { status: 400 })
  }

  // Read steps
  const stepsFile = zip.file('content/steps.json')
  const steps = stepsFile ? JSON.parse(await stepsFile.async('text')) : []

  // Read graph
  const edgesFile = zip.file('graph/edges.json')
  const edges = edgesFile ? JSON.parse(await edgesFile.async('text')) : []
  const topicsGraphFile = zip.file('graph/topics.json')
  const topicsGraph = topicsGraphFile ? JSON.parse(await topicsGraphFile.async('text')) : {}

  // Create book title from topics
  const title = topics.length === 1
    ? (topics[0].title || 'Math Academy')
    : `Math Academy (${topics.length} topics)`

  const totalPages = Math.max(1, Math.ceil(content.length / CHAR_PAGE_LENGTH))
  const timestamp = Date.now()
  const slug = title.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 40)
  const filePath = `${userId}/${timestamp}_${slug}.md`

  // Upload content to storage
  const { error: uploadErr } = await supabase.storage
    .from('books')
    .upload(filePath, new Blob([content], { type: 'text/markdown' }), { contentType: 'text/markdown' })
  if (uploadErr) {
    return corsJson({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 })
  }

  // Create book record
  const { data: newBook, error: bookErr } = await supabase.from('books').insert({
    user_id: userId,
    file_path: filePath,
    title,
    content_type: 'math_textbook',
    char_page_length: CHAR_PAGE_LENGTH,
    total_pages: totalPages,
    source_url: topics[0]?.url || null,
  }).select().single()

  if (bookErr || !newBook) {
    await supabase.storage.from('books').remove([filePath])
    return corsJson({ error: `Failed to create book: ${bookErr?.message}` }, { status: 500 })
  }

  const bookId = newBook.id
  const imported: string[] = [`${topics.length} topics`, `${steps.length} steps`]

  // Build problem_sets data (matches ProblemSetData format)
  const problems = steps
    .filter((s: any) => s.type === 'question' || s.type === 'example')
    .map((s: any, i: number) => ({
      id: s.id || `ma-${s.topicId}-${i}`,
      title: s.title || s.type,
      text: s.text || s.question?.text || '',
      htmlContent: s.htmlContent || s.question?.htmlContent || null,
      pageNum: 1,
      isMarkdown: true,
    }))

  const problemEdges = edges.map((e: any) => ({
    from: e.from,
    to: e.to,
    label: e.type || 'prerequisite',
    type: e.type || 'prerequisite',
  }))

  if (problems.length > 0 || problemEdges.length > 0) {
    const psData = {
      problems,
      labels: [],
      labelMap: {},
      spaces: {},
      scratchpads: {},
      edges: problemEdges,
      graph: topicsGraph,
    }
    await supabase.from('problem_sets').upsert({
      user_id: userId,
      book_id: bookId,
      data: psData,
      updated_at: new Date().toISOString(),
    })
    imported.push(`${problems.length} problems`, `${problemEdges.length} edges`)
  }

  // Upload media files
  let mediaCount = 0
  for (const media of (manifest.media || [])) {
    const mediaFile = zip.file(media.file)
    if (!mediaFile) continue
    const data = await mediaFile.async('arraybuffer')
    const ext = media.file.split('.').pop() || 'png'
    const mediaPath = `${userId}/ma_${bookId}_${mediaCount}.${ext}`
    const { error: mediaErr } = await supabase.storage
      .from('page-images')
      .upload(mediaPath, new Blob([data], { type: `image/${ext}` }), { contentType: `image/${ext}` })
    if (!mediaErr) mediaCount++
  }
  if (mediaCount > 0) imported.push(`${mediaCount} images`)

  return corsJson({
    status: 'imported',
    bookId,
    title: newBook.title,
    imported,
    topicCount: topics.length,
    stepCount: steps.length,
    edgeCount: edges.length,
  })
}
