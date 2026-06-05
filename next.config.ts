import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // @ts-ignore
  allowedDevOrigins: ['armed-bin-conditioning-consequence.trycloudflare.com', 'tak-app.loca.lt', 'askew-hefty-grandly.ngrok-free.dev'],
};

export default nextConfig;
