window.ga = window.ga || function(...args) { (ga.q = ga.q || []).push(args); }; ga.l = Number(new Date());

ga('create', 'UA-60316581-1', document.location.hostname);
ga('set', 'DIMVersion', $DIM_VERSION);
ga('set', 'DIMFlavor', $DIM_FLAVOR);

// If we're hooked into the router, let it send pageviews instead
if (!$featureFlags.googleAnalyticsForRouter) {
  ga('send', 'pageview');
}
