// Security headers for every page. The Content-Security-Policy is applied to production builds
// only: the dev server needs eval for hot reload.
//
// Known limit: script-src keeps 'unsafe-inline' because Next.js writes small inline scripts for
// hydration and this app does not use per-request nonces yet. The policy still blocks external
// scripts, framing, plugins, base-tag and form hijacking, and limits where data can be sent.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').origin
  } catch {
    return 'http://localhost:8080'
  }
})()

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Only meaningful once the site is served over HTTPS; browsers ignore it on plain HTTP.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  ...(process.env.NODE_ENV === 'production' ? [{ key: 'Content-Security-Policy', value: csp }] : []),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
