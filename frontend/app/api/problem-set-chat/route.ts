import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

const MATH_SYNTAX = `Use GitHub-flavored markdown with LaTeX math. CRITICAL RULES:
- EVERY math expression, even simple ones like 3^3 or x+y, MUST be wrapped in dollar signs
- Inline math: $expression$ — e.g. $3^3$, $x^2 + y^2$, $n$, $\\alpha$
- Display math: $$expression$$ on its own line — e.g. $$\\frac{a}{b} = c$$
- NEVER write math outside dollar signs — bare ^ will be stripped by the renderer
- Use standard LaTeX commands inside $...$: \\frac{a}{b}, \\sum_{i=1}^{n}, \\int_a^b, \\sqrt{x}, \\vec{v}, etc.
- Use **bold** and _italic_ for prose emphasis
- Use numbered lists (1. 2. 3.) for steps
- Use ## headings for sections`

export async function POST(req: NextRequest) {
  const { problem, bookTitle, pageNum, instruction, mode, scratchpad, selectedSpaces, pageSource, personaPrompt, model: requestModel, provider: requestProvider, problems, edges, stepsRevealed } = await req.json() as {
    problem: string
    bookTitle?: string
    pageNum?: number
    instruction?: string
    mode: 'hint' | 'solution' | 'typeset' | 'extract' | 'graph' | 'narrative' | 'check' | 'step'
    scratchpad?: string
    selectedSpaces?: { title: string; content: string }[]
    pageSource?: string
    personaPrompt?: string
    model?: string
    provider?: 'openai' | 'openrouter'
    problems?: { title: string; text: string }[]
    edges?: { from: string; to: string; label: string; type: string }[]
    stepsRevealed?: number
  }

  // Extract mode: AI-powered exercise extraction from page source
  if (mode === 'extract') {
    if (!pageSource?.trim()) {
      return NextResponse.json({ problems: [] })
    }
    const extractPrompt = `You are an expert at identifying exercises, problems, and practice questions in textbook pages.

Given this page of markdown/LaTeX from "${bookTitle || 'a textbook'}" (page ${pageNum ?? '?'}), extract ALL exercises, problems, homework questions, or practice items that a student should solve.

DO NOT extract:
- Worked examples (where the solution is already provided in the text)
- Theorems, definitions, or proofs
- General prose or explanations

For each exercise found, return it as a JSON object with:
- "title": a short label (e.g. "Exercise 1-7", "Problem 3", "Question 2a")
- "text": the EXACT original LaTeX/markdown text of the problem, preserving all math notation exactly as written. Include the full problem statement and ALL sub-items (i., ii., iii., a., b., 1., 2., etc.) as ONE entry.

CRITICAL: Do NOT split an exercise into separate entries per sub-item. An exercise with parts i-viii is ONE entry containing all parts.

Return a JSON array of these objects. If no exercises are found, return an empty array [].

IMPORTANT: Preserve the original LaTeX notation EXACTLY. Do not modify, simplify, or re-format any math expressions.

Page source:
${pageSource.slice(0, 6000)}

Return ONLY valid JSON array, no other text.`

    const extractRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: extractPrompt }],
        max_tokens: 2000,
        temperature: 0,
      }),
    })

    if (!extractRes.ok) {
      return NextResponse.json({ problems: [] })
    }

    const extractData = await extractRes.json()
    let raw = extractData.choices?.[0]?.message?.content?.trim() ?? '[]'
    raw = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    try {
      const problems = JSON.parse(raw)
      return NextResponse.json({ problems: Array.isArray(problems) ? problems : [] })
    } catch {
      return NextResponse.json({ problems: [] })
    }
  }

  // Graph mode: identify relationships between problems
  if (mode === 'graph') {
    if (!problems?.length) return NextResponse.json({ edges: [] })
    const graphPrompt = `You are a math curriculum expert. Given these problems from "${bookTitle || 'a textbook'}":

${problems.map((p, i) => `[${i}] ${p.title}: ${p.text.slice(0, 200)}`).join('\n')}

Identify relationships between them. Return a JSON array of edges:
[{"from": "Problem Title", "to": "Problem Title", "label": "brief description", "type": "prerequisite|builds_on|same_technique|alternative|harder_version"}]

Only include real pedagogical relationships. Return ONLY valid JSON array.`

    const gRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: graphPrompt }], max_tokens: 1500, temperature: 0.2 }),
    })
    if (!gRes.ok) return NextResponse.json({ edges: [] })
    const gData = await gRes.json()
    let raw = gData.choices?.[0]?.message?.content?.trim() ?? '[]'
    raw = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    try { return NextResponse.json({ edges: JSON.parse(raw) }) } catch { return NextResponse.json({ edges: [] }) }
  }

  // Narrative mode: create CYOA story linking problems
  if (mode === 'narrative') {
    if (!problems?.length) return NextResponse.json({ nodes: [] })
    const edgeContext = edges?.length ? `\nKnown relationships:\n${edges.map(e => `${e.from} → ${e.to} (${e.type}: ${e.label})`).join('\n')}` : ''
    const narrativePrompt = `You are a creative math storyteller. Given these problems from "${bookTitle || 'a textbook'}":

${problems.map((p, i) => `[${i}] ${p.title}: ${p.text.slice(0, 150)}`).join('\n')}${edgeContext}

Create a Choose-Your-Own-Adventure narrative that guides a student through these problems in a logical order. Each node is a story beat that introduces or contextualizes a problem.

Return a JSON array of nodes:
[{"id": "node_1", "text": "narrative paragraph (2-3 sentences, engaging)", "problemIdx": 0, "choices": [{"label": "choice text", "target": "node_2"}]}]

Make it fun and educational. Use $...$ for any inline math. Return ONLY valid JSON array.`

    const nRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: narrativePrompt }], max_tokens: 2000, temperature: 0.7 }),
    })
    if (!nRes.ok) return NextResponse.json({ nodes: [] })
    const nData = await nRes.json()
    let raw = nData.choices?.[0]?.message?.content?.trim() ?? '[]'
    raw = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    try { return NextResponse.json({ nodes: JSON.parse(raw) }) } catch { return NextResponse.json({ nodes: [] }) }
  }

  // Check mode: validate student's work without revealing the answer
  if (mode === 'check') {
    if (!problem?.trim() || !scratchpad?.trim()) {
      return NextResponse.json({ content: 'Write your working in the scratchpad first, then I can check it.' })
    }
    const userId = await getUserFromToken(req.headers.get('authorization'))
    if (userId) { const q = await checkQuota(userId); if (q) return NextResponse.json({ error: q }, { status: 429 }) }

    const checkPrompt = `You are a math tutor checking a student's work. ${bookTitle ? `From "${bookTitle}"${pageNum ? `, page ${pageNum}` : ''}.` : ''}${personaPrompt ? `\nPERSONALITY: ${personaPrompt}` : ''}

Problem:
${problem}

Student's working:
${scratchpad}

Check if the student's approach and answer are CORRECT. Respond with:
1. ✅ or ❌ — is the final answer correct?
2. Brief feedback on their approach (what's right, what's wrong)
3. If wrong: a gentle nudge toward what to fix WITHOUT giving the answer

Do NOT reveal the correct answer if they're wrong. Just point them in the right direction.

${MATH_SYNTAX}

Return ONLY the markdown content.`

    const useOpenRouter = requestProvider === 'openrouter' && process.env.OPENROUTER_API_KEY
    const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
    const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY! : process.env.OPENAI_API_KEY!
    const modelId = requestModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

    const cRes = await fetch(apiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, messages: [{ role: 'system', content: checkPrompt }], max_tokens: 800 }) })
    if (!cRes.ok) return NextResponse.json({ error: 'Check failed' }, { status: 500 })
    const cData = await cRes.json()
    let content = cData.choices?.[0]?.message?.content?.trim() ?? ''
    content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    if (userId) logUsage(userId, 0.002, { model: modelId, endpoint: 'problem-set-check' })
    return NextResponse.json({ content })
  }

  // Step mode: reveal just the next step of the solution
  if (mode === 'step') {
    if (!problem?.trim()) return NextResponse.json({ error: 'problem required' }, { status: 400 })
    const userId = await getUserFromToken(req.headers.get('authorization'))
    if (userId) { const q = await checkQuota(userId); if (q) return NextResponse.json({ error: q }, { status: 429 }) }

    const stepNum = (stepsRevealed ?? 0) + 1
    const prevContext = scratchpad?.trim() ? `\n\nStudent's working so far:\n${scratchpad}` : ''
    const spacesCtx = selectedSpaces?.length ? `\n\nPrevious steps already revealed:\n${selectedSpaces.map(s => s.content).join('\n\n')}` : ''

    const stepPrompt = `You are a math tutor revealing solutions ONE STEP AT A TIME. ${bookTitle ? `From "${bookTitle}"${pageNum ? `, page ${pageNum}` : ''}.` : ''}${personaPrompt ? `\nPERSONALITY: ${personaPrompt}` : ''}

Problem:
${problem}${prevContext}${spacesCtx}

Give ONLY step ${stepNum} of the solution. This should be a single logical step (one operation, one transformation, one key insight). Do NOT give subsequent steps.

If this is the final step, end with "**✓ Solution complete.**"

Format as:
## Step ${stepNum}
[content]

${MATH_SYNTAX}

Return ONLY the markdown content for this one step.`

    const useOpenRouter = requestProvider === 'openrouter' && process.env.OPENROUTER_API_KEY
    const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
    const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY! : process.env.OPENAI_API_KEY!
    const modelId = requestModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

    const sRes = await fetch(apiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, messages: [{ role: 'system', content: stepPrompt }], max_tokens: 600 }) })
    if (!sRes.ok) return NextResponse.json({ error: 'Step generation failed' }, { status: 500 })
    const sData = await sRes.json()
    let content = sData.choices?.[0]?.message?.content?.trim() ?? ''
    content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
    const isComplete = content.includes('Solution complete')
    if (userId) logUsage(userId, 0.002, { model: modelId, endpoint: 'problem-set-step' })
    return NextResponse.json({ content, isComplete })
  }

  if (!problem?.trim()) {
    return NextResponse.json({ error: 'problem required' }, { status: 400 })
  }

  // Quota enforcement
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }


  const personaLine = personaPrompt?.trim() ? `\n\nPERSONALITY: ${personaPrompt.trim()}\n` : ''
  const contextLine = bookTitle ? `From "${bookTitle}"${pageNum ? `, page ${pageNum}` : ''}.` : ''
  const spacesContext = selectedSpaces?.length
    ? `\n\nSelected solution spaces (use as context for your response):\n${selectedSpaces.map(s => `=== ${s.title} ===\n${s.content}`).join('\n\n')}`
    : ''
  const scratchpadContext = scratchpad?.trim()
    ? `\n\nStudent's working so far:\n${scratchpad}`
    : ''

  let systemPrompt: string

  if (mode === 'hint') {
    systemPrompt = `You are a math/science tutor. ${contextLine}${personaLine}

Problem:
${problem}${scratchpadContext}${spacesContext}

Generate a HINT — guide the student toward the right approach WITHOUT revealing the full answer or final result. If the student has written working above, acknowledge what they have right and gently point toward the next step. The hint should:
- Point out the key insight or first step
- Ask a guiding question if helpful
- Show partial working if needed (but stop before the answer)

${MATH_SYNTAX}

Return ONLY the markdown content. No code fences around the whole response.`
  } else if (mode === 'typeset') {
    const desc = instruction?.trim() || scratchpad?.trim() || ''
    systemPrompt = `You are a LaTeX formatter. ${contextLine}${personaLine}

Problem:
${problem}

The student has described their solution/working: "${desc}"

Format ONLY what the student described as beautiful markdown with LaTeX math. Do NOT solve the problem independently or add steps they didn't describe. Convert their plain English description and any math notation into proper LaTeX.

${MATH_SYNTAX}

Return ONLY the markdown content. No code fences around the whole response.`
  } else {
    const userInstruction = instruction?.trim() || 'Show a complete step-by-step solution'
    systemPrompt = `You are a math expert. ${contextLine}${personaLine}

Problem:
${problem}${scratchpadContext}${spacesContext}

Instruction: ${userInstruction}

Generate a clear, well-structured solution. Use ## Step 1, ## Step 2 etc. to organize multi-step solutions. Show all working.${scratchpad?.trim() ? ' The student has already attempted some working — you may build on or correct it.' : ''}

${MATH_SYNTAX}

Return ONLY the markdown content. No code fences around the whole response.`
  }

  const useOpenRouter = requestProvider === 'openrouter' && process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY! : process.env.OPENAI_API_KEY!
  const modelId = requestModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'system', content: systemPrompt }],
      max_tokens: 1200,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }

  const data = await res.json()
  let content = data.choices?.[0]?.message?.content?.trim() ?? ''
  content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
  if (userId) logUsage(userId, 0.002, { model: modelId, endpoint: 'problem-set-chat' })
  return NextResponse.json({ content })
}
