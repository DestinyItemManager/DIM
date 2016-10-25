(function() {
  chrome.browserAction.onClicked.addListener(function() {
    var newURL = "chrome-extension://" + chrome.runtime.id + "/index.html";
    chrome.tabs.create({ url: newURL });
  });
})();
