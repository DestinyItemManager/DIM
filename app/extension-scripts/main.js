(function () {
  chrome.browserAction.onClicked.addListener(function (tab) {
    var optionsUrl = chrome.extension.getURL('index.html');
    chrome.tabs.query({
      url: optionsUrl
    }, function (tabs) {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, {
          active: true
        });
      } else {
        chrome.tabs.create({
          url: optionsUrl
        });
      }
    });
  });


  (function (b, o, i, l, e, r) {
    b.GoogleAnalyticsObject = l;
    b[l] || (b[l] =
      function () {
        (b[l].q = b[l].q || [])
        .push(arguments)
      });
    b[l].l = +new Date;
    e = o.createElement(i);
    r = o.getElementsByTagName(i)[0];
    e.src = '//www.google-analytics.com/analytics.js';
    r.parentNode.insertBefore(e, r)
  }(window, document, 'script', 'ga'));
  ga('create', 'UA-60316581-1', 'auto');
  ga('send', 'pageview');
})();
