import type { NextConfig } from 'next'
import { resolveStorageBucket, storageRemotePatterns } from './src/lib/firebaseConfig'

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  images: {
    // MCA-44: this environment's own bucket, resolved at build time from
    // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or App Hosting's injected config,
    // instead of the hardcoded mcarthur-tour bucket.
    remotePatterns: storageRemotePatterns(resolveStorageBucket(process.env)),
  },
}

export default nextConfig
