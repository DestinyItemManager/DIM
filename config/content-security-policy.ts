import builder from 'content-security-policy-builder';
import _ from 'lodash';
import { FeatureFlags } from './feature-flags';

const SELF = "'self'";

/**
 * Generate a Content Security Policy directive for a particular DIM environment (beta, release)
 */
export default function csp(env: 'release' | 'beta' | 'dev' | 'pr', featureFlags: FeatureFlags) {
  const baseCSP: Record<string, string[] | string | boolean> = {
    defaultSrc: ["'none'"],
    scriptSrc: [
      SELF,
      'https://*.googletagmanager.com',
      'https://*.google-analytics.com',
      // OpenCollective backers
      'https://opencollective.com',
    ],
    workerSrc: [SELF],
    styleSrc: [
      SELF,
      // For our inline styles
      "'unsafe-inline'",
      // Google Fonts
      'https://fonts.googleapis.com/',
    ],
    connectSrc: _.compact([
      SELF,
      // Google Analytics
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
      // Bungie.net API
      'https://www.bungie.net',
      // Sentry
      featureFlags.sentry && 'https://sentry.io/api/279673/',
      // Wishlists
      featureFlags.wishLists && 'https://raw.githubusercontent.com',
      featureFlags.wishLists && 'https://gist.githubusercontent.com',
      // DIM Sync
      'https://api.destinyitemmanager.com',
      // Clarity
      featureFlags.clarityDescriptions && 'https://database-clarity.github.io',
      // Stream Deck Plugin
      featureFlags.elgatoStreamDeck && 'ws://localhost:9120',
      // Game2Give
      featureFlags.issueBanner && 'https://bungiefoundation.donordrive.com',
    ]),
    imgSrc: [
      SELF,
      // Webpack inlines some images
      'data:',
      // Bungie.net images
      'https://www.bungie.net',
      // Google analytics tracking
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      // OpenCollective backers
      'https://opencollective.com',
    ],
    fontSrc: [
      SELF,
      'data:',
      // Google Fonts
      'https://fonts.gstatic.com',
    ],
    childSrc: [SELF],
    frameSrc: [
      // OpenCollective backers
      'https://opencollective.com',
      // Mastodon feed
      'https://www.mastofeed.com/apiv2/feed',
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
}
