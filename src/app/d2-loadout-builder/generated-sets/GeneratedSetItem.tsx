import React from 'react';
import { D2Item, DimPlug, DimItem } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import ItemSockets from '../../item-popup/ItemSockets';
import { statHashes } from '../process';
import _ from 'lodash';
import styles from './GeneratedSetItem.m.scss';
import { AppIcon } from 'app/shell/icons';
import { faRandom } from '@fortawesome/free-solid-svg-icons';
import { showItemPicker } from 'app/item-picker/item-picker';

/**
 * An individual item in a generated set. Includes a perk display and a button for selecting
 * alternative items with the same stat mix.
 */
export default function GeneratedSetItem({
  item,
  locked,
  statValues,
  itemOptions,
  onLockItem,
  onExclude
}: {
  item: D2Item;
  locked: readonly LockedItemType[];
  statValues: number[];
  itemOptions: D2Item[];
  onLockItem(item: LockedItemType): void;
  onExclude(item: LockedItemType): void;
}) {
  // TODO: pass in locked items to itemsockets
  // TODO: allow locking perk from here?
  // TODO: highlight locked perks!

  let altPerk: DimPlug | null = null;

  if (item.stats && item.stats.length >= 3 && item.sockets) {
    for (const socket of item.sockets.sockets) {
      if (socket.plugOptions.length > 1) {
        for (const plug of socket.plugOptions) {
          // Look through non-selected plugs
          if (plug !== socket.plug && plug.plugItem && plug.plugItem.investmentStats.length) {
            const statBonuses = _.mapValues(statHashes, (h) => {
              const stat = plug.plugItem.investmentStats.find((s) => s.statTypeHash === h);
              return stat ? stat.value : 0;
            });

            const mix = [
              item.stats[0].base + statBonuses.Mobility,
              item.stats[1].base + statBonuses.Resilience,
              item.stats[2].base + statBonuses.Recovery
            ];
            if (mix.every((val, index) => val === statValues[index])) {
              altPerk = plug;
              break;
            }
          }
        }
      }
    }
  }

  // TODO: show mods? Maybe remove headers or replace intrinsic?

  const classesByHash = altPerk
    ? {
        [altPerk.plugItem.hash]: styles.altPerk
      }
    : undefined;

  const chooseReplacement = async () => {
    const ids = new Set(itemOptions.map((i) => i.id));

    try {
      const { item } = await showItemPicker({
        prompt: 'Choose another item with the same stats:',
        hideStoreEquip: true,
        filterItems: (item: DimItem) => ids.has(item.id)
      });

      onLockItem({ type: 'item', item: item as D2Item });
    } catch (e) {}
  };

  return (
    <div className={styles.items}>
      <div className={styles.item}>
        <LoadoutBuilderItem item={item} locked={locked} onExclude={onExclude} />

        {itemOptions.length > 1 && (
          <button className="dim-button" title="Choose another item" onClick={chooseReplacement}>
            <AppIcon icon={faRandom} />
          </button>
        )}
      </div>
      <div>
        <ItemSockets item={item} hideMods={true} classesByHash={classesByHash} />
      </div>
    </div>
  );
}
