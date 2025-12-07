// setupJest.js or similar file
// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.LOCAL_MANIFEST = 'true';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
require('jest-fetch-mock').enableMocks();
const crypto = require('crypto');
const util = require('util');

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    randomUUID: () => crypto.randomUUID(),
  },
});

Object.assign(global, { TextDecoder: util.TextDecoder, TextEncoder: util.TextEncoder });
