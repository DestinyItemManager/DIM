declare const $featureFlags: {
  tagsEnabled: boolean;
  compareEnabled: boolean;
  vendorsEnabled: boolean;
  qualityEnabled: boolean;
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
  /** Enable activities tab */
  activities: boolean;
  /** Debug ui-router */
  debugRouter: boolean;
  /** Show drag and drop on dev only */
  dnd: boolean
}

declare module "*.png" {
  const value: string;
  export default value;
}