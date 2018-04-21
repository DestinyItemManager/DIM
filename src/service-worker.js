import WorkboxSW from 'workbox-sw';

const workboxSW = new WorkboxSW();

// This array will be filled in with our files by the Workbox plugin
workboxSW.precache([]);

// Cache our fonts!
workboxSW.router.registerRoute(new RegExp('https://fonts.(googleapis|gstatic).com/.*'),
  workboxSW.strategies.cacheFirst({
    cacheName: 'googleapis',
    cacheExpiration: {
      maxEntries: 20
    },
    cacheableResponse: { statuses: [0, 200] }
  })
);
