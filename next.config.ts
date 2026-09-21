import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Cache Components: content loaders opt in with `use cache` + cacheTag, so public
  // pages prerender and "Save & Publish" can invalidate them by tag within seconds.
  cacheComponents: true,
  images: {
    // All site imagery is uploaded to the "site-media" storage bucket.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
