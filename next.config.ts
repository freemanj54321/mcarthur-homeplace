import type { NextConfig } from 'next'
import { resolveStorageBucket, storageRemotePatterns, usesEmulatorImages } from './src/lib/firebaseConfig'

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  // `next dev` only: E2E (playwright.config.ts) serves the app at 127.0.0.1,
  // and Next 16 blocks dev resources for any host but localhost, so the page
  // never hydrates and every click-driven test silently does nothing.
  allowedDevOrigins: ['127.0.0.1'],
  // MCA-130: one canonical host. www and the apex both serve the site
  // (MCA-70); send www to the apex so search engines see a single URL.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.wtmcarthurhomeplace.org' }],
        destination: 'https://wtmcarthurhomeplace.org/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    // MCA-44: this environment's own bucket, resolved at build time from
    // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or App Hosting's injected config,
    // instead of the hardcoded mcarthur-tour bucket.
    remotePatterns: storageRemotePatterns(resolveStorageBucket(process.env)),
    // E2E only: emulator image URLs are local IPs (see usesEmulatorImages).
    unoptimized: usesEmulatorImages(process.env),
  },
}

export default nextConfig
