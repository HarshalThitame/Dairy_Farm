const defaultRuntimeCaching = require("next-pwa/cache");
const runtimeCaching = [
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
    handler: "NetworkFirst",
    options: {
      cacheName: "supabase-api-cache",
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60
      },
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  {
    urlPattern: /^https?:\/\/.*\/api\/.*/,
    handler: "NetworkFirst",
    options: {
      cacheName: "local-api-cache",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 12 * 60 * 60
      },
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-cache",
      expiration: {
        maxAgeSeconds: 30 * 24 * 60 * 60
      },
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  {
    urlPattern: /\.(?:js|css|png|jpg|svg|ico)$/,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets-cache",
      expiration: {
        maxAgeSeconds: 7 * 24 * 60 * 60
      },
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  ...defaultRuntimeCaching
];
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching,
  importScripts: ["/sw-sync.js"],
  buildExcludes: [/middleware-manifest\.json$/],
  disable: process.env.NODE_ENV === "development"
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

module.exports = withPWA(nextConfig);
