export { t } from 'i18next';

/**
 * This is a "marker function" that tells our i18next-scanner that you will translate this string later (tl = translate later).
 * This way you don't need to pre-translate everything or include redundant comments. This function is inlined and
 * has no runtime presence.
 */
/*@__INLINE__*/
export function tl<T extends string>(key: T): T {
  return key;
}
