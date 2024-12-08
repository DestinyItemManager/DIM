import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import CharacterTile from './CharacterTile';
import styles from './CharacterTileButton.m.scss';

/** Render a {CharacterTile} as a button */
export default function CharacterTileButton({
  character,
  onClick,
  children,
  className,
  ref,
}: {
  character: DimStore;
  onClick: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const handleClick = onClick ? () => onClick(character.id) : undefined;

  // TODO: these should really be radio buttons (one exclusive choice among several) and be navigable with arrow keys.

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(styles.character, className)}
      ref={ref}
    >
      <CharacterTile store={character} />
      {children}
    </button>
  );
}
