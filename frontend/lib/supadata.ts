export const SUPADATA_HOSTS = [
  'youtube.com', 'youtu.be',
  'tiktok.com',
  'twitter.com', 'x.com',
  'instagram.com',
]

export function isSupadataUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return SUPADATA_HOSTS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}
