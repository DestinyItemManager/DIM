// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-60316581-1']);
// _gaq.push(['_trackPageview']);
//
// (function() {
//   var ga = document.createElement('script');
//   ga.type = 'text/javascript';
//   ga.async = true;
//   ga.src = 'https://ssl.google-analytics.com/ga.js';
//   var s = document.getElementsByTagName('script')[0];
//   s.parentNode.insertBefore(ga, s);
// })();

(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function() {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://ssl.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-60316581-1', 'auto');
ga('create', 'UA-60316581-3', 'auto', {'name': 'errorTracker'});

ga('send', 'pageview');
//ga('errorTracker.send', 'pageview');
