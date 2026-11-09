import { Fragment, ReactNode } from 'react';

/**
 * Render a translated string whose {{placeholders}} are filled with React
 * nodes (usually links). Call t() without passing those values so i18next
 * leaves the placeholders in the text, then hand the nodes to this component.
 *
 * Translations come from Crowdin and are committed without review, so they
 * are rendered as text rather than through dangerouslySetInnerHTML.
 */
export default function TranslatedText({
  text,
  values,
}: {
  text: string;
  values: { [placeholder: string]: ReactNode };
}) {
  // Splitting on a capture group leaves the placeholder names at the odd indexes
  const segments = text.split(/\{\{\s*(\w+)\s*\}\}/);
  return (
    <>
      {segments.map((segment, i) =>
        i % 2 === 0 ? segment : <Fragment key={i}>{values[segment] ?? `{{${segment}}}`}</Fragment>,
      )}
    </>
  );
}
