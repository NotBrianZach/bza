/**
 * Client-side PDF image extraction using pdfjs-dist (browser canvas).
 * Renders pages that contain embedded image XObjects as JPEG thumbnails.
 * Must only be called in a browser context.
 */

export interface PdfPageImage {
  pdfPage: number
  blob: Blob
  label: string
}

export async function extractImagesFromPdf(file: File): Promise<PdfPageImage[]> {
  if (typeof window === 'undefined') return []

  const pdfjsLib = await import('pdfjs-dist')

  // Use CDN worker — avoids bundler/worker-URL issues in Next.js + Cloudflare
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const buf = await file.arrayBuffer()
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise

  // Collect image paint operation codes
  const opsMap = pdfjsLib.OPS as Record<string, number> | undefined
  const IMAGE_OPS = new Set<number>(
    [
      opsMap?.paintImageXObject,
      opsMap?.paintJpegXObject,
      opsMap?.paintInlineImageXObject,
    ].filter((v): v is number => typeof v === 'number')
  )

  // If pdfjs doesn't export OPS we can't reliably detect image pages — skip
  if (IMAGE_OPS.size === 0) return []

  const results: PdfPageImage[] = []
  let figureNum = 1

  for (let pn = 1; pn <= pdfDoc.numPages; pn++) {
    const page = await pdfDoc.getPage(pn)
    const pageOps = await page.getOperatorList()

    if (!pageOps.fnArray.some((fn: number) => IMAGE_OPS.has(fn))) continue

    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    await page.render({ canvasContext: ctx, canvas, viewport }).promise

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85)
    )
    if (!blob) continue

    results.push({
      pdfPage: pn,
      blob,
      label: `Figure ${figureNum} — PDF page ${pn}`,
    })
    figureNum++
  }

  return results
}
