// setupJest.js or similar file
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
