import { isPhonePortraitSelector } from 'app/inventory/selectors';
import type { DimStore } from 'app/inventory/store-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import VaultCapacity from 'app/store-stats/VaultCapacity';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
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
  const maxTotalPower = Math.floor(store.stats?.maxTotalPower?.value || store.powerLevel);
  const isPhonePortrait = useSelector(isPhonePortraitSelector);

  return (
    <div className="character-tile">
      <div
        className="background"
        style={{
          backgroundImage: `url("${store.background}")`,
          backgroundColor: store.color
            ? `rgb(${Math.round(store.color.red)}, ${Math.round(store.color.green)}, ${Math.round(
                store.color.blue
              )}`
            : 'black',
        }}
      />
      <CharacterEmblem store={store} />
      <div className="character-text">
        <div className="top">
          <div className="class">{store.className}</div>
          {!store.isVault && (
            <>
              <div className="powerLevel">
                <AppIcon icon={powerActionIcon} />
                {store.powerLevel}
              </div>
              {$featureFlags.unstickyStats && isPhonePortrait && (
                <div className="maxTotalPower">/ {maxTotalPower}</div>
              )}
            </>
          )}
        </div>
        <div className="bottom">
          {store.isVault ? (
            $featureFlags.unstickyStats && isPhonePortrait && <VaultCapacity />
          ) : (
            <>
              <div className="race-gender">{store.genderRace}</div>
              {store.destinyVersion === 1 && store.level < 40 && (
                <div className="level">{store.level}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
