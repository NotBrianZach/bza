'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, RefreshCw, ArrowUp, MessageSquare, Bookmark, BookmarkCheck, Filter } from 'lucide-react'
import { booksQueries } from '@/lib/queries/books'
import { maybeAutoCover } from '@/lib/queries/images'
import { pinFeed, isFeedPinned } from '@/lib/pinnedFeeds'
import { fetchFeed, fetchHNDiscussion, fetch4chanThreadMarkdown, fetchRedditDiscussion, FeedPost, FeedDiscoveryError } from '@/lib/feedFetcher'

interface Preset {
  id: string
  label: string
  url: string
  color: string
  group: string
}

const PRESETS: Preset[] = [
  // News
  { id: 'gn-top',   label: 'Google News',       url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',                              color: 'text-blue-500',   group: 'News' },
  { id: 'bbc',      label: 'BBC News',           url: 'https://feeds.bbci.co.uk/news/rss.xml',                                             color: 'text-red-600',    group: 'News' },
  { id: 'guardian', label: 'The Guardian',       url: 'https://www.theguardian.com/world/rss',                                             color: 'text-blue-700',   group: 'News' },
  { id: 'npr',      label: 'NPR',                url: 'https://feeds.npr.org/1001/rss.xml',                                                color: 'text-blue-600',   group: 'News' },
  // Tech
  { id: 'hn',       label: 'Hacker News',        url: 'feed://hn/top',                                                                      color: 'text-orange-600', group: 'Tech' },
  { id: 'ars',      label: 'Ars Technica',       url: 'https://feeds.arstechnica.com/arstechnica/index',                                   color: 'text-red-500',    group: 'Tech' },
  { id: 'r-prog',   label: 'r/programming',      url: 'feed://reddit/programming',                                                          color: 'text-red-500',    group: 'Tech' },
  { id: 'r-ml',     label: 'r/MachineLearning',  url: 'feed://reddit/MachineLearning',                                                      color: 'text-red-500',    group: 'Tech' },
  // Science / Ideas
  { id: 'arxiv-cs', label: 'arXiv CS.AI',        url: 'https://rss.arxiv.org/rss/cs.AI',                                                   color: 'text-amber-600',  group: 'Ideas' },
  { id: 'arxiv-ml', label: 'arXiv stat.ML',      url: 'https://rss.arxiv.org/rss/stat.ML',                                                 color: 'text-amber-600',  group: 'Ideas' },
  { id: 'arxiv-math', label: 'arXiv math',       url: 'https://rss.arxiv.org/rss/math',                                                    color: 'text-amber-600',  group: 'Ideas' },
  { id: 'lw',       label: 'LessWrong',          url: 'https://www.lesswrong.com/feed.xml?view=frontpage&karmaThreshold=50',               color: 'text-purple-500', group: 'Ideas' },
  // Boards
  { id: '4g',       label: '/g/',                url: 'feed://4chan/g',                                                                      color: 'text-green-600',  group: 'Boards' },
  { id: '4sci',     label: '/sci/',              url: 'feed://4chan/sci',                                                                    color: 'text-green-600',  group: 'Boards' },
  { id: '4lit',     label: '/lit/',              url: 'feed://4chan/lit',                                                                    color: 'text-green-600',  group: 'Boards' },
  { id: '4his',     label: '/his/',              url: 'feed://4chan/his',                                                                    color: 'text-green-600',  group: 'Boards' },
  // Poetry
  { id: 'r-poetry', label: 'r/poetry',           url: 'feed://reddit/poetry',                                                              color: 'text-red-500',    group: 'Poetry' },
  { id: 'r-haiku',  label: 'r/haiku',            url: 'feed://reddit/haiku',                                                               color: 'text-rose-400',   group: 'Poetry' },
  // Fiction
  { id: 'tor',      label: 'Tor.com',            url: 'https://www.tor.com/feed/',                                                         color: 'text-violet-500', group: 'Fiction' },
  { id: 'clarkesw', label: 'Clarkesworld',       url: 'https://clarkesworldmagazine.com/feed/',                                           color: 'text-violet-600', group: 'Fiction' },
  { id: 'dsf',      label: 'Daily Sci-Fi',       url: 'https://dailysciencefiction.com/rss',                                              color: 'text-violet-400', group: 'Fiction' },
  { id: 'r-ss',     label: 'r/shortstories',     url: 'feed://reddit/shortstories',                                                        color: 'text-red-500',    group: 'Fiction' },
  { id: 'r-wp',     label: 'r/WritingPrompts',   url: 'feed://reddit/WritingPrompts',                                                      color: 'text-red-500',    group: 'Fiction' },
]

const GROUPS = ['News', 'Tech', 'Ideas', 'Boards', 'Poetry', 'Fiction']

interface Props {
  isAuthenticated: boolean
  onBookAdded?: () => void
}

export default function FeedBrowser({ isAuthenticated, onBookAdded }: Props) {
  const [urlInput, setUrlInput] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Record<string, number>>({})
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [pinned, setPinned] = useState(false)
  const [filterPrompt, setFilterPrompt] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [discoveredFeeds, setDiscoveredFeeds] = useState<{ url: string; title: string }[]>([])

  const loadUrl = useCallback(async (url: string, id: string | null = null) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setPosts([])
    setDiscoveredFeeds([])
    setActiveId(id)
    setPinned(isFeedPinned(trimmed))
    try {
      setPosts(await fetchFeed(trimmed))
    } catch (e: any) {
      if (e instanceof FeedDiscoveryError && e.feedLinks.length > 0) {
        setDiscoveredFeeds(e.feedLinks)
        setError('Not an RSS feed — but found feeds on that page:')
      } else {
        setError(e.message ?? 'Failed to load feed')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChipClick = (preset: Preset) => {
    setUrlInput(preset.url)
    loadUrl(preset.url, preset.id)
  }

  const doAdd = async (post: FeedPost) => {
    setAdding(prev => new Set(prev).add(post.id))
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
        // Try to fetch the external article; if that fails, fall back to using
        // the HN discussion as the primary content.
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
          } catch { /* fall through to discussion-only */ }
        }

        // Always append HN comments
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
        // RSS — use feed body if it's substantial, otherwise fetch full article
        if (post.body && post.body.length > 500) {
          markdown = `# ${post.title}\n\n${post.body}`
        } else {
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

      // Apply content filter if set
      if (filterPrompt.trim()) {
        try {
          const tr = await fetch('/api/transform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown, prompt: filterPrompt.trim() }),
          })
          const td = await tr.json()
          if (td.markdown) markdown = td.markdown
        } catch { /* use unfiltered markdown */ }
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], 'article.md', { type: 'text/markdown' })

      let bookId: number
      const sourceUrl = post.commentsUrl ?? post.url
      if (isAuthenticated) {
        const book = await booksQueries.upload(file, { title, sourceUrl })
        bookId = book.id
        maybeAutoCover(book.id, title)
      } else {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const { saveLocalBook, saveBookContent } = await import('@/lib/localStorage')
        const nb = saveLocalBook({ user_id: '', title, file_path: 'local', total_pages: Math.ceil(text.length / 2000), summary: '' })
        await saveBookContent(nb.id, text)
        bookId = nb.id
      }

      setAddedIds(prev => ({ ...prev, [post.id]: bookId }))
      onBookAdded?.()
    } catch (e: any) {
      setAddErrors(prev => ({ ...prev, [post.id]: e.message ?? 'Failed to add' }))
    } finally {
      setAdding(prev => { const s = new Set(prev); s.delete(post.id); return s })
    }
  }

  return (
    <div className="space-y-3">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={e => { setUrlInput(e.target.value); setActiveId(null) }}
          onKeyDown={e => e.key === 'Enter' && loadUrl(urlInput)}
          placeholder="RSS feed URL — or click a preset below…"
          className="input text-sm flex-1 font-mono"
          spellCheck={false}
        />
        <button
          onClick={() => loadUrl(urlInput)}
          disabled={!urlInput.trim() || loading}
          className="btn btn-primary text-sm disabled:opacity-40"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Load'}
        </button>
      </div>

      {/* Preset chips grouped */}
      <div className="space-y-1.5">
        {GROUPS.map(group => (
          <div key={group} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-10 shrink-0">{group}</span>
            {PRESETS.filter(p => p.group === group).map(p => (
              <button
                key={p.id}
                onClick={() => handleChipClick(p)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  activeId === p.id
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
                }`}
              >
                <span className={`mr-1 font-bold ${p.color}`}>·</span>{p.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Google News hint */}
      <p className="text-xs text-gray-400">
        Tip: Google News supports topic/search RSS — e.g.{' '}
        <button
          className="text-blue-500 hover:underline font-mono"
          onClick={() => {
            const u = 'https://news.google.com/rss/search?q=climate+change&hl=en-US&gl=US&ceid=US:en'
            setUrlInput(u)
            loadUrl(u)
          }}
        >
          news.google.com/rss/search?q=…
        </button>
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {discoveredFeeds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {discoveredFeeds.map((feed, i) => (
            <button
              key={i}
              onClick={() => { setUrlInput(feed.url); loadUrl(feed.url) }}
              className="text-xs px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors font-mono truncate max-w-xs"
              title={feed.url}
            >
              {feed.title}
            </button>
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors shrink-0 ${
                filterPrompt.trim()
                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              <Filter size={11} />
              {filterPrompt.trim() ? 'Filter active' : 'Filter'}
            </button>
            {filtersOpen && (
              <div className="flex gap-1 flex-wrap">
                {[
                  'Remove low-effort comments',
                  'Remove political bias',
                  'Remove spam & off-topic',
                  'Keep only top-voted comments',
                  'Summarize the discussion',
                ].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setFilterPrompt(preset)}
                    className="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filtersOpen && (
            <div className="flex gap-2">
              <input
                type="text"
                value={filterPrompt}
                onChange={e => setFilterPrompt(e.target.value)}
                placeholder="Describe what to filter or transform (e.g. remove low effort comments)…"
                className="input text-xs flex-1 py-1.5"
              />
              {filterPrompt && (
                <button onClick={() => setFilterPrompt('')} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
          <span className="text-xs text-indigo-600 dark:text-indigo-300">{posts.length} posts loaded</span>
          <button
            onClick={() => {
              const url = urlInput.trim()
              const label = PRESETS.find(p => p.url === url)?.label
                ?? url.match(/^feed:\/\/4chan\/(.+)/)?.[1] && `4chan/${url.match(/^feed:\/\/4chan\/(.+)/)![1]}`
                ?? url.match(/^feed:\/\/reddit\/(.+)/)?.[1] && `r/${url.match(/^feed:\/\/reddit\/(.+)/)![1]}`
                ?? url.replace(/^feed:\/\//, '').replace(/^https?:\/\//, '').split('/')[0]
              pinFeed(label, urlInput.trim())
              setPinned(true)
            }}
            disabled={pinned}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors disabled:cursor-default bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-green-600"
          >
            {pinned ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            {pinned ? 'Added to homepage ✓' : 'Save feed to homepage'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</th>
                <th className="hidden sm:table-cell text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-20">Score</th>
                <th className="hidden md:table-cell text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16">💬</th>
                <th className="text-right px-3 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {posts.map(post => {
                const added = post.id in addedIds
                const busy = adding.has(post.id)
                const err = addErrors[post.id]
                return (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-2.5 min-w-0">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {post.subreddit && <span className="text-xs text-red-500 font-medium">r/{post.subreddit}</span>}
                            {post.board && <span className="text-xs text-green-600 dark:text-green-400 font-medium">/{post.board}/</span>}
                            {post.date && (
                              <span className="text-xs text-gray-400">
                                {new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {post.author && <span className="text-xs text-gray-400 truncate">by {post.author}</span>}
                          </div>
                          {post.body && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 italic">{post.body.replace(/\n/g, ' ')}</p>
                          )}
                          {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                        </div>
                        <div className="flex gap-1.5 shrink-0 mt-0.5">
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
                    <td className="hidden sm:table-cell px-2 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {post.score != null && (
                        <span className="flex items-center gap-0.5">
                          <ArrowUp size={11} className="text-orange-400" />{post.score.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-2 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {post.numComments != null && post.numComments.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {added ? (
                        <Link href={`/books/${addedIds[post.id]}`} className="text-xs text-primary-600 hover:underline font-medium">Open →</Link>
                      ) : (
                        <button
                          onClick={() => doAdd(post)}
                          disabled={busy}
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
        </div>
      )}
    </div>
  )
}
