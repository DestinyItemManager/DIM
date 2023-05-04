/* eslint-disable @typescript-eslint/method-signature-style */
declare const $DIM_VERSION: string;
declare const $DIM_FLAVOR: 'release' | 'beta' | 'dev' | 'test';
declare const $DIM_BUILD_DATE: string;
declare const $DIM_WEB_API_KEY: string;
declare const $DIM_WEB_CLIENT_ID: string;
declare const $DIM_WEB_CLIENT_SECRET: string;
declare const $DIM_API_KEY: string;
declare const $BROWSERS: string[];

declare const $featureFlags: ReturnType<typeof import('../config/feature-flags').makeFeatureFlags>;

declare function ga(...params: string[]): void;

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

interface Performance {
  measureUserAgentSpecificMemory(): Promise<MeasureMemoryResult>;
}

interface MeasureMemoryResult {
  bytes: number;
  breakdown: {
    bytes: number;
    attribution: [
      {
        url: string;
        scope: string;
      }
    ];
    types: string[];
  }[];
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
