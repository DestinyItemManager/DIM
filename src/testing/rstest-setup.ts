// rstest setup: mirrors jest-setup.cjs but shims the `jest` global (rstest
// exposes `rs` instead), which jest-fetch-mock and a few tests rely on.
import { rs } from '@rstest/core';
import crypto from 'crypto';
import util from 'util';

(globalThis as unknown as { jest: typeof rs }).jest = rs;

// $featureFlags is a runtime global object (matching jest.config.js `globals`),
// not a compile-time define, so `$featureFlags.someKey` stays a property access.
(globalThis as unknown as { $featureFlags: Record<string, boolean> }).$featureFlags = {
  dimApi: true,
  runLoInBackground: true,
  sentry: false,
};

process.env.NODE_ENV = 'test';
process.env.LOCAL_MANIFEST = 'true';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-fetch-mock').enableMocks();

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => crypto.randomBytes(arr.length),
    randomUUID: () => crypto.randomUUID(),
  },
});

Object.assign(global, { TextDecoder: util.TextDecoder, TextEncoder: util.TextEncoder });

// jsdom doesn't provide a callable window.matchMedia, but DIM guards its calls
// with `'matchMedia' in window` (truthy here), so provide a no-op implementation.
// Guarded so this setup also runs under `@jest-environment node` files (no window).
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
