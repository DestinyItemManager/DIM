(function() {
  chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'https://localhost:8080/?utm_source=extension' });
  });
})();
