/**
 * LocalStorage Manager for Free Tier
 * Stores books, bookmarks, and progress in browser storage
 * No authentication required!
 */

import { Book, Bookmark, ReadingProgress } from '@/types'

const STORAGE_KEYS = {
  BOOKS: 'bza_books',
  BOOKMARKS: 'bza_bookmarks',
  PROGRESS: 'bza_progress',
  USER_ID: 'bza_anonymous_id',
}

// Generate anonymous user ID for tracking
export function getAnonymousUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)

  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
  }

  return userId
}

// Books Management
export function getLocalBooks(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading books from localStorage:', error)
    return []
  }
}

export function saveLocalBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Book {
  const books = getLocalBooks()
  const newBook: Book = {
    ...book,
    id: Date.now(),
    user_id: getAnonymousUserId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  books.push(newBook)
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books))

  return newBook
}

export function getLocalBook(bookId: number): Book | null {
  const books = getLocalBooks()
  return books.find(b => b.id === bookId) || null
}

export function updateLocalBook(bookId: number, updates: Partial<Book>): void {
  const books = getLocalBooks()
  const index = books.findIndex(b => b.id === bookId)

  if (index !== -1) {
    books[index] = {
      ...books[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books))
  }
}

export function deleteLocalBook(bookId: number): void {
  const books = getLocalBooks()
  const filtered = books.filter(b => b.id !== bookId)
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(filtered))

  // Also delete associated bookmarks and progress
  deleteBookmarksForBook(bookId)
  deleteProgressForBook(bookId)
}

// Bookmarks Management
export function getLocalBookmarks(bookId?: number): Bookmark[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS)
    const allBookmarks: Bookmark[] = data ? JSON.parse(data) : []

    if (bookId) {
      return allBookmarks.filter(b => b.book_id === bookId)
    }

    return allBookmarks
  } catch (error) {
    console.error('Error loading bookmarks from localStorage:', error)
    return []
  }
}

export function saveLocalBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at'>): Bookmark {
  const bookmarks = getLocalBookmarks()
  const newBookmark: Bookmark = {
    ...bookmark,
    id: Date.now(),
    created_at: new Date().toISOString(),
  }

  bookmarks.push(newBookmark)
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks))

  return newBookmark
}

export function updateLocalBookmark(bookmarkId: number, updates: Partial<Bookmark>): void {
  const bookmarks = getLocalBookmarks()
  const index = bookmarks.findIndex(b => b.id === bookmarkId)

  if (index !== -1) {
    bookmarks[index] = { ...bookmarks[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks))
  }
}

export function deleteLocalBookmark(bookmarkId: number): void {
  const bookmarks = getLocalBookmarks()
  const filtered = bookmarks.filter(b => b.id !== bookmarkId)
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered))
}

function deleteBookmarksForBook(bookId: number): void {
  const bookmarks = getLocalBookmarks()
  const filtered = bookmarks.filter(b => b.book_id !== bookId)
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered))
}

// Reading Progress Management
interface StoredProgress {
  book_id: number
  current_page: number
  last_read_at: string
  reading_time_minutes: number
}

export function getLocalProgress(bookId: number): ReadingProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS)
    const allProgress: StoredProgress[] = data ? JSON.parse(data) : []
    const progress = allProgress.find(p => p.book_id === bookId)

    if (!progress) return null

    const book = getLocalBook(bookId)
    if (!book) return null

    return {
      book_id: bookId,
      current_page: progress.current_page,
      total_pages: book.total_pages,
      progress_percentage: (progress.current_page / book.total_pages) * 100,
      last_read_at: progress.last_read_at,
      reading_time_minutes: progress.reading_time_minutes,
    }
  } catch (error) {
    console.error('Error loading progress from localStorage:', error)
    return null
  }
}

export function saveLocalProgress(bookId: number, currentPage: number): void {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS)
    const allProgress: StoredProgress[] = data ? JSON.parse(data) : []

    const index = allProgress.findIndex(p => p.book_id === bookId)
    const progressData: StoredProgress = {
      book_id: bookId,
      current_page: currentPage,
      last_read_at: new Date().toISOString(),
      reading_time_minutes: index !== -1 ? allProgress[index].reading_time_minutes + 1 : 1,
    }

    if (index !== -1) {
      allProgress[index] = progressData
    } else {
      allProgress.push(progressData)
    }

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress))
  } catch (error) {
    console.error('Error saving progress to localStorage:', error)
  }
}

function deleteProgressForBook(bookId: number): void {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS)
  const allProgress: StoredProgress[] = data ? JSON.parse(data) : []
  const filtered = allProgress.filter(p => p.book_id !== bookId)
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(filtered))
}

// Book Content Storage — uses IndexedDB for large text (no 5MB limit)
const IDB_NAME = 'bza_books_db'
const IDB_STORE = 'content'
const IDB_MANGA_STORE = 'manga_pages'
const IDB_VERSION = 2

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
      if (!db.objectStoreNames.contains(IDB_MANGA_STORE)) {
        db.createObjectStore(IDB_MANGA_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveBookContent(bookId: number, content: string): Promise<void> {
  try {
    const db = await openIDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(content, `book_${bookId}`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    // Fallback to localStorage for very old browsers without IndexedDB
    try {
      localStorage.setItem(`bza_book_content_${bookId}`, content)
    } catch {
      throw new Error('Unable to save book content. Your browser may be in private mode or out of storage.')
    }
  }
}

export async function getBookContent(bookId: number): Promise<string | null> {
  try {
    const db = await openIDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(`book_${bookId}`)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    // Fallback: check localStorage (migrates old data)
    return localStorage.getItem(`bza_book_content_${bookId}`)
  }
}

export async function deleteBookContent(bookId: number): Promise<void> {
  try {
    const db = await openIDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(`book_${bookId}`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    localStorage.removeItem(`bza_book_content_${bookId}`)
  }
}

/** Migrate any book content from localStorage to IndexedDB (call once on app init) */
export async function migrateContentToIDB(): Promise<void> {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('bza_book_content_'))
  if (keys.length === 0) return
  try {
    const db = await openIDB()
    for (const key of keys) {
      const bookId = parseInt(key.replace('bza_book_content_', ''))
      const content = localStorage.getItem(key)
      if (content) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, 'readwrite')
          tx.objectStore(IDB_STORE).put(content, `book_${bookId}`)
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Migration failed — content stays in localStorage, no data loss
  }
}

// Manga page image storage (IndexedDB) — stores Blobs keyed by "bookId_pageNum"
export async function saveMangaPage(bookId: number, pageNum: number, blob: Blob): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_MANGA_STORE, 'readwrite')
    tx.objectStore(IDB_MANGA_STORE).put(blob, `${bookId}_${pageNum}`)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMangaPage(bookId: number, pageNum: number): Promise<Blob | null> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_MANGA_STORE, 'readonly')
    const req = tx.objectStore(IDB_MANGA_STORE).get(`${bookId}_${pageNum}`)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function getMangaPageUrl(bookId: number, pageNum: number): Promise<string | null> {
  const blob = await getMangaPage(bookId, pageNum)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

// Storage Usage Stats (localStorage metadata only — book content is in IndexedDB with much higher limits)
export async function getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
  // Try navigator.storage.estimate() for real quota info (IndexedDB + all storage)
  if (navigator?.storage?.estimate) {
    const est = await navigator.storage.estimate()
    return {
      used: est.usage ?? 0,
      total: est.quota ?? 500 * 1024 * 1024,
      percentage: ((est.usage ?? 0) / (est.quota ?? 1)) * 100,
    }
  }
  // Fallback: localStorage only
  let used = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length
    }
  }
  const total = 5 * 1024 * 1024
  return { used, total, percentage: (used / total) * 100 }
}

// Clear all local data
export async function clearAllLocalData(): Promise<void> {
  if (confirm('This will delete all your locally stored books and data. This cannot be undone. Continue?')) {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    // Remove book content from IndexedDB
    try {
      const books = getLocalBooks()
      for (const book of books) {
        await deleteBookContent(book.id)
      }
    } catch {}

    window.location.reload()
  }
}

// Export data as JSON (for backup/migration)
export function exportLocalData(): string {
  return JSON.stringify({
    books: getLocalBooks(),
    bookmarks: getLocalBookmarks(),
    progress: localStorage.getItem(STORAGE_KEYS.PROGRESS),
    exportedAt: new Date().toISOString(),
  }, null, 2)
}

// Import data from JSON
export function importLocalData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData)

    if (data.books) {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(data.books))
    }
    if (data.bookmarks) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(data.bookmarks))
    }
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, data.progress)
    }

    alert('Data imported successfully!')
    window.location.reload()
  } catch (error) {
    alert('Error importing data. Please check the file format.')
    console.error('Import error:', error)
  }
}
