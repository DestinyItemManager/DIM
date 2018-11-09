/** Sentry.io exception reporting */
export let reportException: (name: string, e: Error, errorInfo?: {}) => void = () => {
  return;
};

if ($featureFlags.sentry) {
  // The require instead of import helps us trim this from the production bundle
  // tslint:disable-next-line
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
      'Software caused connection abort'
    ],
    ignoreUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i
    ],
    attachStackTrace: true
  });

  reportException = (name: string, e: Error, errorInfo?: {}) => {
    // TODO: we can also do this in some situations to gather more feedback from users
    // Sentry.showReportDialog();
    Sentry.withScope((scope) => {
      scope.setTag('context', name);
      if (errorInfo) {
        Object.keys(errorInfo).forEach((key) => {
          scope.setExtra(key, errorInfo[key]);
        });
      }
      Sentry.captureException(e);
    });
  };
}
