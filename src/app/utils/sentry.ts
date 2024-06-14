import { browserTracingIntegration } from '@sentry/browser';
import { BrowserOptions, captureException, init, setTag, setUser, withScope } from '@sentry/react';
import { BungieError } from 'app/bungie-api/http-client';
import { getToken } from 'app/bungie-api/oauth-tokens';
import { HashLookupFailure } from 'app/destiny2/definitions';
import { defaultLanguage } from 'app/i18n';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { DimError } from './dim-error';

// DIM error codes to ignore and not report. This works regardless of language.
const ignoreDimErrors: (string | PlatformErrorCodes)[] = [
  'BungieService.SlowResponse',
  'BungieService.Difficulties',
  'BungieService.Throttled',
  'BungieService.Maintenance',
  'BungieService.NotConnected',
  'BungieService.NotConnectedOrBlocked',
  'ItemService.ExoticError',
  PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation,
];

const options: BrowserOptions = {
  enabled: $featureFlags.sentry,
  dsn: 'https://1367619d45da481b8148dd345c1a1330@sentry.io/279673',
  release: $DIM_VERSION,
  environment: $DIM_FLAVOR,
  ignoreErrors: [],
  sampleRate: $DIM_VERSION === 'beta' ? 0.5 : 0.01, // Sample Beta at 50%, Prod at 1%
  attachStacktrace: true,
  // Only send trace headers to our own server
  tracePropagationTargets: ['https://api.destinyitemmanager.com'],
  integrations: [
    browserTracingIntegration({
      beforeStartSpan: (context) => ({
        ...context,
        // We could use the React-Router integration but it's annoying
        name: window.location.pathname
          .replace(/\/\d+\/d(1|2)/g, '/profileMembershipId/d$1')
          .replace(/\/vendors\/\d+/g, '/vendors/vendorId')
          .replace(/index\.html/, ''),
      }),
    }),
  ],
  tracesSampleRate: 0.001, // Performance traces at 0.1%
  beforeSend: (event, hint) => {
    const e = hint?.originalException;
    const underlyingError = e instanceof DimError ? e.cause : undefined;

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
      let message = e.code;
      if (e.bungieErrorCode()) {
        message = `${message} (${e.bungieErrorCode()})`;
      }
      event.message = message;
      // TODO: it might be neat to be able to pass attachments here too - such as the entire profile response!

      // Do deeper surgery to overwrite the localized message with the code
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value === e.message) {
            ex.value = message;
          }
        }
      }

      event.tags = {
        ...event.tags,
        code: e.code,
      };
      if (underlyingError instanceof BungieError) {
        event.tags = {
          ...event.tags,
          bungieErrorCode: underlyingError.code,
        };
      }

      if (underlyingError) {
        event.extra = {
          ...event.extra,
          cause: underlyingError,
        };
      }
    }

    return event;
  },
};

// TODO: There's a redux integration but I'm worried it'd be too much trouble to trim out all the stuff we wouldn't want to report (by default it sends the whole action & state.
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/redux/
init(options);

// Set user ID (membership ID) to help debug and to better count affected users
const token = getToken();
if (token?.bungieMembershipId) {
  setUser({ id: token.bungieMembershipId });
}

// Capture locale
setTag('lang', defaultLanguage());

/** Sentry.io exception reporting */
export const reportException = (name: string, e: any, errorInfo?: Record<string, unknown>) => {
  // TODO: we can also do this in some situations to gather more feedback from users
  // Sentry.showReportDialog();
  withScope((scope) => {
    setTag('context', name);
    if (errorInfo) {
      scope.setExtras(errorInfo);
    }
    captureException(e);
  });
};
