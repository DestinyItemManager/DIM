import React, { useMemo } from 'react';
import { DimPlug, DimItem } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import ItemSockets from '../../item-popup/ItemSockets';
import _ from 'lodash';
import styles from './GeneratedSetItem.m.scss';
import { AppIcon } from 'app/shell/icons';
import { faRandom, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { showItemPicker } from 'app/item-picker/item-picker';
import { t } from 'app/i18next-t';
import { lockedItemsEqual } from './utils';
import { statValues as statValuesList } from '../process';

/**
 * An individual item in a generated set. Includes a perk display and a button for selecting
 * alternative items with the same stat mix.
 */
export default function GeneratedSetItem({
  item,
  locked,
  statValues,
  itemOptions,
  addLockedItem,
  removeLockedItem
}: {
  item: DimItem;
  locked?: readonly LockedItemType[];
  statValues: number[];
  itemOptions: DimItem[];
  addLockedItem(lockedItem: LockedItemType): void;
  removeLockedItem(lockedItem: LockedItemType): void;
}) {
  const altPerks = useMemo(() => {
    const altPerks: DimPlug[] = [];
    if (item.isDestiny2() && item.stats && item.stats.length >= 3 && item.sockets) {
      const statsByHash = _.keyBy(item.stats, (stat) => stat.statHash);
      for (const socket of item.sockets.sockets) {
        if (socket.plugOptions.length > 1) {
          for (const plug of socket.plugOptions) {
            if (plug !== socket.plug && plug.stats) {
              // Stats without the currently selected plug, with the optional plug
              const mix = statValuesList.map((statHash) => {
                const currentPlugValue =
                  (socket.plug && socket.plug.stats && socket.plug.stats[statHash]) || 0;
                const optionPlugValue = (plug.stats && plug.stats[statHash]) || 0;
                return (
                  ((statsByHash[statHash] && statsByHash[statHash].value) || 0) -
                  currentPlugValue +
                  optionPlugValue
                );
              });
              console.log(mix, statValues);
              if (mix.every((val, index) => val === statValues[index])) {
                altPerks.push(plug);
              }
            }
          }
        }
      }
    }
    return altPerks;
  }, [item, statValues]);

  const classesByHash = altPerks.reduce(
    (memo, perk) => ({ ...memo, [perk.plugItem.hash]: styles.altPerk }),
    {}
  );
  if (locked) {
    for (const lockedItem of locked) {
      if (lockedItem.type === 'perk') {
        classesByHash[lockedItem.perk.hash] = styles.selectedPerk;
      }
    }
  }

  const chooseReplacement = async () => {
    const ids = new Set(itemOptions.map((i) => i.id));

    try {
      const { item } = await showItemPicker({
        prompt: t('LoadoutBuilder.ChooseAlternate'),
        hideStoreEquip: true,
        filterItems: (item: DimItem) => ids.has(item.id)
      });

      addLockedItem({ type: 'item', item, bucket: item.bucket });
    } catch (e) {}
  };

  const onShiftClickPerk = (plug) => {
    const lockedItem: LockedItemType = { type: 'perk', perk: plug.plugItem, bucket: item.bucket };
    locked && locked.some((li) => lockedItemsEqual(lockedItem, li))
      ? removeLockedItem(lockedItem)
      : addLockedItem(lockedItem);
  };

  return (
    <div className={styles.item}>
      <LoadoutBuilderItem item={item} locked={locked} addLockedItem={addLockedItem} />

      {itemOptions.length > 1 ? (
        <button
          className={styles.swapButton}
          title={t('LoadoutBuilder.ChooseAlternateTitle')}
          onClick={chooseReplacement}
        >
          <AppIcon icon={faRandom} />
        </button>
      ) : (
        locked &&
        locked.some((li) => li.type === 'item') && (
          <button
            className={styles.swapButton}
            title={t('LoadoutBuilder.UnlockItem')}
            onClick={() => removeLockedItem({ type: 'item', item, bucket: item.bucket })}
          >
            <AppIcon icon={faUnlock} />
          </button>
        )
      )}
      {item.isDestiny2() && (
        <ItemSockets
          item={item}
          hideMods={true}
          classesByHash={classesByHash}
          onShiftClick={onShiftClickPerk}
        />
      )}
    </div>
  );
}
