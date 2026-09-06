'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import { booksQueries } from '@/lib/queries'
import { getLocalBooks, deleteLocalBook, getStorageUsage } from '@/lib/localStorage'
import BookCard from '@/components/BookCard'
import BookUpload from '@/components/BookUpload'
import SessionCard from '@/components/SessionCard'
import { authedFetch } from '@/lib/authedFetch'
import { Plus, BookOpen, TrendingUp, Image as ImageIcon, Users, AlertCircle, HardDrive, Cloud, CreditCard, Loader2, Globe } from 'lucide-react'
import { billingQueries } from '@/lib/queries'
import { ThemeToggle } from '@/components/ThemeProvider'
import DiveBackIn from '@/components/DiveBackIn'

export default function DashboardPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 })
  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // supabase.auth.getSession() can hang indefinitely on some versions when using
      // the new sb_publishable_* key format due to the navigator.locks mechanism.
      // Race against a 4-second timeout and treat a hang as "no session".
      const noSession = { data: { session: null }, error: null } as const
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<typeof noSession>(resolve =>
          setTimeout(() => resolve(noSession), 4000)
        ),
      ])

      if (session) {
        setIsAuthenticated(true)
        const books = await booksQueries.list()
        setBooks(books)
        try {
          const sr = await authedFetch('/api/browser-session/list')
          if (sr.ok) { const sd = await sr.json(); setSessions(sd.sessions ?? []) }
        } catch {}
      } else {
        setIsAuthenticated(false)
        setBooks(getLocalBooks())
        getStorageUsage().then(setStorageUsage)
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setBooks(getLocalBooks())
      setIsAuthenticated(false)
      getStorageUsage().then(setStorageUsage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (bookId: number) => {
    try {
      if (isAuthenticated) {
        await booksQueries.trash(bookId)
      } else {
        deleteLocalBook(bookId)
      }
      setBooks(books.filter(b => b.id !== bookId))
      if (!isAuthenticated) {
        getStorageUsage().then(setStorageUsage)
      }
    } catch (err: any) {
      console.error('Error deleting book:', err)
      alert('Failed to move book to trash')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <BookUpload
          useLocalStorage={!isAuthenticated}
          onSuccess={() => {
            setShowUpload(false)
            checkAuthAndLoadData()
          }}
          onCancel={() => setShowUpload(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Library</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    try {
                      setIsBillingRedirecting(true)
                      const url = await billingQueries.createPortalSession()
                      window.location.href = url
                    } catch {
                      // No portal session (not yet a Stripe customer) — go to billing page instead
                      router.push('/billing')
                    } finally {
                      setIsBillingRedirecting(false)
                    }
                  }}
                  disabled={isBillingRedirecting}
                  className="btn btn-secondary text-sm"
                >
                  {isBillingRedirecting
                    ? <Loader2 size={16} className="animate-spin mr-2" />
                    : <CreditCard size={16} className="mr-2" />}
                  Account &amp; Billing
                </button>
              ) : (
                <a
                  href="/auth/signup"
                  className="btn btn-secondary text-sm"
                  title="Upgrade to Pro for cloud storage"
                >
                  <Cloud size={16} className="mr-2" />
                  Upgrade to Pro
                </a>
              )}

              <button
                onClick={() => setShowUpload(true)}
                className="btn btn-primary"
              >
                <Plus size={20} className="mr-2" />
                Upload Book
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Free Tier Notice */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <HardDrive className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  You're using the <strong>Free Tier</strong> - books stored in your browser
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Storage: {(storageUsage.used / 1024 / 1024).toFixed(2)} MB used locally
                </p>
                {storageUsage.percentage > 80 && (
                  <p className="text-sm text-orange-700 mt-2 font-medium">
                    ⚠️ Storage almost full! <a href="/auth/signup" className="underline">Upgrade to Pro</a> for unlimited cloud storage.
                  </p>
                )}
              </div>
              <a
                href="/auth/signup"
                className="btn btn-sm btn-primary whitespace-nowrap"
              >
                Upgrade to Cloud
              </a>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen size={24} />}
            title="Books"
            value={books.length.toString()}
            subtitle={isAuthenticated ? "Cloud storage" : "Local storage"}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            title="Storage"
            value={isAuthenticated ? "Unlimited" : `${(storageUsage.used / 1024 / 1024).toFixed(1)} MB`}
            subtitle={isAuthenticated ? "Pro tier" : "Browser storage"}
            color="green"
          />
          <StatCard
            icon={<ImageIcon size={24} />}
            title="AI Features"
            value={isAuthenticated ? "Unlimited" : "$5/mo limit"}
            subtitle="Chat, images, analysis"
            color="purple"
          />
          <StatCard
            icon={<Users size={24} />}
            title="Plan"
            value={isAuthenticated ? "Pro" : "Free"}
            subtitle={isAuthenticated ? "Manage billing →" : "Local only"}
            color="pink"
            href={isAuthenticated ? "/billing" : undefined}
          />
        </div>

        {/* Dive Back In */}
        {isAuthenticated && (
          <div className="mb-6">
            <DiveBackIn hasBooks={books.length > 0} onUpload={() => setShowUpload(true)} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {(() => {
          type LibItem =
            | { kind: 'book'; id: number; item: any; ts: number }
            | { kind: 'session'; id: string; item: any; ts: number }
          const items: LibItem[] = [
            ...books.map(b => ({ kind: 'book' as const, id: b.id, item: b, ts: new Date((b as any).updated_at ?? (b as any).created_at ?? 0).getTime() })),
            ...(isAuthenticated ? sessions.map(s => ({ kind: 'session' as const, id: s.id, item: s, ts: new Date(s.started_at ?? 0).getTime() })) : []),
          ].sort((a, b) => b.ts - a.ts)

          if (items.length === 0) {
            return (
              <div className="text-center py-16">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No books yet</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Upload your first book to start enhancing your reading with AI
                </p>
                <button onClick={() => setShowUpload(true)} className="btn btn-primary">
                  <Plus size={20} className="mr-2" />
                  Upload Your First Book
                </button>
              </div>
            )
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(it => it.kind === 'book'
                ? <BookCard key={'b-' + it.id} book={it.item} onDelete={handleDelete} />
                : <SessionCard key={'s-' + it.id} session={it.item} />
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, subtitle, color, href }: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'pink'
  href?: string
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
  }

  const inner = (
    <>
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </>
  )

  if (href) {
    return <a href={href} className="card hover:shadow-md transition-shadow">{inner}</a>
  }
  return <div className="card">{inner}</div>
}
