'use client'

import { useState } from 'react'
import { Upload, X, AlertCircle, Link as LinkIcon, Rss, Globe, Mail, MessageSquare } from 'lucide-react'
import FeedBrowser from '@/components/FeedBrowser'
import UpgradeGate, { UpgradeReason } from './UpgradeGate'
import { FileTab } from './upload/FileTab'
import { UrlTab } from './upload/UrlTab'
import { NewsletterTab } from './upload/NewsletterTab'
import { BrowseTab } from './upload/BrowseTab'
import { ChatBookCreator } from './upload/ChatBookCreator'
import { MangaUploader } from './upload/MangaUploader'
import type { ContentType } from './upload/types'

interface BookUploadProps {
  useLocalStorage?: boolean
  isPro?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

type Tab = 'file' | 'url' | 'feed' | 'newsletter' | 'chat' | 'browse'

const TABS: { id: Tab; icon: typeof Upload; label: string }[] = [
  { id: 'file',       icon: Upload,        label: 'File' },
  { id: 'url',        icon: LinkIcon,      label: 'URL' },
  { id: 'feed',       icon: Rss,           label: 'Feeds' },
  { id: 'newsletter', icon: Mail,          label: 'Email' },
  { id: 'chat',       icon: MessageSquare, label: 'Chat' },
  { id: 'browse',     icon: Globe,         label: 'Browse' },
]

export default function BookUpload({ useLocalStorage = false, isPro = false, onSuccess, onCancel }: BookUploadProps) {
  const [tab, setTab] = useState<Tab>('file')
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState<ContentType>('fiction')
  const [error, setError] = useState<string | null>(null)
  const [gateReason, setGateReason] = useState<UpgradeReason | null>(null)

  const switchTab = (next: Tab) => {
    setTab(next)
    setError(null)
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Add Text</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-600">
            {error}
            {(error.includes('quota') || error.includes('Upgrade') || error.includes('upgrade')) && (
              <> <a href="/billing" className="underline font-medium">Manage your plan →</a></>
            )}
          </p>
        </div>
      )}

      {tab === 'url' && (
        <UrlTab
          useLocalStorage={useLocalStorage}
          isPro={isPro}
          title={title}
          onTitleChange={setTitle}
          contentType={contentType}
          onContentTypeChange={setContentType}
          onError={setError}
          onSuccess={onSuccess}
        />
      )}

      {tab === 'newsletter' && <NewsletterTab useLocalStorage={useLocalStorage} />}

      {tab === 'feed' && <FeedBrowser isAuthenticated={!useLocalStorage} onBookAdded={onSuccess} />}

      {tab === 'browse' && <BrowseTab />}

      {tab === 'chat' && <ChatBookCreator useLocalStorage={useLocalStorage} onSuccess={onSuccess} />}

      {tab === 'file' && contentType === 'manga' && (
        <MangaUploader
          useLocalStorage={useLocalStorage}
          title={title}
          onTitleChange={setTitle}
          onSuccess={onSuccess}
        />
      )}

      {tab === 'file' && contentType !== 'manga' && (
        <FileTab
          useLocalStorage={useLocalStorage}
          isPro={isPro}
          title={title}
          onTitleChange={setTitle}
          contentType={contentType}
          onContentTypeChange={setContentType}
          onError={setError}
          onGateReason={setGateReason}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      )}

      {gateReason && (
        <UpgradeGate
          open
          reason={gateReason}
          isAuthenticated={!useLocalStorage}
          onClose={() => setGateReason(null)}
        />
      )}
    </div>
  )
}
