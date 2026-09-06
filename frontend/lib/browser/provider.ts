export interface BrowserSession {
  sessionId: string
  embedUrl: string
  adminToken: string
}

export interface CreateSessionOpts {
  startUrl?: string
  width?: number
  height?: number
  timeoutSeconds?: number
  idleSeconds?: number
  region?: 'NA' | 'EU' | 'AS'
  // Hyperbeam profile persistence:
  // - true: create a new saved profile
  // - string: load an existing saved profile (session_id of the source)
  // - { load, save }: full control
  profile?: boolean | string | { load?: string; save?: boolean | string }
}

export interface BrowserProvider {
  createSession(opts?: CreateSessionOpts): Promise<BrowserSession>
  endSession(providerSessionId: string): Promise<void>
  getSession(providerSessionId: string): Promise<{ active: boolean } | null>
}

const HB_BASE = 'https://engine.hyperbeam.com/v0'

class HyperbeamProvider implements BrowserProvider {
  constructor(private apiKey: string) {}

  private headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async createSession(opts: CreateSessionOpts = {}): Promise<BrowserSession> {
    const body: any = {
      start_url: opts.startUrl ?? 'about:blank',
      width: opts.width ?? 1280,
      height: opts.height ?? 720,
      kiosk: true,
      region: opts.region ?? 'NA',
      timeout: {
        absolute: opts.timeoutSeconds ?? 3600,
        inactive: opts.idleSeconds ?? 600,
      },
      quality: { mode: 'sharp' as const },
    }
    if (opts.profile !== undefined) body.profile = opts.profile
    const res = await fetch(`${HB_BASE}/vm`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Hyperbeam create failed: ${res.status} ${await res.text()}`)
    const data = await res.json() as { session_id: string; embed_url: string; admin_token: string }
    return { sessionId: data.session_id, embedUrl: data.embed_url, adminToken: data.admin_token }
  }

  // DELETE path convention; verify against a live session on first run.
  async endSession(id: string): Promise<void> {
    const res = await fetch(`${HB_BASE}/vm/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: this.headers(),
    })
    if (!res.ok && res.status !== 404) {
      throw new Error(`Hyperbeam end failed: ${res.status} ${await res.text()}`)
    }
  }

  async getSession(id: string) {
    const res = await fetch(`${HB_BASE}/vm/${encodeURIComponent(id)}`, {
      method: 'GET', headers: this.headers(),
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Hyperbeam get failed: ${res.status} ${await res.text()}`)
    const data = await res.json() as { termination_date?: string }
    return { active: !data.termination_date }
  }
}

// Top-level import — safe because NekoProvider is a pure class with no
// module-level side effects. Tree-shaking removes it from bundles that don't
// reference getBrowserProvider() while BROWSER_PROVIDER=neko is set.
// (Cloudflare Workers is ESM-only; `require()` is not defined there.)
import { NekoProvider } from './nekoProvider'

export function getBrowserProvider(): BrowserProvider {
  const which = (process.env.BROWSER_PROVIDER || 'hyperbeam').toLowerCase()
  if (which === 'neko') {
    const url = process.env.NEKO_MGR_URL
    const token = process.env.NEKO_MGR_TOKEN
    if (!url || !token) throw new Error('NEKO_MGR_URL / NEKO_MGR_TOKEN not set (required for BROWSER_PROVIDER=neko)')
    return new NekoProvider(url, token)
  }
  const key = process.env.HYPERBEAM_API_KEY
  if (!key) throw new Error('HYPERBEAM_API_KEY not set')
  return new HyperbeamProvider(key)
}
