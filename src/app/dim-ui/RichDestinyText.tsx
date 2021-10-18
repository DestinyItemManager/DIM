import { dynamicStringsSelector } from 'app/inventory/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { conversionTable, iconPlaceholder } from './rich-destiny-text';
import styles from './RichDestinyText.m.scss';

const dynamicTextFinder = /\{var:\d+\}/g;

/**
 * converts an objective description or other string to html nodes. this identifies:
 *
 * • bungie's localized placeholder strings
 *
 * • special unicode characters representing weapon/etc icons in the game's font
 *
 * and ensures they are replaced with the unicode characters
 *
 * this also performs new dynamic string replacement
 * (certain per-character customized strings)
 * so please include the characterId of the item's owner if possible
 */
export default function RichDestinyText({
  text,
  ownerId = '', // normalize for cleaner indexing later
}: {
  text?: string;
  ownerId?: string;
}): React.ReactElement {
  const dynamicStrings = useSelector(dynamicStringsSelector);

  // perform dynamic string replacement
  text = (text ?? '').replace(dynamicTextFinder, (segment) => {
    const hash = segment.match(/\d+/)![0];
    const dynamicValue =
      dynamicStrings?.byCharacter[ownerId]?.[hash] ?? dynamicStrings?.allProfile[hash];
    return dynamicValue?.toString() ?? segment;
  });

  // split into segments, filter out empty, try replacing each piece with an icon if one matches
  const richTextSegments = text
    .split(iconPlaceholder)
    .filter(Boolean)
    .map((t, index) => replaceWithIcon(t, index));
  return <>{richTextSegments}</>;
}

function replaceWithIcon(textSegment: string, index: number) {
  const replacementInfo = conversionTable[textSegment];
  return (
    <span
      key={textSegment + index}
      title={replacementInfo?.plaintext}
      className={replacementInfo ? styles.glyph : undefined}
    >
      {replacementInfo?.unicode ?? textSegment}
    </span>
  );
}
