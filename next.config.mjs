/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The prototype ships no server-side data store; all demo state lives in the
  // browser. A static export therefore remains a valid deployment target.
  images: { unoptimized: true },
};

export default nextConfig;
