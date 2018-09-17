import browserslist from 'browserslist';
import parser from 'ua-parser-js';

// Adapted from 'is-browser-supported' npm package. Separate from index.js so it'll run even if that fails.
// This is also intentionally written in es5 and not TypeScript because it should not use any new features.

function getBrowserName(agent) {
  if (agent.browser.name === 'Chrome' && agent.os.name === 'Android') {
    return 'and_chr';
  } else if (agent.browser.name === 'Firefox' && agent.os.name === 'Android') {
    return 'and_ff';
  } else if (
    agent.browser.name === 'Mobile Safari' ||
    (agent.browser.name === 'Safari' && agent.os.name === 'iOS')
  ) {
    return 'ios_saf';
  } else if (agent.browser.name === 'Chromium') {
    return 'chrome';
  } else if (agent.browser.name === 'Opera') {
    return 'opera';
  }
  return agent.browser.name;
}

function getBrowserVersionFromUserAgent(agent) {
  var browserName = getBrowserName(agent);
  var version = (browserName === 'ios_saf'
    ? agent.os.version
    : agent.browser.version || agent.os.version || ''
  ).split('.');
  while (version.length > 0) {
    try {
      return browserslist(browserName + ' ' + version.join('.'))[0];
    } catch (e) {
      // Ignore unknown browser query error
    }
    version.pop();
  }
  return 'unknown';
}

var agent = parser(navigator.userAgent);
if (agent !== 'Vivaldi') {
  // Vivaldi users can just live on the edge
  var browsersSupported = browserslist($BROWSERS);
  var browser = getBrowserVersionFromUserAgent(agent);
  var supported = browsersSupported.indexOf(browser) >= 0;

  if (!supported) {
    console.warn(
      'Browser ' + browser + ' is not supported by DIM. Supported browsers:',
      browsersSupported
    );
    document.getElementById('browser-warning').className = '';
  }
}
