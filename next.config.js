/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  // Allow the configured API origin explicitly (covers custom domains); AWS
  // wildcards cover API Gateway, Cognito, and S3 presigned URLs.
  let apiOrigin = "";
  try {
    if (process.env.NEXT_PUBLIC_API_URL) {
      apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
    }
  } catch {
    apiOrigin = "";
  }

  const connectSrc = [
    "'self'",
    apiOrigin,
    "https://*.amazonaws.com",
    // HMR websocket in development
    isDev ? "ws:" : "",
  ].filter(Boolean);

  const scriptSrc = [
    "'self'",
    // Next.js injects inline bootstrap scripts and we ship an inline no-flash
    // theme script. A nonce-based strict CSP is a future upgrade (needs middleware).
    "'unsafe-inline'",
    // next dev / react-refresh needs eval; production build does not.
    isDev ? "'unsafe-eval'" : "",
  ].filter(Boolean);

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.amazonaws.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "media-src 'self' blob: https://*.amazonaws.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const securityHeaders = [
    { key: "Content-Security-Policy", value: csp },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      // Voice capture uses the microphone, so it must stay enabled for self.
      key: "Permissions-Policy",
      value: "camera=(), geolocation=(), microphone=(self), browsing-topics=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: false,
    async headers() {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
      ];
    },
  };

  return nextConfig;
};
