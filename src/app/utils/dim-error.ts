import { t } from 'app/i18next-t';
import { PlatformErrorCodes } from 'bungie-api-ts/user';

/**
 * An internal error that captures more error info for reporting.
 *
 * The message is typically a localized error message.
 */
export class DimError extends Error {
  // A non-localized string to help identify/categorize errors for DIM developers. Usually the localization key of the message.
  code?: string;
  // The error that caused this error, if there is one
  error?: Error;

  /** Pass in just a message key to set the message to the localized version of that key, or override with the second parameter. */
  constructor(messageKey: string, message?: string) {
    super(message || t(messageKey));
    this.code = messageKey;
    this.name = 'DimError';
  }

  public withError(error: Error): DimError {
    this.error = error;
    return this;
  }

  // TODO: more factories, string formatting
  // TODO: handle specially in exceptions.ts
  // TODO: print an error in logs when sentry is off
  // TODO: show sentry report dialog if there's an option in this class
  //
}

/** Generate an error with a bit more info */
export function dimError(message: string, errorCode: PlatformErrorCodes): DimError {
  const error: DimError = new Error(message);
  error.code = errorCode;
  return error;
}
