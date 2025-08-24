import { t } from 'app/i18next-t';
import { FilterDescriptionInfo } from './filter-types';

function translateFilterDescription(
  description: FilterDescriptionInfo,
): string | [string, string][] {
  return Array.isArray(description)
    ? t(...description)
    : typeof description === 'string'
      ? t(description)
      : Object.entries(description).map(([keyword, i18nKey]) => [
          keyword,
          Array.isArray(i18nKey) ? t(...i18nKey) : t(i18nKey),
        ]);
}

export function filterDescriptionText(description: FilterDescriptionInfo) {
  const descriptionText = translateFilterDescription(description);
  return typeof descriptionText === 'string'
    ? descriptionText
    : descriptionText.map(([keyword, desc]) => `${keyword}: ${desc}`).join('\n');
}

export function FilterDescription({ description }: { description: FilterDescriptionInfo }) {
  const descriptionText = translateFilterDescription(description);
  return (
    <>
      {typeof descriptionText === 'string'
        ? descriptionText
        : descriptionText.map(([keyword, desc]) => (
            <div key={keyword}>
              <b>{keyword}:</b> {desc}
            </div>
          ))}
    </>
  );
}
