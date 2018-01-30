import angular from 'angular';

/** Sentry.io exception reporting */
export let reportException = () => {};

if ($featureFlags.sentry) {
  // The require instead of import helps us trim this from the production bundle
  const Raven = require('raven-js');
  Raven
    .config('https://1367619d45da481b8148dd345c1a1330@sentry.io/279673', {
      release: $DIM_VERSION,
      environment: $DIM_FLAVOR
    })
    .addPlugin(require('raven-js/plugins/angular'), angular)
    .install();

  reportException = (name, e) => {
    // TODO: we can also do this in some situations to gather more feedback from users
    // Raven.showReportDialog();
    Raven.captureException(e);
  };

  window.addEventListener('unhandledrejection', (event) => Raven.captureException(event.reason));
}
