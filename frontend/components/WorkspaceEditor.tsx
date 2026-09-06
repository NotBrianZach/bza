'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vim } from '@replit/codemirror-vim'
import { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { authedFetch } from '@/lib/authedFetch'
import { Wand2, Loader2, Eye, EyeOff, Save } from 'lucide-react'

// Normalize \( \) and \[ \] to $...$ / $$...$$ (matches other MathContent in the app)
function normalizeMath(s: string): string {
  return s
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
}

export default function WorkspaceEditor({ sessionId }: { sessionId: string | null }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOn, setPreviewOn] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef('')

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
          onClick={() => setPreviewOn(v => !v)}
          className='flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200'
          title={previewOn ? 'Hide preview' : 'Show preview'}
        >
          {previewOn ? <EyeOff size={12} /> : <Eye size={12} />} Preview
        </button>
        <span className='ml-auto text-[10px] text-gray-500 flex items-center gap-1'>
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
              extensions={[vim(), markdown(), EditorView.lineWrapping]}
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
