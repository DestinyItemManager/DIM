import React from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import { AppIcon, powerActionIcon } from '../shell/icons';
import './CharacterTile.scss';

const CharacterEmblem = ({ store }: { store: DimStore }) => (
  <div
    className={clsx('emblem', { vault: store.isVault })}
    style={{ backgroundImage: `url("${store.icon}")` }}
  />
);

/**
 * Render a basic character tile without any event handlers
 * This is currently being shared between StoreHeading and CharacterTileButton
 */
export default function CharacterTile({ store }: { store: DimStore }) {
  return (
    <div className="character-tile">
      <div className="background" style={{ backgroundImage: `url("${store.background}")` }} />
      <CharacterEmblem store={store} />
      <div className="character-text">
        <div className="top">
          <div className="class">{store.className}</div>
          {!store.isVault && (
            <div className="powerLevel">
              <AppIcon icon={powerActionIcon} />
              {store.powerLevel}
            </div>
          )}
        </div>
        {!store.isVault && (
          <div className="bottom">
            <div className="race-gender">{store.genderRace}</div>
            {store.isDestiny1() && store.level < 40 && <div className="level">{store.level}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
