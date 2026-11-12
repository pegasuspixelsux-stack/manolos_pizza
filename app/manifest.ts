import type { MetadataRoute } from 'next';

// Lets browsers install the site as an app (standalone window, no browser UI) with the home-screen icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manolo's Pizza",
    short_name: "Manolo's",
    description: 'La auténtica pizza por metro en Maldonado.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
