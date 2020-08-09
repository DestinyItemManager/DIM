import React from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import { CharacterTile } from './CharacterTile';
import './StoreHeading.scss';

export const CharacterTileButton = ({
  character,
  onClick,
}: {
  character: DimStore;
  onClick?(id: string): void;
}) => {
  const handleClick = () => onClick?.(character.id);

  return (
    <div
      onClick={handleClick}
      className={clsx('character', {
        current: character.current,
        destiny2: character.isDestiny2(),
      })}
    >
      <div className="background" style={{ backgroundImage: `url("${character.background}")` }} />
      <CharacterTile store={character} />
    </div>
  );
};
