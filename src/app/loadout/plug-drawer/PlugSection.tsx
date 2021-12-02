import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import styles from './PlugSection.m.scss';
import SelectablePlug from './SelectablePlug';

export default function PlugSection({
  plugs,
  selected,
  displayedStatHashes,
  isPlugSelectable,
  onPlugSelected,
  onPlugRemoved,
}: {
  /** A array of mods where plug.plugCategoryHash's are equal. */
  plugs: readonly PluggableInventoryItemDefinition[];
  /** The current set of selected mods. Needed to figure out selection limits for some plugCategoryHashes. */
  selected: PluggableInventoryItemDefinition[];
  displayedStatHashes?: number[];
  isPlugSelectable(plug: PluggableInventoryItemDefinition): boolean;
  onPlugSelected(mod: PluggableInventoryItemDefinition): void;
  onPlugRemoved(mod: PluggableInventoryItemDefinition): void;
}) {
  if (!plugs.length) {
    return null;
  }

  const title = plugs[0].itemTypeDisplayName || plugs[0].itemTypeAndTierDisplayName;

  return (
    <div className={styles.bucket}>
      <div className={styles.header}>{title}</div>
      <div className={styles.items}>
        {plugs.map((plug) => (
          <SelectablePlug
            key={plug.hash}
            selected={selected.some((s) => s.hash === plug.hash)}
            plug={plug}
            displayedStatHashes={displayedStatHashes}
            selectable={isPlugSelectable(plug)}
            onPlugSelected={onPlugSelected}
            onPlugRemoved={onPlugRemoved}
          />
        ))}
      </div>
    </div>
  );
}
