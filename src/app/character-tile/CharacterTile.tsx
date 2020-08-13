import React from 'react';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { RootState } from 'app/store/reducers';
import type { DimStore, DimVault } from 'app/inventory/store-types';
import VaultCapacity from 'app/store-stats/VaultCapacity';
import './CharacterTile.scss';

const CharacterEmblem = ({ store }: { store: DimStore }) => (
  <div
    className={clsx('emblem', { vault: store.isVault })}
    style={{ backgroundImage: `url("${store.icon}")` }}
  />
);

function isVault(store: DimStore): store is DimVault {
  return store.isVault;
}

/**
 * Render a basic character tile without any event handlers
 * This is currently being shared between StoreHeading and CharacterTileButton
 */
export default function CharacterTile({ store }: { store: DimStore }) {
  const maxTotalPower = store.stats?.maxTotalPower;
  const isPhonePortrait = useSelector((state: RootState) => state.shell.isPhonePortrait);

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
        <div className="bottom">
          {isVault(store) ? (
            <>{$featureFlags.unstickyStats && isPhonePortrait && <VaultCapacity store={store} />}</>
          ) : (
            <>
              <div className="race-gender">{store.genderRace}</div>
              {store.isDestiny1() && store.level < 40 && <div className="level">{store.level}</div>}
              {$featureFlags.unstickyStats && isPhonePortrait && maxTotalPower && (
                <div className="maxTotalPower">
                  <img src={maxTotalPower.icon} alt={maxTotalPower.name} />
                  {Math.floor(maxTotalPower.value)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
