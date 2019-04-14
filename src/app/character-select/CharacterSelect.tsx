import React from 'react';
import classNames from 'classnames';
import { DimStore } from '../inventory/store-types';
import SimpleCharacterTile from '../inventory/SimpleCharacterTile';
import styles from './CharacterSelect.m.scss';

/**
 * Select for picking a character
 */
export default function CharacterSelect({
  stores,
  selectedStore,
  vertical,
  onCharacterChanged
}: {
  stores: DimStore[];
  selectedStore: DimStore;
  vertical?: boolean;
  onCharacterChanged(storeId: string): void;
}) {
  return (
    <div className={vertical ? styles.vertical : styles.horizontal}>
      {stores
        .filter((s) => !s.isVault)
        .map((store) => (
          <div
            key={store.id}
            className={classNames(styles.tile, {
              [styles.unselected]: store.id !== selectedStore.id
            })}
          >
            <SimpleCharacterTile character={store} onClick={onCharacterChanged} />
          </div>
        ))}
    </div>
  );
}
