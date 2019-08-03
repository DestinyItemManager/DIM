import i18next from 'i18next';

export const t = (
  key: string | string[],
  options?: string | i18next.TOptions<i18next.StringMap> | undefined
) => i18next.t<string, string, i18next.StringMap>(key, options || { skipInterpolation: true });
