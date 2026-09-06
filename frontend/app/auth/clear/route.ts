import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_PROJECT_REF = 'xqttukoykhbiueskfvad'
const AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`
const CODE_VERIFIER_COOKIE = `${AUTH_COOKIE}-code-verifier`

/**
 * GET /auth/clear — nukes all Supabase auth cookies and redirects to login.
 * Use this as an escape hatch when stale PKCE verifiers or broken session
 * cookies prevent login.
 */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const response = NextResponse.redirect(new URL('/auth/login', origin))
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production'
  const cookieOpts = isProd
    ? { maxAge: 0, path: '/', domain: '.aireadalong.com' }
    : { maxAge: 0, path: '/' }

  // Clear session cookie + chunks
  response.cookies.set(AUTH_COOKIE, '', cookieOpts)
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`${AUTH_COOKIE}.${i}`, '', cookieOpts)
  }

  // Clear PKCE code verifier cookie + chunks
  response.cookies.set(CODE_VERIFIER_COOKIE, '', cookieOpts)
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`${CODE_VERIFIER_COOKIE}.${i}`, '', cookieOpts)
  }

  return response
}
