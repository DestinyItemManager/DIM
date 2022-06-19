import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { CommunityInsight } from '../hooks';
import { clarityDescriptionsSelector } from '../selectors';
/* eslint-disable css-modules/no-unused-class */
import styles from './Description.m.scss';
import { LinesContent } from './descriptionInterface';

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

/**
 * @param Object.hash Perk hash from DestinyInventoryItemDefinition
 * @param Object.defaultDimDescription It will return whatever you give it if it can't find the perk
 ** This is cut down version of original converted
 */
export function ClarityDescriptionsOld({
  hash,
  fallback,
  className,
}: {
  hash: number;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const descriptions = useSelector(clarityDescriptionsSelector);
  const perk = descriptions?.[hash];
  if (!perk || perk.statOnly || !perk.simpleDescription) {
    return <>{fallback ?? null}</>;
  }

  const convertedDescription = perk.simpleDescription.map((line, i) => (
    <div className={joinClassNames(line.className)} key={i}>
      {line.lineText?.map((linesContent, i) => (
        <span className={joinClassNames(linesContent.className)} title={linesContent.title} key={i}>
          {linesContent.text || customContent(linesContent)}
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

/**
 * Renders the Clarity description for the provided Community Insight.
 * This is a cut-down version of the original from the Clarity extension.
 */
export function ClarityDescriptions({
  communityInsight,
  className,
}: {
  communityInsight: CommunityInsight;
  className?: string;
}) {
  const convertedDescription = communityInsight.simpleDescription.map((line, i) => (
    <div className={joinClassNames(line.className)} key={i}>
      {/* eslint-disable-next-line radar/no-identical-functions */}
      {line.lineText?.map((linesContent, i) => (
        <span className={joinClassNames(linesContent.className)} title={linesContent.title} key={i}>
          {linesContent.text || customContent(linesContent)}
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
