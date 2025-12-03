import { languageSelector } from 'app/dim-api/selectors';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
/* eslint-disable css-modules/no-unused-class */
import * as styles from './Description.m.scss';
import { LinesContent, Perk } from './descriptionInterface';

const customContent = (content: LinesContent) => {
  if (content.link) {
    return <ExternalLink href={content.link}>{content.text}</ExternalLink>;
  }
};

const joinClassNames = (classNames?: (keyof typeof styles)[]) =>
  classNames?.map((className) => styles[className]).join(' ');

/*
       (^|\b) : start from the beginning of the string or a word boundary
        [+-]? : include + or - prefixes
  (\d*\.)?\d+ : match numbers (including decimal values)
([xs]|ms|HP)? : optionally include 'x' multiplier, 's', 'ms' and 'HP' unit suffixes
      ?:[%°+] : optionally include %, ° and + suffixes
         \b|$ : stop at a word boundary or the end of the string
*/
const boldTextRegEx = /(?:^|\b)[+-]?(?:\d*\.)?\d+(?:[xs]|ms|HP)?(?:[%°+]|\b|$)/g;

function applyFormatting(text: string | undefined) {
  if (text === undefined) {
    return;
  }
  // I will remove this later just need to make this arrow optional in compiler
  if (text === '🡅') {
    return '';
  }
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
  const selectedLanguage = useSelector(languageSelector);
  if (perk.descriptions === undefined) {
    return null;
  }

  const description = perk.descriptions[selectedLanguage] || perk.descriptions.en;

  const convertedDescription = description?.map((line, i) => (
    <div className={joinClassNames(line.classNames)} key={i}>
      {line.linesContent?.map((linesContent, i) => (
        <span className={joinClassNames(linesContent.classNames)} key={i}>
          {linesContent.link ? customContent(linesContent) : applyFormatting(linesContent.text)}
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
