
(function loadGapi() {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = "https://apis.google.com/js/client.js?onload=initgapi";
  head.appendChild(script);
})();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-60316581-1']);
_gaq.push(['_setCustomVar', 1, 'DIMVersion', '$DIM_VERSION', 3]);
_gaq.push(['_trackPageview']);
