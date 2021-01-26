import type { BrowserOptions, Scope } from '@sentry/browser';
import { BungieError } from 'app/bungie-api/http-client';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { HashLookupFailure } from 'app/destiny2/definitions';
import { defaultLanguage } from 'app/i18n';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { DimError } from './dim-error';
import { errorLog } from './log';

// TODO: rename this file "sentry"

/** Sentry.io exception reporting */
export let reportException = (name: string, e: Error, errorInfo?: {}) => {
  errorLog(
    'exception',
    name,
    e,
    errorInfo,
    e instanceof DimError && e.code,
    e instanceof DimError && e.error
  );
};

// DIM error codes to ignore and not report. This works regardless of language.
const ignoreDimErrors: (string | PlatformErrorCodes)[] = [
  'BungieService.SlowResponse',
  'BungieService.Difficulties',
  'BungieService.Throttled',
  'BungieService.Maintenance',
  'BungieService.NotConnected',
  'BungieService.NotConnectedOrBlocked',
  PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation,
];

if ($featureFlags.sentry) {
  // The require instead of import helps us trim this from the production bundle
  const Sentry = require('@sentry/react');

  const options: BrowserOptions = {
    dsn: 'https://1367619d45da481b8148dd345c1a1330@sentry.io/279673',
    release: $DIM_VERSION,
    environment: $DIM_FLAVOR,
    ignoreErrors: [
      /QuotaExceededError/,
      'HTTP 503 returned',
      'Waiting due to HTTP 503',
      /FatalTokenError/,
      /Failed to fetch/,
      /AbortError/,
      /Non-Error promise rejection/,
    ],
    sampleRate: $DIM_VERSION === 'beta' ? 0.5 : 0.01, // Sample Beta at 50%, Prod at 1%
    attachStacktrace: true,
    integrations: [
      new Sentry.Integrations.BrowserTracing({
        tracingOrigins: ['localhost', 'api.destinyitemmanager.com', 'www.bungie.net', /^\//],
        beforeNavigate: (context) => ({
          ...context,
          // We could use the React-Router integration but it's annoying
          name: location.pathname
            .replace(/\/\d+d(1|2)\//g, '/profileMembershipId/d\1/')
            .replace(/\/vendors\/\d+/g, '/vendors/vendorId'),
        }),
      }),
    ],
    tracesSampleRate: 0.01, // Performance traces at 1%
    beforeSend: function (event, hint) {
      const e = hint?.originalException;
      const underlyingError = e instanceof DimError ? e.error : undefined;

      const code =
        underlyingError instanceof BungieError
          ? underlyingError.code
          : e instanceof DimError
          ? e.code
          : undefined;
      if (code && ignoreDimErrors.includes(code)) {
        return null; // drop report
      }
      if (e instanceof HashLookupFailure) {
        // Add the ID to the fingerprint so we don't collapse different errors
        event.fingerprint = ['{{ default }}', String(e.table), String(e.id)];
      }
      if (e instanceof DimError) {
        // Replace the (localized) message with our code
        event.message = e.code;

        // TODO: it might be neat to be able to pass attachments here too - such as the entire profile response!
      }

      return event;
    },
  };

  // TODO: There's a redux integration but I'm worried it'd be too much trouble to trim out all the stuff we wouldn't want to report (by default it sends the whole action & state.
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/redux/

  Sentry.init(options);

  // Set user ID (membership ID) to help debug and to better count affected users
  const token = getToken();
  if (token?.bungieMembershipId) {
    Sentry.setUser({ id: token.bungieMembershipId });
  }
  // Capture locale
  Sentry.setTag('lang', defaultLanguage());

  reportException = (name: string, e: Error, errorInfo?: {}) => {
    // TODO: we can also do this in some situations to gather more feedback from users
    // Sentry.showReportDialog();
    Sentry.withScope((scope: Scope) => {
      scope.setTag('context', name);
      if (e instanceof DimError) {
        scope.setExtras({ underlyingError: e.error });
      }
      if (errorInfo) {
        scope.setExtras(errorInfo);
      }
      Sentry.captureException(e);
    });
  };
}
