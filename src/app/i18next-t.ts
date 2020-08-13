import i18next, { TOptions } from 'i18next';

/**
 * Wrap the t function so we can import a properly typed version. The default library won't let you.
 * This also includes a performance optimization that skips interpolation when no options are provided.
 */
export const t = (key: string | string[], options?: string | TOptions | undefined) =>
  i18next.t(key, options || { skipInterpolation: true });

/**
 * This is a "marker function" that tells our i18next-scanner that you will translate this string later (tl = translate later).
 * This way you don't need to pre-translate everything or include redundant comments. This function is inlined and
 * has no runtime presence.
 */
/*@__INLINE__*/
export function tl<T extends string>(key: T): T {
  return key;
}
