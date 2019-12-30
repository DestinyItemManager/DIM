import parser from 'ua-parser-js';

// Adapted from 'is-browser-supported' npm package. Separate from index.js so it'll run even if that fails.
// This is also intentionally written in es5 and not TypeScript because it should not use any new features.

function getBrowserName(agent) {
  if (agent.browser.name === 'Chrome' && agent.os.name === 'Android') {
    return 'and_chr';
  } else if (agent.browser.name === 'Firefox' && agent.os.name === 'Android') {
    return 'and_ff';
  } else if (agent.browser.name === 'Mobile Safari' || agent.os.name === 'iOS') {
    return 'ios_saf';
  } else if (agent.browser.name === 'Chromium') {
    return 'chrome';
  } else if (agent.browser.name === 'Opera') {
    return 'opera';
  }
  return agent.browser.name;
}

function getBrowserVersionFromUserAgent(agent) {
  var browserName = getBrowserName(agent).toLowerCase();
  var version = (browserName === 'ios_saf'
    ? agent.os.version
    : agent.browser.version || agent.os.version || ''
  ).split('.');
  while (version.length > 0) {
    try {
      return browserName + ' ' + version.join('.');
    } catch (e) {
      // Ignore unknown browser query error
    }
    version.pop();
  }
  return 'unknown';
}

export function isSupported(browsersSupported, userAgent) {
  var agent = parser(userAgent);

  // Build a map from browser version to minimum supported version
  var minBrowserVersions = {};
  for (var i = 0; i < browsersSupported.length; i++) {
    // ios_saf 11.0-11.2 => [ios_saf, 11.0, 11.2]
    var supportedBrowserVersion = browsersSupported[i].split(/[- ]/);
    minBrowserVersions[supportedBrowserVersion[0]] = Math.min(
      minBrowserVersions[supportedBrowserVersion[0]] || 999999,
      parseFloat(supportedBrowserVersion[1])
    );
  }

  function isBrowserSupported(browser) {
    var nameAndVersion = browser.split(' ');
    if (
      minBrowserVersions[nameAndVersion[0]] &&
      minBrowserVersions[nameAndVersion[0]] <= parseFloat(nameAndVersion[1])
    ) {
      return true;
    }
    return false;
  }

  var browser = getBrowserVersionFromUserAgent(agent);
  var supported = isBrowserSupported(browser);

  if (!supported && agent.os.name !== 'Android') {
    // Detect anything based on chrome as if it were chrome
    var chromeMatch = /Chrome\/(\d+)/.exec(agent.ua);
    if (chromeMatch) {
      browser = 'chrome ' + chromeMatch[1];
      supported = isBrowserSupported(browser);
    }
  }
  if (!supported) {
    console.warn(
      'Browser ' + browser + ' is not supported by DIM. Supported browsers:',
      browsersSupported
    );
  }
  return supported;
}

if ($BROWSERS.length) {
  var supported = isSupported($BROWSERS, navigator.userAgent);
  if (!supported) {
    document.getElementById('browser-warning').style.display = 'block';
  }
}
