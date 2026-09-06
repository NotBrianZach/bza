import type { BrowserProvider, BrowserSession, CreateSessionOpts } from './provider'

/**
 * NekoProvider: talks HTTP to a self-hosted neko-manager (see system_config/modules/neko-host).
 *
 * All /session and /health calls carry a bearer token from NEKO_MGR_TOKEN.
 * Never called in the browser — Next.js API routes only.
 */
export class NekoProvider implements BrowserProvider {
  constructor(private baseUrl: string, private token: string) {}

  private headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  async createSession(opts: CreateSessionOpts = {}): Promise<BrowserSession> {
    const res = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        startUrl: opts.startUrl,
        // Neko doesn't accept explicit width/height at spawn; we set NEKO_SCREEN
        // in the module. Ignoring width/height/region here.
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`neko-manager create failed: ${res.status} ${text}`)
    }
    const data = await res.json() as { sessionId: string; embedUrl: string; adminToken: string }
    return { sessionId: data.sessionId, embedUrl: data.embedUrl, adminToken: data.adminToken }
  }

  async endSession(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/session/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.headers(),
    })
    if (!res.ok && res.status !== 404) {
      throw new Error(`neko-manager end failed: ${res.status} ${await res.text()}`)
    }
  }

  async getSession(id: string) {
    const res = await fetch(`${this.baseUrl}/session/${encodeURIComponent(id)}`, {
      method: 'GET', headers: this.headers(),
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`neko-manager get failed: ${res.status}`)
    const data = await res.json() as { active: boolean }
    return { active: data.active }
  }

  /** Fast health probe (used by API route before creating a session). */
  async health(): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) return { ok: false, error: `health ${res.status}` }
      const data = await res.json() as { ok: boolean }
      return { ok: data.ok }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  }
}
