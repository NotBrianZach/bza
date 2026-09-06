'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, MessageSquare, ArrowUp, X, Rss, Pencil, Check, LayoutGrid, List, ImageIcon } from 'lucide-react'
import { booksQueries } from '@/lib/queries'
import { maybeAutoCover } from '@/lib/queries/images'
import { PinnedFeed, unpinFeed, setFeedExpanded, renameFeed } from '@/lib/pinnedFeeds'
import type { Book } from '@/types'
import { fetchFeed, fetchHNDiscussion, fetch4chanThreadMarkdown, fetchRedditDiscussion, FeedPost } from '@/lib/feedFetcher'

interface Props {
  feed: PinnedFeed
  isAuthenticated: boolean
  onUnpinned: () => void
  onRenamed?: (id: string, label: string) => void
  onBookAdded?: (book?: Book) => void
  expandSignal?: { open: boolean; v: number }
  globalCatalog?: boolean
  globalImages?: boolean
}

export default function HomeFeedSection({ feed, isAuthenticated, onUnpinned, onRenamed, onBookAdded, expandSignal, globalCatalog, globalImages }: Props) {
  const [collapsed, setCollapsed] = useState(!feed.expanded)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, number>>({})
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(feed.label)
  const [displayLabel, setDisplayLabel] = useState(feed.label)
  const [viewMode, setViewMode] = useState<'list' | 'catalog'>('list')
  const [showImages, setShowImages] = useState(false)

  const load = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      setPosts(await fetchFeed(feed.url))
      setLoaded(true)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [feed.url, loading])

  // Auto-load if starting expanded
  useEffect(() => {
    if (feed.expanded && !loaded) load()
  }, [])

  // Respond to open-all / close-all signal from parent
  useEffect(() => {
    if (!expandSignal || expandSignal.v === 0) return
    setCollapsed(!expandSignal.open)
    setFeedExpanded(feed.id, expandSignal.open)
    if (expandSignal.open && !loaded) load()
  }, [expandSignal?.v])

  // Respond to global catalog/image toggles from parent
  useEffect(() => { if (globalCatalog !== undefined) setViewMode(globalCatalog ? 'catalog' : 'list') }, [globalCatalog])
  useEffect(() => { if (globalImages !== undefined) setShowImages(globalImages) }, [globalImages])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    setFeedExpanded(feed.id, !next)
    if (!next && !loaded) load()
  }

  const commitRename = () => {
    const trimmed = labelDraft.trim()
    setEditingLabel(false)
    if (!trimmed || trimmed === displayLabel) return
    setDisplayLabel(trimmed)
    renameFeed(feed.id, trimmed)
    onRenamed?.(feed.id, trimmed)
  }

  const doAdd = async (post: FeedPost) => {
    setAdding(post.id)
    setAddErrors(prev => ({ ...prev, [post.id]: '' }))
    try {
      let markdown = ''
      let title = post.title

      if (post.source === '4chan' && post.board) {
        const threadId = post.url.match(/\/thread\/(\d+)/)?.[1] ?? post.id
        const result = await fetch4chanThreadMarkdown(post.board, threadId)
        title = result.title
        markdown = result.markdown
      } else if (post.source === 'hn') {
        const isExternalLink = post.url !== post.commentsUrl
        if (isExternalLink) {
          try {
            const res = await fetch('/api/fetch-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: post.url }),
            })
            const d = await res.json()
            if (!d.error && (d.markdown ?? d.content ?? '').length > 300) {
              title = d.title ?? title
              markdown = d.markdown ?? d.content ?? ''
            }
          } catch { /* fall through */ }
        }

        const discussion = await fetchHNDiscussion(post.id)
        if (!markdown) {
          markdown = `# ${post.title}\n\n**Source:** [${post.url}](${post.url})\n\n${
            post.body ? post.body + '\n\n' : '*Article could not be fetched — see discussion below.*\n\n'
          }${discussion}`
        } else {
          markdown += discussion
        }
      } else if (post.source === 'reddit' && post.subreddit) {
        const isExternal = post.url !== post.commentsUrl
        if (isExternal) {
          try {
            const res = await fetch('/api/fetch-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: post.url }),
            })
            const d = await res.json()
            if (!d.error && (d.markdown ?? d.content ?? '').length > 300) {
              title = d.title ?? title
              markdown = d.markdown ?? d.content ?? ''
            }
          } catch { /* fall through */ }
        }
        const discussion = await fetchRedditDiscussion(post.subreddit, post.id)
        if (!markdown) {
          markdown = `# ${title}\n\n${
            post.body ? post.body + '\n\n' : isExternal ? '*Article could not be fetched — see discussion below.*\n\n' : ''
          }${discussion}`
        } else {
          markdown += '\n\n' + discussion
        }
        if (!markdown || markdown.length < 80) throw new Error('Could not retrieve content')
      } else {
        if (post.body && post.body.length > 200) {
          markdown = `# ${title}\n\n${post.body}`
        }
        if (!markdown || markdown.length < 200) {
          const res = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: post.url }),
          })
          const d = await res.json()
          if (d.error) throw new Error(d.error)
          title = d.title ?? title
          markdown = d.markdown ?? d.content ?? ''
        }
        if (!markdown || markdown.length < 80) throw new Error('Could not retrieve article content')
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], 'article.md', { type: 'text/markdown' })
      let bookId: number
      const sourceUrl = post.commentsUrl ?? post.url
      if (isAuthenticated) {
        const book = await booksQueries.upload(file, { title, sourceUrl })
        bookId = book.id
        maybeAutoCover(book.id, title)
        setAddedIds(prev => ({ ...prev, [post.id]: bookId }))
        onBookAdded?.(book)
      } else {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const { saveLocalBook, saveBookContent } = await import('@/lib/localStorage')
        const nb = saveLocalBook({ user_id: '', title, file_path: 'local', total_pages: Math.ceil(text.length / 2000), summary: '' })
        await saveBookContent(nb.id, text)
        bookId = nb.id
        setAddedIds(prev => ({ ...prev, [post.id]: bookId }))
        onBookAdded?.()
      }
    } catch (e: any) {
      setAddErrors(prev => ({ ...prev, [post.id]: e.message ?? 'Failed to add' }))
    } finally {
      setAdding(null)
    }
  }

  const wrapClass = viewMode === 'catalog' && !collapsed
    ? 'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden col-span-full'
    : 'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'

  return (
    <div className={wrapClass}>
      <div className="flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group/header">
        {editingLabel ? (
          <div className="flex items-center gap-1.5 flex-1 px-4 py-2" onClick={e => e.stopPropagation()}>
            <Rss size={14} className="text-orange-500 flex-shrink-0" />
            <input
              autoFocus
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingLabel(false) }}
              onBlur={commitRename}
              className="input text-sm py-0.5 flex-1 min-w-0"
            />
            <button onClick={commitRename} className="p-0.5 text-green-600 flex-shrink-0"><Check size={13} /></button>
          </div>
        ) : (
          <button
            onClick={toggle}
            className="flex items-center gap-2 flex-1 px-4 py-3 text-left min-w-0"
          >
            <Rss size={14} className="text-orange-500 flex-shrink-0" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">{displayLabel}</span>
            {loading && <RefreshCw size={13} className="animate-spin text-gray-400" />}
            {collapsed
              ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              : <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
            }
          </button>
        )}
        {!editingLabel && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setViewMode(v => v === 'list' ? 'catalog' : 'list') }}
              title={viewMode === 'list' ? 'Catalog view' : 'List view'}
              className="px-2 py-3 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 opacity-0 group-hover/header:opacity-100 [@media(hover:none)]:opacity-100"
            >
              {viewMode === 'list' ? <LayoutGrid size={13} /> : <List size={13} />}
            </button>
            {posts.some(p => p.thumbnail) && (
              <button
                onClick={e => { e.stopPropagation(); setShowImages(v => !v) }}
                title={showImages ? 'Hide images' : 'Show images'}
                className={`px-2 py-3 transition-colors flex-shrink-0 opacity-0 group-hover/header:opacity-100 [@media(hover:none)]:opacity-100 ${showImages ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-500'}`}
              >
                <ImageIcon size={13} />
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); setLabelDraft(displayLabel); setEditingLabel(true) }}
              title="Rename feed"
              className="px-2 py-3 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 opacity-0 group-hover/header:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <Pencil size={12} />
            </button>
          </>
        )}
        <button
          onClick={() => { unpinFeed(feed.id); onUnpinned() }}
          className="px-3 py-3 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
          title="Remove feed"
        >
          <X size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {error && <p className="text-sm text-red-500 px-4 py-2">{error}</p>}
          {!error && posts.length > 0 ? (
            viewMode === 'catalog' ? (
              /* Catalog / grid view */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-3">
                {posts.map(post => {
                  const added = post.id in addedIds
                  const busy = adding === post.id
                  const err = addErrors[post.id]
                  return (
                    <div key={post.id} className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow overflow-hidden">
                      {showImages && post.thumbnail && (
                        <div className="w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden" style={{ maxHeight: 180 }}>
                          <img
                            src={post.thumbnail}
                            alt=""
                            className="w-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-3">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 mb-1.5">{post.title}</p>
                        {post.body && !post.board && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-2">{post.body.replace(/\n/g, ' ')}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                          {post.subreddit && <span className="text-red-500 font-medium">r/{post.subreddit}</span>}
                          {post.board && <span className="text-green-600 dark:text-green-400 font-medium">/{post.board}/</span>}
                          {post.date && <span>{new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                          {post.author && !post.board && <span>by {post.author}</span>}
                          {post.score != null && (
                            <span className="flex items-center gap-0.5">
                              <ArrowUp size={9} className="text-orange-400" />{post.score.toLocaleString()}
                            </span>
                          )}
                          {post.numComments != null && (
                            <span className="flex items-center gap-0.5">
                              <MessageSquare size={9} />{post.numComments.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex gap-2">
                          {post.url && post.url !== post.commentsUrl && (
                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 text-[10px] flex items-center gap-0.5" title="Article">
                              <ExternalLink size={11} /> Article
                            </a>
                          )}
                          {post.commentsUrl && (
                            <a href={post.commentsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 text-[10px] flex items-center gap-0.5" title="Discussion">
                              <MessageSquare size={11} /> Discussion
                            </a>
                          )}
                        </div>
                        {added ? (
                          <Link href={`/books/${addedIds[post.id]}`} className="text-xs text-primary-600 hover:underline font-medium">Open →</Link>
                        ) : (
                          <button
                            onClick={() => doAdd(post)}
                            disabled={busy || adding !== null}
                            className="btn btn-sm btn-primary text-xs py-1 px-2.5 disabled:opacity-50"
                          >
                            {busy ? <span className="spinner w-3 h-3" /> : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List / table view */
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '100%' }} />
                  <col style={{ width: '4rem' }} className="hidden sm:table-column" />
                  <col style={{ width: '3rem' }} className="hidden md:table-column" />
                  <col style={{ width: '5rem' }} />
                </colgroup>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {posts.map(post => {
                    const added = post.id in addedIds
                    const busy = adding === post.id
                    const err = addErrors[post.id]
                    return (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-3 py-2 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {showImages && post.thumbnail && (
                              <img
                                src={post.thumbnail}
                                alt=""
                                className="w-10 h-10 object-cover rounded flex-shrink-0"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug truncate">{post.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 min-w-0 overflow-hidden">
                                {post.subreddit && <span className="text-red-500 font-medium shrink-0">r/{post.subreddit}</span>}
                                {post.board && <span className="text-green-600 dark:text-green-400 font-medium shrink-0">/{post.board}/</span>}
                                {post.date && <span className="shrink-0">{new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                                {post.author && !post.board && <span className="truncate">by {post.author}</span>}
                                {!post.board && post.body && <span className="truncate italic">{post.body.replace(/\n/g, ' ')}</span>}
                              </div>
                              {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              {post.url && post.url !== post.commentsUrl && (
                                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500" title="Open article">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              {post.commentsUrl && (
                                <a href={post.commentsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-orange-500" title="Open discussion">
                                  <MessageSquare size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-2 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {post.score != null && (
                            <span className="flex items-center gap-0.5">
                              <ArrowUp size={11} className="text-orange-400" />{post.score.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-2 py-2 text-xs text-gray-400 whitespace-nowrap">
                          {post.numComments != null && post.numComments.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {added ? (
                            <Link href={`/books/${addedIds[post.id]}`} className="text-xs text-primary-600 hover:underline font-medium">Open →</Link>
                          ) : (
                            <button
                              onClick={() => doAdd(post)}
                              disabled={busy || adding !== null}
                              className="btn btn-sm btn-primary text-xs py-1 px-2.5 disabled:opacity-50"
                            >
                              {busy ? <span className="spinner w-3 h-3" /> : 'Add'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : !loading && !error && (
            <p className="text-sm text-gray-400 px-4 py-3">No posts loaded.</p>
          )}
        </div>
      )}
    </div>
  )
}
