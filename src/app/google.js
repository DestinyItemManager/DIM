window.ga =
  window.ga ||
  function(...args) {
    (ga.q = ga.q || []).push(args);
  };
ga.l = Number(new Date());

ga('create', $DIM_FLAVOR === 'release' ? 'UA-60316581-1' : 'UA-60316581-5', 'auto');
ga('set', 'dimension1', $DIM_VERSION);
ga('set', 'dimension2', $DIM_FLAVOR);

// If we're hooked into the router, let it send pageviews instead
if (!$featureFlags.googleAnalyticsForRouter) {
  ga('send', 'pageview');
}
