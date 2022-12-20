import i18next, { TOptionsBase } from 'i18next';

/**
 * Wrap the t function so we can import a properly typed version. The default library won't let you.
 */
export const t = (
  key: string | string[],
  options?: ({ [key: string]: any } & TOptionsBase) | undefined
): string => i18next.t(key, options);

/**
 * This is a "marker function" that tells our i18next-scanner that you will translate this string later (tl = translate later).
 * This way you don't need to pre-translate everything or include redundant comments. This function is inlined and
 * has no runtime presence.
 */
/*@__INLINE__*/
export function tl<T extends string>(key: T): T {
  return key;
}
