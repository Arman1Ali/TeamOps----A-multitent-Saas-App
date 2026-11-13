import type { NextConfig } from "next";

/**
 * Next.js configuration for the TeamOps frontend.
 *
 * The one thing worth knowing about this file is the rewrite below. Every
 * request the browser makes to /api/v1/* is handed to the FastAPI backend
 * instead, so the page and its data come from the same origin (localhost:3000)
 * and the browser never has to be talked into allowing a cross-origin call.
 *
 * Set BACKEND_ORIGIN when the API is not on this machine's port 8000 - a phone
 * or tablet browsing the app cannot reach "localhost" at all, so it has to be
 * given a reachable address.
 */

// Where the FastAPI service is listening. uvicorn's default is port 8000.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
