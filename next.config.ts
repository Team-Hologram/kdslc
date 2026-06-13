import type { NextConfig } from "next";

/**
 * Next.js configuration for the KDSL clothing storefront.
 *
 * In addition to the existing image settings, this configuration opts into
 * compiling certain third‑party dependencies and targeting a broader range
 * of browsers. Older versions of Safari and iOS Safari (such as those on
 * devices running iOS 12 or 13) do not understand modern JavaScript syntax
 * like optional chaining or class fields. When dependencies ship un‑transpiled
 * code to npm, these features can break the entire application on those
 * platforms. To avoid shipping code that older browsers cannot parse, we
 * specify the `transpilePackages` option. This instructs Next.js to run
 * these modules through the build pipeline so their code is down‑levelled
 * and polyfills can be injected where appropriate. See the official docs
 * for more information【833575861287530†L522-L536】.
 */
const nextConfig: NextConfig = {
  // Explicitly tell Next.js to transpile select npm packages. Without this,
  // Next will leave the JavaScript as‑is, which can result in syntax
  // unsupported by older browsers like Safari 12. These libraries are known
  // to ship ES2020+ syntax (e.g. optional chaining) that breaks on old
  // devices, so transpiling them improves cross‑browser support.
  transpilePackages: [
    'lucide-react',
    'framer-motion',
    'recharts',
  ],
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/product-images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
