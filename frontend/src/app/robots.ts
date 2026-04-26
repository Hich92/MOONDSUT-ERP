import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signup', '/login', '/terms', '/privacy', '/sitemap', '/forgot-password'],
        disallow: ['/dashboard/', '/api/', '/reset-password'],
      },
    ],
    sitemap: 'https://portal.moondust.cloud/sitemap.xml',
  }
}
