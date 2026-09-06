'use client'
import { useRouter } from 'next/navigation'
import { Globe, Camera, Bookmark } from 'lucide-react'

interface Session {
  id: string
  title?: string | null
  url_last_seen?: string | null
  started_at: string
  ended_at?: string | null
  provider: string
  captureCount?: number
  bookmarkCount?: number
}

export default function SessionCard({ session, onClick }: { session: Session; onClick?: () => void }) {
  const router = useRouter()
  const displayTitle = session.title || (session.url_last_seen ? new URL(session.url_last_seen).hostname : 'Browsing session')
  const when = new Date(session.started_at).toLocaleDateString()
  const active = !session.ended_at

  return (
    <button
      onClick={onClick ?? (() => router.push(session.url_last_seen ? ('/site?url=' + encodeURIComponent(session.url_last_seen)) : '/site'))}
      className='text-left bg-gradient-to-br from-teal-900/40 to-teal-950/60 dark:from-teal-900/40 dark:to-gray-900 border border-teal-800/40 hover:border-teal-500 rounded-xl p-4 transition-all group flex flex-col justify-between h-full min-h-[160px]'
    >
      <div className='flex items-start gap-2 mb-2'>
        <div className='p-1.5 rounded bg-teal-800/60 text-teal-200'>
          <Globe size={16} />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='font-semibold text-gray-100 truncate'>{displayTitle}</div>
          <div className='text-xs text-gray-400 truncate'>{session.url_last_seen ?? ''}</div>
        </div>
        {active && <span className='text-[10px] px-1.5 py-0.5 rounded bg-green-700/60 text-green-100 font-semibold'>ACTIVE</span>}
      </div>
      <div className='flex items-center gap-3 text-xs text-gray-400 mt-auto'>
        <span>{when}</span>
        {typeof session.captureCount === 'number' && session.captureCount > 0 && (
          <span className='flex items-center gap-1'><Camera size={11} /> {session.captureCount}</span>
        )}
        {typeof session.bookmarkCount === 'number' && session.bookmarkCount > 0 && (
          <span className='flex items-center gap-1'><Bookmark size={11} /> {session.bookmarkCount}</span>
        )}
        <span className='ml-auto text-gray-500 font-mono text-[10px]'>{session.provider}</span>
      </div>
    </button>
  )
}
