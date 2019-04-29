import React from 'react';
import { D2Item, DimPlug } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import ItemSockets from '../../item-popup/ItemSockets';
import { statHashes } from '../process';
import _ from 'lodash';

export default function GeneratedSetItem({
  item,
  locked,
  statValues,
  onExclude
}: {
  item: D2Item;
  locked: LockedItemType[];
  statValues: number[];
  onExclude(item: LockedItemType): void;
}) {
  // TODO: pass in locked items to itemsockets
  // TODO: allow locking perk from here?
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

  return (
    <div className="generated-build-items">
      <LoadoutBuilderItem item={item} locked={locked} onExclude={onExclude} />
      <div>
        <ItemSockets item={item} hideMods={true} />
        {altPerk && <div>Choose {altPerk.plugItem.displayProperties.name}</div>}
        <div>{statValues.join(', ')}</div>
      </div>
    </div>
  );
}
