import ClassIcon from 'app/dim-ui/ClassIcon';
import type { DimStore } from 'app/inventory/store-types';
import { AppIcon, powerActionIcon } from 'app/shell/icons';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import VaultCapacity from 'app/store-stats/VaultCapacity';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './CharacterTile.m.scss';

const CharacterEmblem = ({ store }: { store: DimStore }) => (
  <div
    className={clsx(styles.emblem, { [styles.vault]: store.isVault })}
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
    <div className={styles.characterTile}>
      <div
        className={styles.background}
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
      <div className={styles.characterText}>
        <div className={styles.top}>
          <div className={styles.class}>{store.className}</div>
          {!store.isVault && (
            <>
              <div className={styles.powerLevel}>
                <AppIcon icon={powerActionIcon} />
                {store.powerLevel}
              </div>
              {isPhonePortrait && <div className={styles.maxTotalPower}>/ {maxTotalPower}</div>}
            </>
          )}
        </div>
        <div className={styles.bottom}>
          {store.isVault ? (
            isPhonePortrait && <VaultCapacity />
          ) : (
            <>
              <div>
                {!store.isVault && (
                  <ClassIcon classType={store.classType} className={styles.classIcon} />
                )}
              </div>
              <div className="race-gender">{store.race}</div>
              {store.destinyVersion === 1 && store.level < 40 && (
                <div className={styles.level}>{store.level}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
