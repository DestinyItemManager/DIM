import React from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import CharacterTile from './CharacterTile';
import './StoreHeading.scss';

/** Render a {CharacterTile} as a button */
export default function CharacterTileButton({
  character,
  onClick,
}: {
  character: DimStore;
  onClick?(id: string): void;
}) {
  const handleClick = () => onClick?.(character.id);

  return (
    <div
      onClick={handleClick}
      className={clsx('character', {
        current: character.current,
        destiny2: character.isDestiny2(),
      })}
    >
      <CharacterTile store={character} />
    </div>
  );
}
