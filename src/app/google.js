// Respect "do not track"
// https://www.paulfurley.com/google-analytics-do-not-track/
let dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
if (!$featureFlags.respectDNT || (dnt != '1' && dnt != 'yes')) {
  (function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    (i[r] =
      i[r] ||
      function() {
        (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

  ga('create', $DIM_FLAVOR === 'release' ? 'UA-60316581-1' : 'UA-60316581-5', 'auto');
  ga('set', 'anonymizeIp', true);
  ga('set', 'dimension1', $DIM_VERSION);
  ga('set', 'dimension2', $DIM_FLAVOR);

  // If we're hooked into the router, let it send pageviews instead
  if (!$featureFlags.googleAnalyticsForRouter) {
    ga('send', 'pageview');
  }
} else {
  // Fake "ga" function so code that depends on it still works
  window.ga = window.ga || function() {};
}
