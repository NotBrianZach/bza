import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — aireadalong' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto prose prose-gray dark:prose-invert prose-sm">
        <Link href="/" className="text-sm text-indigo-600 hover:underline no-underline">← Back to aireadalong</Link>

        <h1 className="mt-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: May 2026</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account information</strong> — your email address when you sign up.</li>
          <li><strong>Content you upload</strong> — PDFs, text, and markdown files you add to your library, stored in your private cloud storage.</li>
          <li><strong>Reading progress</strong> — page position, bookmarks, and flashcards associated with your account.</li>
          <li><strong>Billing information</strong> — handled entirely by Stripe. We store only your Stripe customer ID; we never see your card details.</li>
          <li><strong>Usage data</strong> — API call counts used for quota enforcement (e.g. AI image generations, OCR pages).</li>
        </ul>

        <h2>Browser extension</h2>
        <p>
          The aireadalong browser extension captures text content from web pages and YouTube transcripts
          <strong> only when you explicitly click "Add to Library" or "Download Markdown"</strong>.
          It does not run in the background, track your browsing, or collect data from pages you simply visit.
        </p>
        <p>
          To authenticate with your library, the extension reads your Supabase session token from
          <code>localStorage</code> on <code>aireadalong.com</code> tabs. This token is used solely to
          authorise the import request and is never stored by the extension or sent anywhere other than
          <code>aireadalong.com</code>.
        </p>

        <h2>How we use your data</h2>
        <ul>
          <li>To provide the reading, AI tutoring, and flashcard features of the service.</li>
          <li>To process payments and enforce usage quotas.</li>
          <li>We do not sell your data, share it with advertisers, or use it to train AI models.</li>
        </ul>

        <h2>Third-party services</h2>
        <ul>
          <li><strong>Supabase</strong> — database and file storage (EU/US).</li>
          <li><strong>OpenAI / OpenRouter</strong> — AI features (tutor, image generation, flashcards). Content you send to these features is subject to their respective privacy policies.</li>
          <li><strong>Stripe</strong> — payment processing.</li>
          <li><strong>Mathpix</strong> — optional OCR for math PDFs (Pro tier only).</li>
          <li><strong>Cloudflare</strong> — CDN and edge hosting.</li>
        </ul>

        <h2>Data retention and deletion</h2>
        <p>
          You can delete any book from your library at any time, which removes it from storage.
          To delete your account and all associated data, email us at{' '}
          <a href="mailto:hello@aireadalong.com">hello@aireadalong.com</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? <a href="mailto:hello@aireadalong.com">hello@aireadalong.com</a>
        </p>
      </div>
    </div>
  )
}
