import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { useSelector } from 'react-redux';
import { descriptionsSelector } from '../selectors';
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
export default function ClarityDescriptions({ hash }: { hash: number }) {
  const descriptions = useSelector(descriptionsSelector);
  const lines = descriptions?.[hash]?.simpleDescription;
  if (!lines) {
    return null;
  }

  const convertedDescription = lines?.map((line, i) => (
    <div className={joinClassNames(line.className)} key={i}>
      {line.lineText?.map((linesContent, i) => (
        <span className={joinClassNames(linesContent.className)} title={linesContent.title} key={i}>
          {linesContent.text || customContent(linesContent)}
        </span>
      ))}
    </div>
  ));

  return (
    <div className={styles.communityDescription}>
      <h3>{t('MovePopup.CommunityData')}</h3>
      {convertedDescription}
    </div>
  );
}
