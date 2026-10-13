/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  // Prevent Typst WASM packages from being bundled for server/edge — they're browser-only
  experimental: {
    serverComponentsExternalPackages: [
      '@myriaddreamin/typst.ts',
      '@myriaddreamin/typst-ts-web-compiler',
      '@myriaddreamin/typst-ts-renderer',
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // Injected at deploy time so /api/version can report what's actually running.
    // BUILD_SHA has to come from the environment — it is a TempleDB commit id, which
    // nothing in this file can derive.
    BUILD_SHA: process.env.BUILD_SHA || 'unknown',
    // BUILD_TIME is computed here and is NOT read from the environment, deliberately.
    //
    // This used to read the env var first and fall back to new Date(), and the env
    // half won whenever a stamp existed — so a value left behind by an earlier
    // deploy silently outranked the correct one, and /api/version served the
    // *previous* deploy's builtAt indefinitely. 2026-10-12 shipped a new sha
    // wearing a 29-minute-old timestamp that way.
    //
    // Every deploy still logs BUILD_TIME under "Referenced but no value in
    // TempleDB env", and that is correct and permanent: api/version/route.ts reads
    // process.env.BUILD_TIME, and the value it gets is the one inlined *here* at
    // build time rather than anything from the DB. The warning means "no DB var
    // backs this", which is the intended design, not a gap to close by re-adding
    // one. It shares that list with genuinely-unset keys like TMDB_API_KEY.
    //
    // The deeper problem was that the two were indistinguishable in the output: the
    // only way to tell a real build time from a stale pin was that `new Date()`
    // emits milliseconds and the shell's `%S` stamp did not. Diagnosing a lying
    // endpoint by a formatting accident is not a check, it is a coincidence that
    // happened to be load-bearing. Removing the env branch removes the ambiguity —
    // there is now exactly one source for this value and it cannot be overridden.
    BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
}

module.exports = nextConfig
