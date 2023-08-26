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
  }: {
    character: DimStore;
    onClick?: (id: string) => void;
    children: React.ReactNode;
  },
  ref: React.Ref<HTMLDivElement>
) {
  const handleClick = onClick ? () => onClick(character.id) : undefined;

  // TODO: buttonize
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={handleClick}
      className={clsx(styles.character, {
        [styles.current]: character.current,
        [styles.destiny2]: character.destinyVersion === 2,
        // TODO: do we need this?
        vault: character.isVault,
      })}
      ref={ref}
    >
      <CharacterTile store={character} />
      {children}
    </div>
  );
});
