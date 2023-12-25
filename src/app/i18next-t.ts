import type { ParseKeys } from 'i18next';
// eslint-disable-next-line no-restricted-imports
import { t as originalT } from 'i18next';

export type I18nKey = ParseKeys;

export const t = (
  key: I18nKey,
  opts?:
    | { count?: number; context?: string; metadata?: { context?: string[]; keys?: string } }
    | {
        [arg: string]: number | string;
      },
): string => originalT(key, opts);

/**
 * This is a "marker function" that tells our i18next-scanner that you will translate this string later (tl = translate later).
 * This way you don't need to pre-translate everything or include redundant comments. This function is inlined and
 * has no runtime presence.
 */
/*@__INLINE__*/
export function tl<T extends I18nKey>(key: T): T {
  return key;
}
