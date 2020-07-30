import _ from 'lodash';

/** Sentry.io exception reporting */
export let reportException: (name: string, e: Error, errorInfo?: {}) => void = _.noop;

if ($featureFlags.sentry) {
  // The require instead of import helps us trim this from the production bundle
  const Sentry = require('@sentry/browser');
  Sentry.init({
    dsn: 'https://1367619d45da481b8148dd345c1a1330@sentry.io/279673',
    release: $DIM_VERSION,
    environment: $DIM_FLAVOR,
    ignoreErrors: [
      'QuotaExceededError',
      'Time out during communication with the game servers.',
      'Bungie.net servers are down for maintenance.',
      "This action is forbidden at your character's current location.",
      "An unexpected error has occurred on Bungie's servers",
      /Destiny tracker service call failed\./,
      'Appel au service de Destiny tracker échoué.',
      /You may not be connected to the internet/,
      'Software caused connection abort',
      'Refresh token invalid, clearing auth tokens & going to login',
      'cannot be equipped because the exotic',
      'No auth token exists, redirect to login',
      'Circuit breaker open',
      'HTTP 503 returned',
      'Waiting due to HTTP 503',
      'Bungie.net was too slow to respond.',
      'Bungie.net is currently experiencing difficulties.',
      /AbortError/,
      /Non-Error promise rejection/,
      /VendorEngrams\.xyz/,
    ],
    ignoreUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
    attachStackTrace: true,
    // We're flooding Sentry for some reason
    sampleRate: 0.05,
  });

  reportException = (name: string, e: Error, errorInfo?: {}) => {
    // TODO: we can also do this in some situations to gather more feedback from users
    // Sentry.showReportDialog();
    Sentry.withScope((scope) => {
      scope.setTag('context', name);
      if (errorInfo) {
        scope.setExtras(errorInfo);
      }
      Sentry.captureException(e);
    });
  };
}
