export default function manifest() {
  return {
    name: 'SignalHealth',
    short_name: 'SignalHealth',
    description: 'Your regular health companion',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669', // Matches your emerald-600 theme
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}