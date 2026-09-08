'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { booksQueries } from '@/lib/queries'
import { maybeAutoCover } from '@/lib/queries/images'
import { maybeAutoScore } from '@/lib/queries/scores'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'
import { track } from '@/lib/analytics'
import { UpgradeReason } from '../UpgradeGate'
import { PdfMethodSelector } from './PdfMethodSelector'
import {
  ContentType,
  CONTENT_TYPE_OPTIONS,
  ProcessingMethod,
  STATUS_LABELS,
  STATUS_PROGRESS,
} from './types'

interface FileTabProps {
  useLocalStorage: boolean
  isPro: boolean
  title: string
  onTitleChange: (t: string) => void
  contentType: ContentType
  onContentTypeChange: (t: ContentType) => void
  onError: (msg: string | null) => void
  onGateReason: (r: UpgradeReason | null) => void
  onSuccess?: () => void
  onCancel?: () => void
}

export function FileTab({
  useLocalStorage, isPro, title, onTitleChange, contentType, onContentTypeChange,
  onError, onGateReason, onSuccess, onCancel,
}: FileTabProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('Uploading...')
  const [progress, setProgress] = useState(0)
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('jina')
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])

  const advanceProgress = (status: string) => {
    const target = STATUS_PROGRESS[status] ?? 0
    setProgress(prev => Math.max(prev, target))

    if (status === 'processing') {
      if (!progressTimerRef.current) {
        progressTimerRef.current = setInterval(() => {
          setProgress(prev => prev >= 70 ? prev : prev + (70 - prev) * 0.015)
        }, 1000)
      }
    } else {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase()

      if (contentType === 'manga') {
        if (!['pdf', 'png', 'jpg', 'jpeg', 'webp', 'zip'].includes(ext || '')) {
          onError('Manga: Supported file types: PDF, PNG, JPG, WEBP, ZIP')
          return
        }
      } else if (useLocalStorage) {
        if (!['pdf', 'txt', 'md'].includes(ext || '')) {
          onError('Supported file types: PDF, TXT, MD')
          return
        }
      } else {
        if (!['pdf', 'epub', 'txt', 'md'].includes(ext || '')) {
          onError('Invalid file type. Supported: PDF, EPUB, TXT, MD')
          return
        }
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        onError('File too large. Maximum size: 50MB')
        return
      }

      setFile(selectedFile)
      onError(null)

      if (!title) {
        const filename = selectedFile.name.replace(/\.[^/.]+$/, '')
        onTitleChange(filename)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) { onError('Please select a file'); return }
    if (!title.trim()) { onError('Please enter a title'); return }

    try {
      onError(null)
      setIsUploading(true)
      setProgress(0)

      if (useLocalStorage) {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const fileText = await fileToText(file)

        const newBook = saveLocalBook({
          user_id: '',
          title: title.trim(),
          file_path: 'local',
          total_pages: Math.ceil(fileText.length / 2000),
          summary: summary.trim() || undefined,
        })

        saveBookContent(newBook.id, fileText)
        track('book_upload', { source: 'file-local', content_type: contentType, ext: file.name.split('.').pop() })

        if (onSuccess) onSuccess()
        else router.push(`/books/${newBook.id}`)
      } else {
        const book = await booksQueries.upload(file, {
          title: title.trim(),
          articleType: contentType,
          processingMethod: file.name.toLowerCase().endsWith('.pdf') ? processingMethod : undefined,
          onStatus: (s) => {
            setUploadLabel(STATUS_LABELS[s] ?? 'Processing...')
            advanceProgress(s)
          },
          onProgress: (workerPct) => {
            if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
            const barPct = 15 + Math.round(workerPct * 55 / 100)
            setProgress(prev => Math.max(prev, barPct))
          },
        })
        maybeAutoCover(book.id, title.trim(), summary.trim() || undefined)
        booksQueries.getContent(book.file_path).then(c => maybeAutoScore(book.id, c)).catch(() => {})
        track('book_upload', { source: 'file-remote', content_type: contentType, ext: file.name.split('.').pop() })

        if (onSuccess) onSuccess()
        else { router.push(`/books/${book.id}`); router.refresh() }
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      const msg = err?.message ?? ''
      if (msg.includes('quota exceeded')) {
        onError('Book quota exceeded. Upgrade to Pro for unlimited books.')
        onGateReason('book_quota')
      } else if (msg.includes('too large') || err?.name === 'QuotaExceededError' || msg.includes('exceeded the quota')) {
        onError('Book too large for browser storage. Please upgrade to Pro for unlimited cloud storage.')
        onGateReason('storage_full')
      } else {
        onError(msg || 'Failed to upload book')
      }
    } finally {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Book File *
        </label>
        <div className="relative">
          <input
            type="file"
            accept={contentType === 'manga'
              ? ".pdf,.png,.jpg,.jpeg,.webp,.zip,image/*,application/pdf,application/zip"
              : useLocalStorage
              ? ".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              : ".pdf,.epub,.txt,.md,application/pdf,application/epub+zip,text/plain,text/markdown"}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id="book-file"
          />
          <label
            htmlFor="book-file"
            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div className="text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              {file ? (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {useLocalStorage ? 'PDF, TXT, or MD (max 50MB)' : 'PDF, EPUB, TXT, or MD (max 50MB)'}
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isUploading}
          className="input"
          placeholder="Enter book title"
          required
        />
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Summary (optional)
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={isUploading}
          className="input"
          rows={3}
          placeholder="Brief description of the book"
        />
      </div>

      {/* Content Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content Type
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CONTENT_TYPE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onContentTypeChange(value)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                contentType === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Processing method — PDF only */}
      {file && file.name.toLowerCase().endsWith('.pdf') && !useLocalStorage && (
        <PdfMethodSelector
          method={processingMethod}
          onChange={setProcessingMethod}
          isPro={isPro}
          fileSizeBytes={file.size}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isUploading || !file}
          className="btn btn-primary flex-1"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <span className="spinner mr-2"></span>
              {uploadLabel}
            </span>
          ) : (
            'Upload Book'
          )}
        </button>
      </div>

      {isUploading && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{uploadLabel}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </form>
  )
}
