import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Comparator } from 'app/utils/comparators';
import _ from 'lodash';
import React, { useCallback } from 'react';
import styles from './PlugSection.m.scss';
import SelectablePlug from './SelectablePlug';

export interface PlugsWithMaxSelectable {
  plugSetHash: number;
  plugs: PluggableInventoryItemDefinition[];
  maxSelectable: number;
}

export default function PlugSection({
  plugsWithMaxSelectable,
  selected,
  displayedStatHashes,
  isPlugSelectable,
  handlePlugSelected,
  handlePlugRemoved,
  sortPlugs,
}: {
  plugsWithMaxSelectable: PlugsWithMaxSelectable;
  /** The current set of selected mods. Needed to figure out selection limits for some plugCategoryHashes. */
  selected: PluggableInventoryItemDefinition[];
  displayedStatHashes?: number[];
  isPlugSelectable(plug: PluggableInventoryItemDefinition): boolean;
  handlePlugSelected(plugSetHash: number, mod: PluggableInventoryItemDefinition): void;
  handlePlugRemoved(plugSetHash: number, mod: PluggableInventoryItemDefinition): void;
  sortPlugs?: Comparator<PluggableInventoryItemDefinition>;
}) {
  const { plugs, maxSelectable, plugSetHash } = plugsWithMaxSelectable;

  const handlePlugSelectedInternal = useCallback(
    (plug: PluggableInventoryItemDefinition) => handlePlugSelected(plugSetHash, plug),
    [handlePlugSelected, plugSetHash]
  );

  const handlePlugRemovedInternal = useCallback(
    (plug: PluggableInventoryItemDefinition) => handlePlugRemoved(plugSetHash, plug),
    [handlePlugRemoved, plugSetHash]
  );

  if (!plugs.length) {
    return null;
  }

  if (sortPlugs) {
    plugs.sort(sortPlugs);
  }

  // allow a plug category hash to be "locked" to
  // the first itemTypeDisplayName that shows up using it.
  // this prevents "Class Item Mod" and "Class Item Armor Mod"
  // from forming two different categories
  const nameByPCH: NodeJS.Dict<string> = {};

  // Here we split the section into further pieces so that each plug category has has its own title
  // This is important for combat mods, which would otherwise be grouped into one massive category
  const plugsGroupedByPlugCategoryHash = _.groupBy(
    plugs,
    (plugDef) =>
      (nameByPCH[plugDef.plug.plugCategoryHash] ??=
        plugDef.itemTypeDisplayName || plugDef.itemTypeAndTierDisplayName)
  );

  return (
    <>
      {Object.entries(plugsGroupedByPlugCategoryHash).map(([pch, plugs]) => (
        <div key={pch} className={styles.bucket}>
          <div className={styles.header}>
            {plugs[0].itemTypeDisplayName || plugs[0].itemTypeAndTierDisplayName}
          </div>
          <div className={styles.items}>
            {plugs.map((plug) => (
              <SelectablePlug
                key={plug.hash}
                selected={selected.some((s) => s.hash === plug.hash)}
                plug={plug}
                displayedStatHashes={displayedStatHashes}
                selectable={maxSelectable > selected.length && isPlugSelectable(plug)}
                onPlugSelected={handlePlugSelectedInternal}
                onPlugRemoved={handlePlugRemovedInternal}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
