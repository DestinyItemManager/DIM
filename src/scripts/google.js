
(function loadGapi() {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = "https://apis.google.com/js/client.js?onload=initgapi";
  head.appendChild(script);
})();

window._gaq = window._gaq || [];
var _gaq = window._gaq;
_gaq.push(['_setAccount', 'UA-60316581-1']);
_gaq.push(['_setCustomVar', 1, 'DIMVersion', $DIM_VERSION, 3]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://www.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
