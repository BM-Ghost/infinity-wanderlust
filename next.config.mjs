import nextOnPages from '@cloudflare/next-on-pages';
const { createPages } = nextOnPages;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // required for Cloudflare Pages
  },
  output: 'standalone', // required
};

export default createPages(nextConfig);
