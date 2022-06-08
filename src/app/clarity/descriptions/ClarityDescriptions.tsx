import { RootState } from 'app/store/types';
import { useSelector } from 'react-redux';
import { Line, LinesContent } from '../descriptionInterface';
/* eslint-disable css-modules/no-unused-class */
import styles from './Description.m.scss';

const customContent = (content: LinesContent) => {
  if (content.linkUrl) {
    return (
      <a href={content.linkUrl} target="_blank">
        {content.linkText}
      </a>
    );
  }
};

const joinClassNames = (classNames?: string) =>
  classNames
    ?.split(' ')
    .map((className: string) => styles[className])
    .join(' ');

/**
 * @param Object.hash Perk hash from DestinyInventoryItemDefinition
 * @param Object.fallback Default DIM description - It will return whatever you give it if it can't find the perk
 ** This is cut down version of original converted
 */
export default function ClarityDescriptionConstructor({
  hash,
  fallback,
}: {
  hash: number;
  fallback: JSX.Element;
}): JSX.Element {
  const descriptions = useSelector((state: RootState) => state.clarity.descriptions);

  if (
    hash === undefined ||
    descriptions === undefined ||
    descriptions[hash]?.simpleDescription === undefined
  ) {
    return fallback;
  }

  const descriptionConstructor = (lines: Line[]) =>
    lines?.map((line: Line, i: number) => (
      <div className={joinClassNames(line.className)} key={i}>
        {line.lineText?.map((linesContent, i) => (
          <span
            className={joinClassNames(linesContent.className)}
            title={linesContent.title}
            key={i}
          >
            {linesContent.text || customContent(linesContent)}
          </span>
        ))}
      </div>
    ));

  // Adding 1 line to make clear it's not an official description
  // And it technically promotes Clarity but also directs people to us
  // if the description is incorrect or they think it is and we can sort that out faster
  // then people are complaining about it to us and not the DIM team
  return (
    <>
      {descriptionConstructor([
        {
          lineText: [
            { text: 'Community description from ' },
            {
              linkUrl: 'https://d2clarity.wordpress.com/',
              linkText: 'Clarity',
              className: 'link',
            },
          ],
        },
        { className: 'spacer' },
        ...descriptions[hash].simpleDescription!,
      ])}
    </>
  );
}
