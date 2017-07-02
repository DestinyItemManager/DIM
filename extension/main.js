(function() {
  chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'https://app.destinyitemmanager.com/?utm_source=extension' });
  });
})();
