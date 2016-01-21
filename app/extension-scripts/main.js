(function() {
  // Instance specific extension URL
  var appUrl = chrome.extension.getURL('index.html');

  function appClicked() {
    chrome.tabs.create({
      url: appUrl
    });
  }

  chrome.browserAction.onClicked.addListener(appClicked);
})();
