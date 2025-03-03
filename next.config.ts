/* eslint-disable @typescript-eslint/no-require-imports */
const { PHASE_PRODUCTION_BUILD } = require('next/constants');

interface RemotePattern {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
}
const remotePatterns: RemotePattern[] = [
  {
    protocol: 'https',
    hostname: 'firebasestorage.googleapis.com',
    pathname: '/v0/b/**', // Allows all Firebase Storage bucket paths
  },
];
/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */

module.exports = async (phase: unknown) => {
  /** @type {import("next").NextConfig} */

  // Your current or future configuration

  const nextConfig = {
    images: {
      domains: ['firebasestorage.googleapis.com'],
      remotePatterns,
    },
  };

  if (phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import('@serwist/next')).default({
      swSrc: 'src/app/service-worker.ts',
      swDest: 'public/sw.js',
      reloadOnOnline: true,
    });
    return withSerwist(nextConfig);
  }

  return nextConfig;
};
