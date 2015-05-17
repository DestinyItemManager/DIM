(function() {
  // Instance specific extension URL
  var appUrl = chrome.extension.getURL('index.html');

  function openApp(tabs) {
    if (tabs.length === 0) {
      // Open a new tab
      chrome.tabs.create({
        url: appUrl
      });
    } else {
      // Activate the tab.
      chrome.tabs.update(tabs[0].id, {
        active: true
      });
    }
  }

  function appClicked() {
    // Check to see if the app is opened.
    chrome.tabs.query({
      url: appUrl
    }, openApp);
  }

  chrome.browserAction.onClicked.addListener(appClicked);
})();
