import _ from 'underscore';

window.ga = window.ga || function(...args) { (ga.q = ga.q || []).push(args); }; ga.l = Number(new Date());

ga('create', $DIM_FLAVOR === 'release' ? 'UA-60316581-1' : 'UA-60316581-5', 'auto');
ga('set', 'dimension1', $DIM_VERSION);
ga('set', 'dimension2', $DIM_FLAVOR);

// If we're hooked into the router, let it send pageviews instead
if (!$featureFlags.googleAnalyticsForRouter) {
  ga('send', 'pageview');
}

let reportException = () => {};

if ($featureFlags.googleExceptionReports) {
  // Report no more than once every 5 minutes
  reportException = _.throttle((name, e) => {
    ga('send', 'exception', {
      exDescription: `${name}: ${JSON.stringify(e)}`,
      exFatal: false
    });
  }, 5 * 60000, { trailing: false });

  window.addEventListener('error', (msg, url, lineNo, columnNo, error) => {
    reportException(`Global Error (${lineNo}:${columnNo}) ${msg}`, error);
  });
  window.addEventListener('unhandledrejection', (event) => reportException('Unhandled Promise Rejection', event.reason));
}

export const reportExceptionToGoogleAnalytics = reportException;