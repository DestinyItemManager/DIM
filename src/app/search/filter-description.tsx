import { t } from 'app/i18next-t';
import { FilterDescriptionInfo } from './filter-types';

// Because this is used in autocomplete.test.ts, t() can fail.
// So it needs to be typed to return | undefined.
function translateFilterDescription(
  description: FilterDescriptionInfo,
): undefined | string | [string, string][] {
  return typeof description === 'string'
    ? t(description)
    : Array.isArray(description)
      ? t(...description)
      : Object.entries(description).map(([keyword, i18nKey]) => [
          keyword,
          Array.isArray(i18nKey) ? t(...i18nKey) : t(i18nKey),
        ]);
}

export function filterDescriptionText(description: FilterDescriptionInfo) {
  const descriptionText = translateFilterDescription(description);
  return (
    descriptionText &&
    (typeof descriptionText === 'string'
      ? descriptionText
      : descriptionText?.map(([keyword, desc]) => `${keyword}: ${desc}`).join('\n'))
  );
}

export function FilterDescription({ description }: { description: FilterDescriptionInfo }) {
  const descriptionText = translateFilterDescription(description);
  return (
    <>
      {typeof descriptionText === 'string'
        ? descriptionText
        : descriptionText?.map(([keyword, desc]) => (
            <div key={keyword}>
              <b>{keyword}:</b> {desc}
            </div>
          ))}
    </>
  );
}
