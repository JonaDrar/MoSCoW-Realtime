import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable Strict Mode to prevent potential issues with react-beautiful-dnd
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
