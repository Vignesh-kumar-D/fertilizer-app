import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'V_A_S',
    short_name: 'Vetri Agro services',
    name: 'Visit tracker for fertilizer retail',
    description:
      'It helps to keep track of field visits done to meet to feel the crops and summarizes that data',
    icons: [
      {
        src: 'images/icon_512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'images/icon_1024x1024.png',
        type: 'image/png',
        sizes: '1024x1024',
      },
      {
        src: 'images/icon_maskable_512x512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'maskable',
      },
    ],
    start_url: '.',
    display: 'fullscreen',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    screenshots: [
      {
        src: 'images/icon_720x1280.png',
        type: 'image/png',
        sizes: '720x1280',
        label: 'Tablet Portrait View',
      },
      {
        src: 'images/icon_1170x2532.png',
        type: 'image/png',
        sizes: '1170x2532',
        label: 'Desktop View',
        form_factor: 'wide',
      },
    ],
    prefer_related_applications: false,
  };
}
