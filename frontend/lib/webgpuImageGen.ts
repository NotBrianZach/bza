/**
 * WebGPU-based client-side image generation using @huggingface/transformers
 * Runs Stable Diffusion (ONNX) directly in the browser via WebGPU.
 */

// Model registry for WebGPU-compatible models
export const WEBGPU_MODELS = [
  { id: 'aislamov/stable-diffusion-2-1-base-onnx', label: 'SD 2.1 Base', vram: '~4GB', speed: 'slow' },
  { id: 'Xenova/stable-diffusion-v1-5-onnx', label: 'SD 1.5', vram: '~3GB', speed: 'slow' },
  { id: 'schirrmacher/sd-turbo-onnx', label: 'SD Turbo', vram: '~3GB', speed: 'fast' },
  { id: 'schirrmacher/sdxl-turbo-onnx', label: 'SDXL Turbo', vram: '~6GB', speed: 'medium' },
] as const

export type WebGPUModelId = typeof WEBGPU_MODELS[number]['id']

export async function checkWebGPUSupport(): Promise<{ supported: boolean; error?: string }> {
  if (typeof navigator === 'undefined') return { supported: false, error: 'Not in browser' }
  if (!('gpu' in navigator)) return { supported: false, error: 'WebGPU not available in this browser' }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter()
    if (!adapter) return { supported: false, error: 'No WebGPU adapter found (no compatible GPU)' }
    const device = await adapter.requestDevice()
    device.destroy()
    return { supported: true }
  } catch (e: any) {
    return { supported: false, error: e.message }
  }
}

let pipelineInstance: any = null
let loadedModel: string | null = null
let transformersModule: any = null

async function loadTransformersFromCDN(): Promise<any> {
  if (transformersModule) return transformersModule
  // Dynamic import from CDN — avoids webpack bundling onnxruntime-node
  transformersModule = await import(
    /* webpackIgnore: true */
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js'
  )
  return transformersModule
}

export async function generateImageWebGPU(
  prompt: string,
  options: {
    model?: WebGPUModelId
    negativePrompt?: string
    steps?: number
    guidanceScale?: number
    width?: number
    height?: number
    onProgress?: (step: number, totalSteps: number) => void
  } = {}
): Promise<Blob> {
  const {
    model = 'schirrmacher/sd-turbo-onnx',
    negativePrompt = '',
    steps = 4,
    guidanceScale = 1.0,
    width = 512,
    height = 512,
    onProgress,
  } = options

  // Load transformers.js from CDN to avoid webpack bundling onnxruntime-node
  if (!pipelineInstance || loadedModel !== model) {
    onProgress?.(0, steps)
    const transformers = await loadTransformersFromCDN()
    transformers.env.allowLocalModels = false
    pipelineInstance = await transformers.pipeline('text-to-image', model, {
      device: 'webgpu',
      dtype: 'fp16',
    })
    loadedModel = model
  }

  const result = await pipelineInstance(prompt, {
    negative_prompt: negativePrompt || undefined,
    num_inference_steps: steps,
    guidance_scale: guidanceScale,
    width,
    height,
    callback_function: (info: any) => {
      if (info?.step !== undefined) {
        onProgress?.(info.step, steps)
      }
    },
  })

  // Result is a RawImage or similar - convert to Blob
  const image = Array.isArray(result) ? result[0] : result
  if (image instanceof Blob) return image
  if (image?.toBlob) return await image.toBlob()
  if (image?.data && image?.width && image?.height) {
    // Raw pixel data - create canvas and export
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')!
    const imageData = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    )
    ctx.putImageData(imageData, 0, 0)
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/png')
    })
  }
  throw new Error('Unexpected image output format from pipeline')
}

export function unloadModel() {
  pipelineInstance = null
  loadedModel = null
}
