import i18next from 'i18next';

/**
 * Get the text from the resource for a given key and locale.
 * Interpolate text with count.
 */
export function getCopyWithCount(key: string, locale: string, count: number) {
  const suffix = getSuffix(locale, count);
  const copy = getCopyFromResource(key + suffix, locale);

  return i18next.services.interpolator.interpolate(copy, { count }, locale, {
    escapeValue: false,
  });
}

/**
 * Gets one value by given key.
 */
function getCopyFromResource(key: string, locale: string) {
  return i18next.getResource(locale, 'translation', key) as string;
}

/**
 * Get the plural suffix for a given locale and count.
 * e.b. _zero, _one, _few, _many, _other
 */
function getSuffix(locale: string, count: number) {
  const resolver = i18next.services.pluralResolver as {
    getSuffix: (locale: string, count: number) => string;
  };

  return resolver.getSuffix(locale, count);
}
