const builder = require('content-security-policy-builder');

const SELF = "'self'";

/**
 * Generate a Content Security Policy directive for a particular DIM environment (beta, release)
 */
module.exports = function csp(env) {
  const baseCSP = {
    defaultSrc: ['none'],
    scriptSrc: [
      SELF,
      // For Webpack?
      "'unsafe-eval'",
      "'unsafe-inline'",
      'data:',
      // Include a snippet of inline scripts
      "'report-sample'",
      // Google API (Drive)
      'https://apis.google.com',
      'https://www.google-analytics.com',
      // Twitter Widget
      'https://platform.twitter.com',
      'https://cdn.syndication.twimg.com',
      'https://opencollective.com'
    ],
    styleSrc: [
      SELF,
      // For Webpack's inserted styles
      "'unsafe-inline'",
      // Google Fonts
      'https://fonts.googleapis.com/css',
      // Twitter Widget
      'https://platform.twitter.com/css/',
      'https://*.twimg.com/'
    ],
    connectSrc: [
      SELF,
      // Google Analytics
      'https://www.google-analytics.com',
      // Bungie.net API
      'https://www.bungie.net',
      // DTR Reviews API
      'https://reviews-api.destinytracker.net',
      'https://db-api.destinytracker.com'
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
      // User profile info in storage settings
      'https://*.googleusercontent.com/'
    ],
    fontSrc: [
      SELF,
      // Google Fonts
      'https://fonts.gstatic.com'
    ],
    childSrc: [
      SELF,
      // Google Login
      'https://accounts.google.com',
      'https://content.googleapis.com'
    ],
    frameSrc: [
      // Google Login
      'https://accounts.google.com',
      'https://content.googleapis.com',
      // Twitter Widget
      'https://syndication.twitter.com/',
      'https://platform.twitter.com/',
      'https://opencollective.com'
    ],
    objectSrc: SELF,
    // Web app manifest
    manifestSrc: SELF
  };

  // Turn on reporting to sentry.io on beta only
  if (env === 'beta') {
    baseCSP.reportUri =
      'https://sentry.io/api/279673/csp-report/?sentry_key=1367619d45da481b8148dd345c1a1330';
    baseCSP.connectSrc.push('https://sentry.io/api/279673/store/');
  } else if (env === 'release') {
    // Allow release to load updated classified item definitions and images from beta
    baseCSP.connectSrc.push('https://beta.destinyitemmanager.com');
    baseCSP.imgSrc.push('https://beta.destinyitemmanager.com');
  }

  return builder({
    directives: baseCSP
  });
};
