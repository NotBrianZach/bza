/** Lightweight replacement for date-fns formatDistanceToNow({ addSuffix: true }) */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return 'less than a minute ago'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? 'about 1 hour ago' : `about ${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return days === 1 ? '1 day ago' : `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? 'about 1 month ago' : `about ${months} months ago`
  const years = Math.floor(months / 12)
  return years === 1 ? 'about 1 year ago' : `about ${years} years ago`
}
