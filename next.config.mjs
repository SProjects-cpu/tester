/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: ['localhost'],
  },
  
  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Output standalone for better Vercel deployment
  output: 'standalone',
};

export default nextConfig;
