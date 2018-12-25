declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: string;
declare const $DIM_BUILD_DATE: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $GOOGLE_DRIVE_CLIENT_ID: string;
declare const $BROWSERS: string[];

declare const $featureFlags: {
  /** Print debug info to console about item moves */
  debugMoves: boolean;
  /** Enable item reviews */
  reviewsEnabled: boolean;
  /** Sync data over gdrive */
  gdrive: boolean;
  debugSync: boolean;
  /** Use a WebAssembly version of SQLite; if possible (this crashes on Chrome 58 on Android though) */
  wasm: boolean;
  /** Enable color-blind a11y */
  colorA11y: boolean;
  /** Whether to log page views for router events */
  googleAnalyticsForRouter: boolean;
  /** Debug ui-router */
  debugRouter: boolean;
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
  /** D2 Loadout Builder */
  d2LoadoutBuilder: boolean;
  /** Community-curated rolls (wish lists) */
  curatedRolls: boolean;
};

declare function ga(...params: string[]);

interface Window {
  CSS: {
    supports(propertyName: string);
  };
  BroadcastChannel?: BroadcastChannel;
  OC?: any;
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

declare module '*.json' {
  const value: any;
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

declare module '*.html' {
  const value: string;
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
