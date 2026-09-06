// Injected on aireadalong.com pages.
// Responds to session token requests from the extension background worker.
// Sets a DOM marker so the page can detect the extension is installed.

document.documentElement.dataset.aireadalongExt = '1'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'GET_SESSION') return

  // Supabase stores the session under sb-<projectRef>-auth-token
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '{}')
        sendResponse({ token: parsed?.access_token ?? null })
        return true
      } catch { /* ignore */ }
    }
  }
  sendResponse({ token: null })
  return true
})
