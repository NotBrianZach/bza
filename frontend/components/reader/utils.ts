// Strip markdown syntax to plain text suitable for TTS narration.
// Preserves reading order, collapses paragraphs to sentences.
// Note: includes 4chan-specific stripping for forum-thread content type.
export function toPlainText(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')              // images
    .replace(/\[>>(\d+)\]\([^)]+\)/g, '')         // 4chan reply links [>>12345](#p12345)
    .replace(/>>?\d+/g, '')                        // bare >>12345 or >12345 reply refs
    .replace(/\bNo\.\d+\b/g, '')                  // post numbers "No.12345678"
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // other links → text only
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/^>+\s*/gm, '')                      // blockquotes / greentext (single or double >)
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}
