import { forwardRef } from 'react';
import { DimStore } from '../inventory/store-types';
import CharacterTile from './CharacterTile';
import styles from './CharacterTileButton.m.scss';

/** Render a {CharacterTile} as a button */
export default forwardRef(function CharacterTileButton(
  {
    character,
    onClick,
    children,
  }: {
    character: DimStore;
    onClick?: (id: string) => void;
    children?: React.ReactNode;
  },
  ref: React.Ref<HTMLDivElement>
) {
  const handleClick = onClick ? () => onClick(character.id) : undefined;

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={handleClick}
      className={styles.character}
      ref={ref}
    >
      <CharacterTile store={character} />
      {children}
    </div>
  );
});
