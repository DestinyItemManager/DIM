import React from 'react';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { isPhonePortraitSelector } from 'app/inventory/selectors';
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
  const maxTotalPower = Math.floor(store.stats?.maxTotalPower?.value || store.powerLevel);
  const isPhonePortrait = useSelector(isPhonePortraitSelector);

  return (
    <div className="character-tile">
      <div className="background" style={{ backgroundImage: `url("${store.background}")` }} />
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
          {isVault(store) ? (
            $featureFlags.unstickyStats && isPhonePortrait && <VaultCapacity store={store} />
          ) : (
            <>
              <div className="race-gender">{store.genderRace}</div>
              {store.isDestiny1() && store.level < 40 && <div className="level">{store.level}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
