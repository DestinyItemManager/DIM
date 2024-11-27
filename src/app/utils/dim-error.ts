import { BungieError } from 'app/bungie-api/http-client';
import { I18nKey, t } from 'app/i18next-t';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { convertToError } from './errors';

/**
 * An internal error that captures more error info for reporting.
 *
 * The message is typically a localized error message.
 */
export class DimError extends Error {
  /** A non-localized string to help identify/categorize errors for DIM developers. Usually the localization key of the message. */
  code?: string;
  /** The error that caused this error, if there is one. Naming it 'cause' makes it automatically chain in Sentry. */
  cause?: Error;
  /** Whether to show social links in the error report dialog. */
  showSocials = true;

  /** Pass in just a message key to set the message to the localized version of that key, or override with the second parameter. */
  constructor(messageKey: I18nKey, message?: string) {
    super(message || t(messageKey));
    this.code = messageKey;
    this.name = 'DimError';
  }

  public withError(error: unknown): DimError {
    this.cause = convertToError(error);
    return this;
  }

  public withNoSocials(): DimError {
    this.showSocials = false;
    return this;
  }

  /**
   * If this error is a Bungie API error, return its platform code.
   */
  public bungieErrorCode(): PlatformErrorCodes | undefined {
    return this.cause instanceof BungieError
      ? this.cause.code
      : this.cause instanceof DimError
        ? this.cause.bungieErrorCode()
        : undefined;
  }
}
