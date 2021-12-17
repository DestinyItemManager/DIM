import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Comparator } from 'app/utils/comparators';
import React, { useCallback } from 'react';
import { groupModsByModType } from '../mod-utils';
import styles from './PlugSection.m.scss';
import SelectablePlug from './SelectablePlug';

/**
 * a list of plugs, plus some metadata about:
 * - the maximum we should let the user choose at once
 * - the plugset whence these plugs originate
 */
export interface PlugsWithMaxSelectable {
  /** The hash that links to the PlugSet definition. */
  plugSetHash: number;
  /** A list of plugs from this plugset. */
  plugs: PluggableInventoryItemDefinition[];
  /** The maximum number of plugs a user can select from this plug set. */
  maxSelectable: number;
  headerSuffix?: string;
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
  /** The current set of selected plugs. */
  selected: PluggableInventoryItemDefinition[];
  displayedStatHashes?: number[];
  isPlugSelectable(plug: PluggableInventoryItemDefinition): boolean;
  handlePlugSelected(plugSetHash: number, mod: PluggableInventoryItemDefinition): void;
  handlePlugRemoved(plugSetHash: number, mod: PluggableInventoryItemDefinition): void;
  sortPlugs?: Comparator<PluggableInventoryItemDefinition>;
}) {
  const { plugs, maxSelectable, plugSetHash, headerSuffix } = plugsWithMaxSelectable;

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

  // Here we split the section into further pieces so that each plug category has has its own title
  // This is important for combat mods, which would otherwise be grouped into one massive category
  const plugsGroupedByModType = groupModsByModType(plugs);

  return (
    <>
      {Object.entries(plugsGroupedByModType).map(([groupName, plugs]) => {
        const header = groupName + (headerSuffix ? ` (${headerSuffix})` : '');

        return (
          <div key={header} className={styles.bucket}>
            <div className={styles.header}>{header}</div>
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
        );
      })}
    </>
  );
}
