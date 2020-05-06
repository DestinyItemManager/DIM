declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: string;
declare const $DIM_BUILD_DATE: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $GOOGLE_DRIVE_CLIENT_ID: string;
declare const $DIM_API_KEY: string;
declare const $BROWSERS: string[];

declare const $featureFlags: {
  /** Print debug info to console about item moves */
  debugMoves: boolean;
  /** Enable item reviews */
  reviewsEnabled: boolean;
  /** Sync data over gdrive */
  gdrive: boolean;
  debugSync: boolean;
  /** Enable color-blind a11y */
  colorA11y: boolean;
  /** Debug Service Worker */
  debugSW: boolean;
  /** Send exception reports to Sentry.io */
  sentry: boolean;
  /** D2 Vendors */
  vendors: boolean;
  /** Use the new React inventory screen. */
  reactInventory: boolean;
  /** Respect the "do not track" header. */
  respectDNT: boolean;
  /** Community-curated wish lists */
  wishLists: boolean;
  /** Notifications for item moves */
  moveNotifications: boolean;
  /** Item organizer */
  organizer: boolean;
  /** Enable vendorengrams.xyz integration */
  vendorEngrams: boolean;
  /** Enable the new DIM API */
  dimApi: boolean;
};

declare namespace React {
  interface ImgHTMLAttributes {
    loading?: 'lazy';
  }
}

declare function ga(...params: string[]);

interface Window {
  CSS: {
    supports(propertyName: string);
  };
  BroadcastChannel?: BroadcastChannel;
  OC?: any;
  // eslint-disable-next-line @typescript-eslint/camelcase
  gapi_onload(): void;

  // Service worker stuff
  __precacheManifest: string[];
  __WB_MANIFEST: string[];
  skipWaiting(): void;
}

interface Navigator {
  storage: any;
}

declare module '*/CHANGELOG.md' {
  const value: {
    version: string;
    date?: string;
    changes: string[];
  }[];
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.html' {
  const value: string;
  export default value;
}

declare module '*.m.scss' {
  const value: any;
  export default value;
}

declare module '*.scss' {
  const value: string;
  export default value;
}

declare module 'file-loader?*' {
  const value: string;
  export default value;
}

declare module '*dim.json' {
  const value: string;
  export default value;
}
