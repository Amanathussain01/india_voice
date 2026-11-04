/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", port: "5013", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
