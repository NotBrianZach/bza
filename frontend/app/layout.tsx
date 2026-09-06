import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css'
import AuthProvider from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Read Along — Read Smarter with AI',
  description: 'Upload any book, article, or PDF. Get AI chat, problem sets, character analysis, flashcards, audiobook narration, and translations — all in one place.',
  keywords: ['AI reading', 'book AI', 'PDF reader', 'AI tutor', 'audiobook', 'flashcards', 'problem sets', 'translate books'],
  openGraph: {
    title: 'AI Read Along',
    description: 'Read smarter with AI — chat, problem sets, audiobooks, translations, and more.',
    url: 'https://aireadalong.com',
    siteName: 'AI Read Along',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Read Along',
    description: 'Upload any book. Get AI-powered reading tools.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
const cfAnalyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN

// Prevents flash of wrong theme on load
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (t === 'dark') document.documentElement.classList.add('dark');
      var c = localStorage.getItem('bza-reader-text-color');
      if (c) document.documentElement.style.setProperty('--bza-reader-text', c);
    } catch(e) {}
  })()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})` }} />
        {cfAnalyticsToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${cfAnalyticsToken}"}`}
          />
        )}
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        {isDev && (
          <div className="w-full bg-amber-400 text-amber-900 text-center text-xs font-semibold py-1 px-4 z-[9999] sticky top-0">
            Development environment — data and payments are not real
          </div>
        )}
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
