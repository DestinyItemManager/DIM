import i18next, { TOptions } from 'i18next';

/**
 * Wrap the t function so we can import a properly typed version. The default library won't let you.
 * This also includes a performance optimization that skips interpolation when no options are provided.
 */
export const t = (key: string | string[], options?: string | TOptions | undefined) =>
  i18next.t(key, options || { skipInterpolation: true });
