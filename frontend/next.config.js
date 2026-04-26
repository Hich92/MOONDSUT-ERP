const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.moondust.cloud' },
      { protocol: 'https', hostname: 'imgs.xkcd.com' },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps uniquement si SENTRY_AUTH_TOKEN est configuré
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent:    !process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,
  hideSourceMaps:        true,
  disableLogger:         true,
  telemetry:             false,
})
