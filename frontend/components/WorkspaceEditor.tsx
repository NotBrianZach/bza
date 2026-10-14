'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vim } from '@replit/codemirror-vim'
import { emacs } from '@replit/codemirror-emacs'
import { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { authedFetch } from '@/lib/authedFetch'
import { Wand2, Loader2, Eye, EyeOff, Save, Sigma } from 'lucide-react'

// Normalize \( \) and \[ \] to $...$ / $$...$$ (matches other MathContent in the app)
function normalizeMath(s: string): string {
  return s
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
}

/**
 * Which modal keymap is in force.
 *
 * `vim` was the only option and was unconditional. Emacs keys are the same
 * mechanism from the same vendor — `@replit/codemirror-emacs` is a sibling of
 * `@replit/codemirror-vim`, which this editor was already proving works over
 * CodeMirror 6 — so adding it is a keymap choice rather than an integration.
 *
 * `none` is offered because a modal keymap nobody asked for is a trap: somebody
 * who does not know vim loses the ability to type `i`, and there was previously no
 * way out.
 */
type Keymap = 'vim' | 'emacs' | 'none'

const KEYMAP_STORAGE = 'bza_workspace_keymap'
const KEYMAPS: Keymap[] = ['vim', 'emacs', 'none']

/** The selection as it was typed, for the "compute this" action. */
function selectedText(view: EditorView | null): string {
  if (!view) return ''
  const { from, to } = view.state.selection.main
  return from === to ? '' : view.state.sliceDoc(from, to)
}

export default function WorkspaceEditor({ sessionId }: { sessionId: string | null }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOn, setPreviewOn] = useState(true)
  const [keymap, setKeymap] = useState<Keymap>('vim')
  const [computing, setComputing] = useState(false)
  const [computeNote, setComputeNote] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef('')
  const viewRef = useRef<EditorView | null>(null)

  // Read once on mount rather than on every render: localStorage is unavailable
  // during the server render, and reading it in a `useState` initialiser would
  // make the first client render disagree with the server's.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEYMAP_STORAGE) as Keymap | null
      if (stored && KEYMAPS.includes(stored)) setKeymap(stored)
    } catch {}
  }, [])

  const chooseKeymap = useCallback((next: Keymap) => {
    setKeymap(next)
    try { localStorage.setItem(KEYMAP_STORAGE, next) } catch {}
  }, [])

  const extensions = useMemo(() => [
    ...(keymap === 'vim' ? [vim()] : keymap === 'emacs' ? [emacs()] : []),
    markdown(),
    EditorView.lineWrapping,
  ], [keymap])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setLoading(true)
    authedFetch(`/api/browser-session/${sessionId}/workspace`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { const t = d.workspaceText ?? ''; setText(t); lastSaved.current = t } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [sessionId])

  // Debounced auto-save (2s after last edit)
  useEffect(() => {
    if (!sessionId) return
    if (text === lastSaved.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await authedFetch(`/api/browser-session/${sessionId}/workspace`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceText: text }),
        })
        lastSaved.current = text
      } finally { setSaving(false) }
    }, 2000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [text, sessionId])

  const translate = useCallback(async () => {
    if (!sessionId || !text.trim() || translating) return
    setTranslating(true)
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}/workspace`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (r.ok && d.text) setText(d.text)
    } finally { setTranslating(false) }
  }, [sessionId, text, translating])

  /**
   * The return leg: compute the selection exactly, and insert the LaTeX.
   *
   * Everything else in this editor's maths story is inbound — katex renders,
   * typst typesets, /api/typst-ai drafts, Mathpix ingests an image. Nothing fed
   * *computed output* back in, and the worker has returned a `latex` field on
   * every result all along, so the gap really was one field wide.
   *
   * What gets inserted is the answer, its retained domain conditions, and the run
   * id. The conditions are not optional decoration: `(x²−1)/(x−1) → x+1` is only
   * true away from x = 1, and a document that rendered the simplification without
   * the condition would be beautifully typeset and false.
   */
  const computeSelection = useCallback(async () => {
    const source = selectedText(viewRef.current)
    if (!source.trim()) {
      setComputeNote('Select an expression first.')
      return
    }
    setComputing(true)
    setComputeNote('')
    try {
      // Every free identifier in the selection is declared as a real symbol. The
      // worker refuses undeclared symbols by design — it will not invent one,
      // because `x` and `x` positive simplify differently — so something has to
      // declare them, and in a prose buffer the only available answer is "whatever
      // the selection mentions".
      const names = [...new Set(source.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [])]
        .filter(n => !['sqrt', 'exp', 'log', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
          'sinh', 'cosh', 'tanh', 'abs', 'factorial', 'gamma', 'pi', 'e', 'E', 'I'].includes(n))
      const r = await authedFetch('/api/learn/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'simplify',
          expression: source,
          variables: names.map(name => ({ name, assumptions: { real: true } })),
        }),
      })
      const d = await r.json()

      if (d.configured === false || d.error) {
        setComputeNote(d.error ?? 'nothing came back')
        return
      }

      const conditions: string[] = d.conditions ?? []
      const block = [
        '',
        `$$${d.latex ?? d.display ?? ''}$$`,
        conditions.length > 0 ? `_holds for ${conditions.join(', ')}_` : '',
        d.provenance?.runId
          ? `<!-- mathwb run ${d.provenance.runId}${d.evidenceKind ? ` · ${d.evidenceKind}` : ''} -->`
          : '',
        '',
      ].filter(Boolean).join('\n')

      const view = viewRef.current
      if (view) {
        const { to } = view.state.selection.main
        view.dispatch({ changes: { from: to, to, insert: block } })
        setText(view.state.doc.toString())
      }
      setComputeNote(
        conditions.length > 0
          ? `inserted · ${d.evidenceKind ?? 'result'} · conditions carried`
          : `inserted · ${d.evidenceKind ?? 'result'}`,
      )
    } catch (e) {
      setComputeNote(e instanceof Error ? e.message : 'the request failed')
    } finally {
      setComputing(false)
    }
  }, [])

  if (!sessionId) {
    return <div className='flex-1 flex items-center justify-center text-gray-500 text-sm p-4 text-center'>Start a session to open a workspace.</div>
  }

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      <div className='flex items-center gap-1 px-2 py-1.5 border-b border-gray-800 bg-gray-900 text-xs'>
        <button
          onClick={translate}
          disabled={translating || !text.trim()}
          title='Translate prose math to LaTeX'
          className='flex items-center gap-1 px-2 py-1 rounded bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white'
        >
          {translating ? <Loader2 size={12} className='animate-spin' /> : <Wand2 size={12} />} Translate → LaTeX
        </button>
        <button
          onClick={computeSelection}
          disabled={computing}
          title='Compute the selection exactly and insert the result as LaTeX, with its domain conditions'
          className='flex items-center gap-1 px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white'
        >
          {computing ? <Loader2 size={12} className='animate-spin' /> : <Sigma size={12} />} Compute selection
        </button>
        <button
          onClick={() => setPreviewOn(v => !v)}
          className='flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200'
          title={previewOn ? 'Hide preview' : 'Show preview'}
        >
          {previewOn ? <EyeOff size={12} /> : <Eye size={12} />} Preview
        </button>
        <select
          value={keymap}
          onChange={e => chooseKeymap(e.target.value as Keymap)}
          title='Which modal keymap the editor uses'
          className='px-1.5 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700'
        >
          <option value='vim'>vim keys</option>
          <option value='emacs'>emacs keys</option>
          <option value='none'>plain</option>
        </select>
        <span className='ml-auto text-[10px] text-gray-500 flex items-center gap-1'>
          {computeNote && <span className='text-gray-400'>{computeNote}</span>}
          {saving ? <><Loader2 size={10} className='animate-spin' /> saving…</> : (text === lastSaved.current ? <><Save size={10} /> saved</> : 'unsaved')}
        </span>
      </div>

      <div className={'flex-1 min-h-0 flex ' + (previewOn ? 'flex-col' : '')}>
        <div className={'overflow-auto ' + (previewOn ? 'flex-1 min-h-0 border-b border-gray-800' : 'flex-1')}>
          {loading ? (
            <div className='p-3 text-xs text-gray-400 flex items-center gap-2'><Loader2 size={12} className='animate-spin' /> Loading…</div>
          ) : (
            <CodeMirror
              value={text}
              onChange={setText}
              theme='dark'
              extensions={extensions}
              onCreateEditor={view => { viewRef.current = view }}
              basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: true }}
              style={{ fontSize: '13px' }}
            />
          )}
        </div>
        {previewOn && (
          <div className='flex-1 min-h-0 overflow-auto p-3 prose prose-invert prose-sm max-w-none bg-gray-950 text-gray-100'>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false } as any]]}
            >
              {normalizeMath(text) || '_(empty)_'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
