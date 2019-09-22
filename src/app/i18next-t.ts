import i18next from 'i18next';

/**
 * Wrap the t function so we can import a properly typed version. The default library won't let you.
 * This also includes a performance optimization that skips interpolation when no options are provided.
 */
export const t = (
  key: string | string[],
  options?: string | i18next.TOptions<i18next.StringMap> | undefined
) => i18next.t<string, string, i18next.StringMap>(key, options || { skipInterpolation: true });
