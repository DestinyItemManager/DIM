export default function createWebAppManifest(publicPath: string) {
  return {
    name: 'Destiny Item Manager',
    short_name: 'DIM',
    description: 'An item and loadout manager for Destiny.',
    icons: [
      {
        src: `${publicPath}/android-chrome-192x192-6-2018.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${publicPath}/android-chrome-512x512-6-2018.png`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `${publicPath}/android-chrome-mask-512x512-6-2018.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Vendors',
        url: `${publicPath}/vendors`,
        description: "View vendors' wares",
      },
      {
        name: 'Loadouts',
        url: `${publicPath}/loadouts`,
        description: 'Create & share loadouts',
      },
      {
        name: 'Settings',
        url: `${publicPath}/settings`,
      },
    ],
    screenshots: [
      {
        src: 'https://destinyitemmanager.com/images/inventory.jpg',
        sizes: '1902x1080',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'DIM Inventory Screen',
      },
      {
        src: 'https://destinyitemmanager.com/images/mobile.jpg',
        sizes: '390x770',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'DIM on Mobile',
      },
    ],
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    display_override: ['window-controls-overlay'],
    categories: ['games', 'entertainment', 'productivity', 'utilities'],
    start_url: `${publicPath}/?utm_source=homescreen`,
    launch_handler: {
      client_mode: ['navigate-existing'],
    },
  };
}
