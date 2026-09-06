import Link from 'next/link'
import { PuzzleIcon, Youtube, Globe, Download, BookOpen } from 'lucide-react'

// Update this URL once the extension is published to the Chrome Web Store
const CHROME_STORE_URL = '#'

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-5">
            <PuzzleIcon size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            aireadalong Browser Extension
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Save YouTube transcripts and web articles directly to your library — one click.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 mb-10">
          {[
            {
              icon: <Youtube size={20} className="text-red-500" />,
              title: 'YouTube Transcripts',
              desc: 'Grab the full caption track from any YouTube video as clean markdown.',
            },
            {
              icon: <Globe size={20} className="text-blue-500" />,
              title: 'Web Articles',
              desc: 'Extract the main content from blogs, Wikipedia, Substack, and more.',
            },
            {
              icon: <Download size={20} className="text-green-500" />,
              title: 'Download or Import',
              desc: 'Save as a .md file or add directly to your aireadalong library.',
            },
            {
              icon: <BookOpen size={20} className="text-purple-500" />,
              title: 'Read with AI',
              desc: 'Once imported, chat with the content, generate images, and track progress.',
            },
          ].map(f => (
            <div
              key={f.title}
              className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{f.title}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          {CHROME_STORE_URL === '#' ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
              The extension is not yet published to the Chrome Web Store. Check back soon!
            </div>
          ) : (
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex"
            >
              <PuzzleIcon size={18} className="mr-2" />
              Add to Chrome — it's free
            </a>
          )}
          <div className="flex items-center justify-center gap-4">
            <Link href='/' className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to library
            </Link>
            <Link href='/privacy' className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-400">
              Privacy Policy
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
