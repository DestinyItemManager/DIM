(function() {
  chrome.browserAction.onClicked.addListener(function() {
    var appUrl = chrome.extension.getURL('index.html');
    chrome.tabs.create({ url: appUrl });
  });
})();
