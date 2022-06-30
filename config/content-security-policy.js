const builder = require('content-security-policy-builder');

const SELF = "'self'";

/**
 * Generate a Content Security Policy directive for a particular DIM environment (beta, release)
 */
module.exports = function csp(env) {
  const baseCSP = {
    defaultSrc: ["'none'"],
    scriptSrc: [
      SELF,
      'https://www.google-analytics.com',
      // Twitter Widget
      'https://platform.twitter.com',
      'https://cdn.syndication.twimg.com',
      'https://opencollective.com',
    ],
    styleSrc: [
      SELF,
      // For our inline styles
      "'unsafe-inline'",
      // Google Fonts
      'https://fonts.googleapis.com/css',
      // Twitter Widget
      'https://platform.twitter.com/css/',
      'https://*.twimg.com/',
    ],
    connectSrc: [
      SELF,
      // Google Analytics
      'https://www.google-analytics.com',
      // Bungie.net API
      'https://www.bungie.net',
      // Sentry
      'https://sentry.io/api/279673/',
      // Wishlists
      'https://raw.githubusercontent.com',
      'https://gist.githubusercontent.com',
      // DIM Sync
      'https://api.destinyitemmanager.com',
      // Clarity
      'https://ice-mourne.github.io',
      // Stream Deck Plugin
      'wss://localhost:9119',
    ],
    imgSrc: [
      SELF,
      // Webpack inlines some images
      'data:',
      // Bungie.net images
      'https://www.bungie.net',
      // Google analytics tracking
      'https://ssl.google-analytics.com',
      'https://www.google-analytics.com',
      'https://csi.gstatic.com',
      // OpenCollective backers
      'https://opencollective.com',
      // Twitter Widget
      'https://syndication.twitter.com',
      'https://platform.twitter.com',
      'https://*.twimg.com/',
    ],
    fontSrc: [
      SELF,
      // Google Fonts
      'https://fonts.gstatic.com',
    ],
    childSrc: [SELF],
    frameSrc: [
      // Twitter Widget
      'https://syndication.twitter.com/',
      'https://platform.twitter.com/',
      'https://opencollective.com',
    ],
    prefetchSrc: [SELF],
    objectSrc: SELF,
    // Web app manifest
    manifestSrc: SELF,
  };

  // Turn on CSP reporting to sentry.io on beta only
  if (env === 'beta') {
    baseCSP.reportUri =
      'https://sentry.io/api/279673/csp-report/?sentry_key=1367619d45da481b8148dd345c1a1330';
  }

  return builder({
    directives: baseCSP,
  });
};
