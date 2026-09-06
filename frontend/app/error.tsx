'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
