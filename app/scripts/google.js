
(function loadGapi() {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = "https://apis.google.com/js/client.js?onload=initgapi";
  head.appendChild(script);
})();

(function() {
  window.ga = window.ga || function(...args) {
    (ga.q = ga.q || []).push(...args);
  };
  ga.l = Number(new Date);
  ga('create', 'UA-60316581-1', 'auto');
  ga('send', 'pageview');
})();
