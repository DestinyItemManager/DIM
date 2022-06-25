import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
/* eslint-disable css-modules/no-unused-class */
import styles from './Description.m.scss';
import { LinesContent, Perk } from './descriptionInterface';

const customContent = (content: LinesContent) => {
  if (content.linkUrl) {
    return <ExternalLink href={content.linkUrl}>{content.linkText}</ExternalLink>;
  }
};

const joinClassNames = (classNames?: string) =>
  classNames
    ?.split(' ')
    .map((className) => styles[className])
    .join(' ');

/*
     (^|\b) : start from the beginning of the string or a word boundary
      [+-]? : include + or - prefixes
\d+(\.\d+)? : match numbers (including decimal values)
         x? : optionally match 'x' multiplier suffix
        ?:% : optionally include % suffix
       \b|$ : stop at a word boundary or the end of the string
*/
const boldTextRegEx = /(^|\b)(([+-]?\d+(\.\d+)?)x?)(?:%|\b|$)/g;

function applyFormatting(text: string) {
  const segments = [];

  const matches = [...text.matchAll(boldTextRegEx)];
  let startIndex = 0;
  let n = 0;
  for (const match of matches) {
    if (match.index === undefined) {
      continue;
    }
    const capturedText = match[0];
    segments.push(text.substring(startIndex, match.index));
    segments.push(<b key={n++}>{capturedText}</b>);
    startIndex = match.index + capturedText.length;
  }
  if (startIndex < text.length) {
    segments.push(text.substring(startIndex));
  }

  return segments;
}

/**
 * Renders the Clarity description for the provided Community Insight.
 * This is a cut-down version of the original from the Clarity extension.
 */
export default function ClarityDescriptions({
  perk,
  className,
}: {
  perk: Perk;
  className?: string;
}) {
  if (!perk.simpleDescription) {
    return null;
  }

  const convertedDescription = perk.simpleDescription.map((line, i) => (
    <div className={joinClassNames(line.className)} key={i}>
      {line.lineText?.map((linesContent, i) => (
        <span className={joinClassNames(linesContent.className)} title={linesContent.title} key={i}>
          {linesContent.text ? applyFormatting(linesContent.text) : customContent(linesContent)}
        </span>
      ))}
    </div>
  ));

  return (
    <div className={clsx(styles.communityDescription, className)}>
      <h3>{t('MovePopup.CommunityData')}</h3>
      {convertedDescription}
    </div>
  );
}
