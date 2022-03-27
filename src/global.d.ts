declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: 'release' | 'beta' | 'dev' | 'test';
declare const $DIM_BUILD_DATE: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $DIM_API_KEY: string;
declare const $BROWSERS: string[];

declare const $featureFlags: {
  /** Print debug info to console about item moves */
  debugMoves: boolean;
  /** Debug Service Worker */
  debugSW: boolean;
  /** Send exception reports to Sentry.io */
  sentry: boolean;
  /** Community-curated wish lists */
  wishLists: boolean;
  /** Show a banner for supporting a charitable cause */
  issueBanner: boolean;
  /** Show the triage tab in the item popup */
  triage: boolean;
  /** Advanced Write Actions (inserting mods) */
  awa: boolean;
  /** Whether ability cooldowns are shown in stats tooltips */
  abilityCooldowns: boolean;
  /** Item feed sidebar */
  itemFeed: boolean;
};

declare function ga(...params: string[]);

interface Window {
  OC?: unknown;
  MSStream?: unknown;

  // Service worker stuff
  __precacheManifest: string[] | undefined;
  __WB_MANIFEST: string[];
  skipWaiting(): void;
}

interface Navigator {
  /** iOS-only: True if the app is running in installed mode */
  standalone?: boolean;

  setAppBadge(num?: number);
  clearAppBadge();
}

/**
 * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 *
 * Only supported on Chrome and Android Webview.
 */
interface BeforeInstallPromptEvent extends Event {
  /**
   * Returns an array of DOMString items containing the platforms on which the event was dispatched.
   * This is provided for user agents that want to present a choice of versions to the user such as,
   * for example, "web" or "play" which would allow the user to chose between a web version or
   * an Android version.
   */
  readonly platforms: string[];

  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;
}

declare module '*/CHANGELOG.md' {
  const value: string;
  export default value;
}

declare module '*/CHANGELOG_NEXT.md' {
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
  const value: { [className: string]: string };
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

declare module 'locale/*.json' {
  const value: string;
  export default value;
}
