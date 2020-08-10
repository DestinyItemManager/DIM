import React from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import CharacterTileButton from '../character-tile/CharacterTileButton';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import styles from './CharacterSelect.m.scss';

/**
 * Select for picking a character
 */
export default function CharacterSelect({
  stores,
  selectedStore,
  vertical,
  isPhonePortrait,
  onCharacterChanged,
}: {
  stores: DimStore[];
  selectedStore: DimStore;
  vertical?: boolean;
  isPhonePortrait?: boolean;
  onCharacterChanged(storeId: string): void;
}) {
  if (isPhonePortrait && !vertical) {
    const onViewChange = (indices) => onCharacterChanged(stores[indices[0]].id);

    return (
      <div className={styles.pager}>
        <ViewPager>
          <Frame className={styles.frame} autoSize={false}>
            <Track
              currentView={selectedStore.id}
              contain={false}
              onViewChange={onViewChange}
              className={styles.track}
            >
              {stores
                .filter((s) => !s.isVault)
                .map((store) => (
                  <View className={styles.tile} key={store.id}>
                    <CharacterTileButton character={store} onClick={onCharacterChanged} />
                  </View>
                ))}
            </Track>
          </Frame>
        </ViewPager>
      </div>
    );
  }

  return (
    <div className={vertical ? styles.vertical : styles.horizontal}>
      {stores
        .filter((s) => !s.isVault)
        .map((store) => (
          <div
            key={store.id}
            className={clsx(styles.tile, {
              [styles.unselected]: store.id !== selectedStore.id,
            })}
          >
            <CharacterTileButton character={store} onClick={onCharacterChanged} />
          </div>
        ))}
    </div>
  );
}
