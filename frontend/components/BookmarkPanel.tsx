'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/types'
import { bookmarksQueries, PageBookmark } from '@/lib/queries'
import { Bookmark as BookmarkIcon, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'

interface BookmarkPanelProps {
  book: Book
  currentPage?: number
  onNavigate?: (page: number) => void
}

export default function BookmarkPanel({ book, currentPage, onNavigate }: BookmarkPanelProps) {
  const [bookmarks, setBookmarks] = useState<PageBookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ page_number: currentPage ?? 1, note: '' })

  useEffect(() => { loadBookmarks() }, [book.id])

  // Keep form page in sync with reading position when form is closed
  useEffect(() => {
    if (!showAddForm) setFormData(d => ({ ...d, page_number: currentPage ?? 1 }))
  }, [currentPage, showAddForm])

  const openAddForm = () => {
    setFormData({ page_number: currentPage ?? 1, note: '' })
    setShowAddForm(true)
  }

  const loadBookmarks = async () => {
    try {
      setIsLoading(true)
      const data = await bookmarksQueries.list(book.id)
      setBookmarks(data)
    } catch (err) {
      console.error('Error loading bookmarks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await bookmarksQueries.add(book.id, formData.page_number, formData.note || undefined)
      setShowAddForm(false)
      await loadBookmarks()
    } catch (err: any) {
      alert(err.message || 'Failed to add bookmark')
    }
  }

  const handleUpdateNote = async (bookmarkId: number) => {
    try {
      await bookmarksQueries.update(bookmarkId, formData.note)
      setEditingId(null)
      await loadBookmarks()
    } catch (err: any) {
      alert(err.message || 'Failed to update bookmark')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookmarkIcon size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Bookmarks</h3>
          </div>
          <button onClick={openAddForm} className="btn btn-sm btn-primary">
            <Plus size={16} />
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddBookmark} className="mt-3 space-y-2">
            <input
              type="number"
              placeholder="Page number"
              value={formData.page_number}
              onChange={e => setFormData({ ...formData, page_number: parseInt(e.target.value) })}
              min={1} max={book.total_pages}
              className="input w-full text-sm" required
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="input w-full text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-sm btn-primary flex-1">Add Bookmark</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-sm btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {bookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div className="text-gray-500 dark:text-gray-400">
              <BookmarkIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No bookmarks yet</p>
              <p className="text-xs mt-1">Add bookmarks to mark important pages</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {bookmarks.map(bookmark => {
              const editingNote = editingId === bookmark.id
              return (
                <div key={bookmark.id} className="card p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate?.(bookmark.page_num)}
                        disabled={!onNavigate}
                        title={onNavigate ? `Go to page ${bookmark.page_num}` : undefined}
                        className={`w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded flex items-center justify-center text-sm font-semibold flex-shrink-0 ${onNavigate ? 'hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors cursor-pointer' : ''}`}
                      >
                        {bookmark.page_num}
                      </button>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(new Date(bookmark.created_at))}
                      </div>
                    </div>
                    {!editingNote && (
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => { setEditingId(bookmark.id); setFormData({ page_number: bookmark.page_num, note: bookmark.note ?? '' }) }}
                          className="text-gray-400 hover:text-blue-600 p-1" title="Edit note"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={async () => { if (confirm('Delete this bookmark?')) { await bookmarksQueries.remove(bookmark.id); await loadBookmarks() } }}
                          className="text-gray-400 hover:text-red-600 p-1" title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingNote ? (
                    <div className="space-y-1.5 mt-2">
                      <input
                        type="text"
                        value={formData.note}
                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                        className="input w-full text-sm"
                        placeholder="Edit note…"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateNote(bookmark.id)} className="btn btn-sm btn-primary flex-1"><Check size={13} className="mr-1" />Save</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-sm btn-secondary"><X size={13} /></button>
                      </div>
                    </div>
                  ) : bookmark.note && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-snug">{bookmark.note}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
