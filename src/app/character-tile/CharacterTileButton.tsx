import clsx from 'clsx';
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
    className,
  }: {
    character: DimStore;
    onClick?: (id: string) => void;
    children?: React.ReactNode;
    className?: string;
  },
  ref: React.Ref<HTMLDivElement>,
) {
  const handleClick = onClick ? () => onClick(character.id) : undefined;

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={handleClick}
      className={clsx(styles.character, className)}
      ref={ref}
    >
      <CharacterTile store={character} />
      {children}
    </div>
  );
});
