import browserslist from 'browserslist';
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
var browsersSupported = browserslist($BROWSERS);

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
    minBrowserVersions[nameAndVersion[0]] <= nameAndVersion[1]
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
    minBrowserVersions
  );
  document.getElementById('browser-warning').style.display = 'block';
}

// Free up the memory of this module by deleting it from the module caches
for (var i = 0; i < webpackJsonp.length; i++) {
  if (webpackJsonp[i][0][0] === 'browsercheck') {
    console.log(webpackJsonp[i][1]);
    for (var key in webpackJsonp[i][1]) {
      delete __webpack_modules__[key];
      delete webpackJsonp[i][1][key];
    }
  }
}
