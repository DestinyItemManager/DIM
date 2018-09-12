/** Sentry.io exception reporting */
export let reportException: (name: string, e: Error) => void = () => {
  return;
};

if ($featureFlags.sentry) {
  // The require instead of import helps us trim this from the production bundle
  // tslint:disable-next-line
  const Raven = require('raven-js');
  Raven.config('https://1367619d45da481b8148dd345c1a1330@sentry.io/279673', {
    release: $DIM_VERSION,
    environment: $DIM_FLAVOR,
    ignoreErrors: [
      'Time out during communication with the game servers.',
      'Bungie.net servers are down for maintenance.',
      "This action is forbidden at your character's current location.",
      "An unexpected error has occurred on Bungie's servers"
    ],
    ignoreUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i
    ]
  })
    // tslint:disable-next-line
    .addPlugin(require('raven-js/plugins/angular'), require('angular'))
    .install();

  reportException = (name: string, e: Error) => {
    // TODO: we can also do this in some situations to gather more feedback from users
    // Raven.showReportDialog();
    Raven.captureException(e, { extra: { context: name } });
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
    Raven.captureException(event.reason)
  );
}
