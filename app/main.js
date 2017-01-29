(function() {
  chrome.browserAction.onClicked.addListener(function() {
    chrome.runtime.openOptionsPage();
  });
})();
