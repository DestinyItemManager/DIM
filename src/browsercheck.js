/* eslint prefer-template: 0 */
import parser from 'ua-parser-js';
import {
  samsungInternet,
  steamBrowser,
  supportedLanguages,
  unsupported,
} from './browsercheck-utils.js';

// Adapted from 'is-browser-supported' npm package. Separate from index.js so it'll run even if that fails.
// This is also intentionally written in es5 and not TypeScript because it should not use any new features.

/**
 * @param {parser.IResult} agent
 */
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

/**
 * @returns {import('app/i18n.js').DimLanguage}
 */
function getUserLocale() {
  var lang = (window.navigator.userLanguage || window.navigator.language).toLowerCase() || 'en';
  if (lang.startsWith('zh-') && lang.length === 5) {
    lang = lang === 'zh-cn' ? 'zh-chs' : 'zh-cht';
  }
  if (!supportedLanguages.includes(lang)) {
    lang = lang.split('-', 1)[0];
  }
  if (!supportedLanguages.includes(lang)) {
    // fallback to 'en' if unsupported language after removing dialect
    lang = 'en';
  }
  return lang;
}

/**
 * @param {parser.IResult} agent
 */
function getBrowserVersionFromUserAgent(agent) {
  var browserName = getBrowserName(agent).toLowerCase();
  var version = (
    browserName === 'ios_saf' ? agent.os.version : agent.browser.version || agent.os.version || ''
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

/**
 * @param {string[]} browsersSupported
 * @param {string} userAgent
 */
export function isSupported(browsersSupported, userAgent) {
  if (navigator.standalone) {
    // Assume support if we're installed as an iOS PWA.
    return true;
  }

  var agent = parser(userAgent);

  // Build a map from browser version to minimum supported version
  /** @type {Record<string, number|undefined>} */
  var minBrowserVersions = {};
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (var i = 0; i < browsersSupported.length; i++) {
    // ios_saf 11.0-11.2 => [ios_saf, 11.0, 11.2]
    var supportedBrowserVersion = browsersSupported[i].split(/[- ]/);
    minBrowserVersions[supportedBrowserVersion[0]] = Math.min(
      minBrowserVersions[supportedBrowserVersion[0]] || 999999,
      parseFloat(supportedBrowserVersion[1]),
    );
  }

  /** @param {string} browser  */
  function isBrowserSupported(browser) {
    var nameAndVersion = browser.split(' ');
    return (
      minBrowserVersions[nameAndVersion[0]] &&
      minBrowserVersions[nameAndVersion[0]] <= parseFloat(nameAndVersion[1])
    );
  }

  var browser = getBrowserVersionFromUserAgent(agent);
  var supported = isBrowserSupported(browser);

  if (!supported) {
    // Detect anything based on chrome as if it were chrome
    var chromeMatch = /Chrome\/(\d+)/.exec(agent.ua);
    if (chromeMatch) {
      browser = 'chrome ' + chromeMatch[1];
      supported = isBrowserSupported(browser);
    }
  }
  if (!supported) {
    // eslint-disable-next-line no-console
    console.warn(
      'Browser ' + browser + ' is not supported by DIM. Supported browsers:',
      browsersSupported,
    );
  }
  return supported;
}

var lang = getUserLocale();

if ($BROWSERS.length && lang) {
  var supported = isSupported($BROWSERS, navigator.userAgent);
  if (!supported) {
    // t(`Browsercheck.Unsupported`)
    document.getElementById('browser-warning').textContent = unsupported[lang];
    document.getElementById('browser-warning').style.display = 'block';
  }

  // Steam is never supported
  if (navigator.userAgent.includes('Steam')) {
    // https://guide.dim.gg/Figuring-out-why-DIM-doesn't-work-in-Steam
    // t(`Browsercheck.Steam`)
    document.getElementById('browser-warning').textContent = steamBrowser[lang];
    document.getElementById('browser-warning').style.display = 'block';
  }

  // Samsung Internet is not supported because of its weird forced dark mode
  if (
    navigator.userAgent.includes('SamsungBrowser') &&
    // When the "Labs" setting to respect websites' dark mode capabilities is
    // enabled, Samsung Internet will actually set prefers-color-scheme to dark.
    // Otherwise, it's always "light". This *could* be a user who actually
    // prefers a light theme - there's no way to tell.
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    // t(`Browsercheck.Samsung`)
    document.getElementById('browser-warning').textContent = samsungInternet[lang];
    document.getElementById('browser-warning').style.display = 'block';
  }
}
