import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import styles from './ColorDestinySymbols.m.scss';

const iconPlaceholder = /([\uE000-\uF8FF])/g;

const styleTable = {
  [String.fromCodePoint(FontGlyphs.thermal)]: styles.thermal,
  [String.fromCodePoint(FontGlyphs.arc)]: styles.arc,
  [String.fromCodePoint(FontGlyphs.void)]: styles.void,
  [String.fromCodePoint(FontGlyphs.stasis)]: styles.stasis,
};

export default function ColorDestinySymbols({
  text,
  className,
}: {
  text?: string;
  className?: string;
}): React.ReactElement {
  // split into segments, filter out empty, try replacing each piece with an icon if one matches
  const richTextSegments = (text ?? '')
    .split(iconPlaceholder)
    .filter(Boolean)
    .map((t, index) => replaceWithIcon(t, index));
  return <span className={className}>{richTextSegments}</span>;
}

function replaceWithIcon(textSegment: string, index: number) {
  const className = styleTable[textSegment];
  return className ? (
    <span key={textSegment + index} className={className}>
      {textSegment}
    </span>
  ) : (
    textSegment
  );
}
