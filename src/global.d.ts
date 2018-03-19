declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: string;
declare const $DIM_BUILD_DATE: string;
declare const $DIM_CHANGELOG: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $GOOGLE_DRIVE_CLIENT_ID: string;
declare const $BROWSERS: string[];

declare const $featureFlags: {
  /** Additional debugging / item info tools */
  debugMode: boolean;
  /** Print debug info to console about item moves */
  debugMoves: boolean;
  /** show changelog toaster */
  changelogToaster: boolean;
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
  /** Send exception reports to Sentry.io */
  sentry: boolean;
  /** D2 Vendors */
  vendors: boolean;
}

declare function ga(...params: string[]);

interface Window {
  CSS: {
    supports(propertyName: string, value: string, something: number);
  }
  BroadcastChannel?: BroadcastChannel;
}

interface Navigator {
  storage: any;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.html" {
  const value: string;
  export default value;
}

declare module "*.scss" {
  const value: string;
  export default value;
}

declare module "file-loader?*" {
  const value: string;
  export default value;
}
