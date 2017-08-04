
import browserslist from 'browserslist';
import parser from 'ua-parser-js';

// Adapted from 'is-browser-supported' npm package. Separate from index.js so it'll run even if that fails.
// This is also intentionally written in es5.

function getBrowserName(agent) {
  if (agent.browser.name === 'Android Browser') {
    return 'android';
  } else if (agent.os.name === 'BlackBerry') {
    return 'bb';
  } else if (agent.browser.name === 'Chrome' && agent.os.name === 'Android') {
    return 'and_chr';
  } else if (agent.browser.name === 'Firefox' && agent.os.name === 'Android') {
    return 'and_ff';
  } else if (agent.browser.name === 'IEMobile') {
    return 'ie_mob';
  } else if (agent.browser.name === 'Opera Mobi') {
    return 'op_mob';
  } else if (agent.browser.name === 'Mobile Safari' || (agent.browser.name === 'Safari' && agent.os.name === 'iOS')) {
    return 'ios_saf';
  } else if (agent.browser.name === 'UCBrowser') {
    return 'and_uc';
  } else if (agent.browser.name === 'Chromium') {
    return 'chrome';
  }
  return agent.browser.name;
}

function getBrowserVersionFromUserAgent(userAgent) {
  var agent = parser(userAgent);
  var version = (agent.browser.version || agent.os.version || '').split('.');
  var browserName = getBrowserName(agent);
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

var browsersSupported = browserslist($BROWSERS);
var browser = getBrowserVersionFromUserAgent(navigator.userAgent);
var supported = browsersSupported.indexOf(browser) >= 0;

if (!supported) {
  console.warn('Browser ' + browser + ' is not supported by DIM. Supported browsers:', browsersSupported);
  document.getElementById('browser-warning').className = '';
}
