import { dynamicStringsSelector } from 'app/inventory/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { conversionTable, iconPlaceholder } from './rich-destiny-text';

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
  const replacer = useDynamicStringReplacer(ownerId);
  // perform dynamic string replacement
  text = replacer(text);

  // split into segments, filter out empty, try replacing each piece with an icon if one matches
  const richTextSegments = text
    .split(iconPlaceholder)
    .filter(Boolean)
    .map((t, index) => replaceWithIcon(t, index));
  return <span>{richTextSegments}</span>;
}

function replaceWithIcon(textSegment: string, index: number) {
  const replacementInfo = conversionTable[textSegment];
  return replacementInfo ? (
    <span key={textSegment + index} title={replacementInfo.plaintext}>
      {replacementInfo.unicode}
    </span>
  ) : (
    textSegment
  );
}

export function useDynamicStringReplacer(ownerId = '') {
  const dynamicStrings = useSelector(dynamicStringsSelector);

  return function (text = '') {
    return text.replace(dynamicTextFinder, (segment) => {
      const hash = segment.match(/\d+/)![0];
      const dynamicValue =
        dynamicStrings?.byCharacter[ownerId]?.[hash] ?? dynamicStrings?.allProfile[hash];
      return dynamicValue?.toString() ?? segment;
    });
  };
}
