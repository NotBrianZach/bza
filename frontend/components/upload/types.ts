export type ProcessingMethod = 'jina' | 'nougat' | 'mathpix'

export type FetchResult =
  | { type: 'youtube'; title: string; channelName: string; markdown: string }
  | { type: 'webpage'; title: string; description: string; markdown: string }
  | { type: 'wikipedia'; title: string; summary: string; revid: number; lang: string; articleKey: string; markdown: string }
  | { type: 'rss'; feedTitle: string; items: { title: string; content: string; url: string; date: string }[] }
  | { type: 'pdf'; data: string; filename: string; title: string }

export type ContentType =
  | 'fiction' | 'biography' | 'textbook' | 'math_textbook'
  | 'academic_paper' | 'wikipedia_article' | 'news_article'
  | 'forum_thread' | 'essay' | 'reference' | 'manga'

export const CONTENT_TYPE_OPTIONS: ReadonlyArray<{ value: ContentType; label: string; desc: string }> = [
  { value: 'fiction',           label: 'Fiction',    desc: 'Novels, stories' },
  { value: 'biography',         label: 'Biography',  desc: 'Life stories' },
  { value: 'textbook',          label: 'Textbook',   desc: 'Educational texts' },
  { value: 'math_textbook',     label: 'Math',       desc: 'Math / problem sets' },
  { value: 'academic_paper',    label: 'Paper',      desc: 'Arxiv, preprints' },
  { value: 'wikipedia_article', label: 'Wikipedia',  desc: 'Wiki articles' },
  { value: 'news_article',      label: 'News',       desc: 'News articles' },
  { value: 'forum_thread',      label: 'Forum',      desc: 'Online discussions' },
  { value: 'essay',             label: 'Essay',      desc: 'Opinion, long-form' },
  { value: 'reference',         label: 'Reference',  desc: 'Manuals, guides' },
  { value: 'manga',             label: 'Manga',      desc: 'Comics, manga, visual' },
]

export const STATUS_PROGRESS: Record<string, number> = {
  uploading:   3,
  queuing:     8,
  enqueued:   12,
  processing:  15,
  converted:   72,
  chunking:    85,
  retrying:    15,
  downloading: 95,
}

export const STATUS_LABELS: Record<string, string> = {
  uploading: 'Uploading...',
  queuing: 'Queuing job...',
  enqueued: 'Queued — waiting for worker...',
  processing: 'Extracting text...',
  converted: 'Converting to markdown...',
  chunking: 'Generating readable format...',
  retrying: 'Retrying...',
  downloading: 'Finalizing...',
}

export const STATUS_LABELS_SHORT: Record<string, string> = {
  uploading: 'Uploading...',
  queuing: 'Queuing job...',
  enqueued: 'Queued...',
  processing: 'Extracting text...',
  converted: 'Converting...',
  chunking: 'Finalizing...',
  retrying: 'Retrying...',
  downloading: 'Downloading...',
}
