declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: string;
declare const $DIM_BUILD_DATE: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $DIM_API_KEY: string;
declare const $BROWSERS: string[];

declare const $featureFlags: {
  /** Print debug info to console about item moves */
  debugMoves: boolean;
  /** Enable color-blind a11y */
  colorA11y: boolean;
  /** Debug Service Worker */
  debugSW: boolean;
  /** Send exception reports to Sentry.io */
  sentry: boolean;
  /** D2 Vendors */
  vendors: boolean;
  /** Respect the "do not track" header. */
  respectDNT: boolean;
  /** Community-curated wish lists */
  wishLists: boolean;
  /** Enable vendorengrams.xyz integration */
  vendorEngrams: boolean;
  /** Enable the Armor 2 Mod Picker */
  armor2ModPicker: boolean;
  /** Show a banner for supporting a charitable cause */
  issueBanner: boolean;
  /** Show the triage tab in the item popup */
  triage: boolean;
  /** Enable new mobile inspect view when dragging an item */
  mobileInspect: boolean;
  /** Move subclass out of weapons */
  newArrangement: boolean;
  /** New background */
  gradientBackground: boolean;
  /** Move the item popup actions */
  newItemPopupActions: boolean;
  /** Enable move amounts */
  moveAmounts: boolean;
  /** Enable alt inv mode */
  altInventoryMode: boolean;
  /** Enable search results */
  searchResults: boolean;
  /** Alternate perks display on item popup */
  newPerks: boolean;
  /** Advanced Write Actions (inserting mods) */
  awa: boolean;
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

  // Service worker stuff
  __precacheManifest: string[];
  __WB_MANIFEST: string[];
  skipWaiting(): void;
}

interface Navigator {
  storage: any;
}

declare module '*/CHANGELOG.md' {
  const value: string;
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
