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
 * - the behavior we use for selecting plugs
 */
export interface PlugSet {
  /** The hash that links to the PlugSet definition. */
  plugSetHash: number;
  /** A list of plug items in this plugset. */
  plugs: PluggableInventoryItemDefinition[];
  /** The maximum number of plugs a user can select from this plug set. */
  maxSelectable: number;
  /**
   * The select behavior of the plug set.
   * multi: how armour mods are selected in game, you need to manually remove ones that have been added.
   * single: how abilities in subclasses are selected, selecting an option replaces the current one.
   */
  selectionType: 'multi' | 'single';
  /** A bit of text to add on to the header. This is currently used to distinguish Artificer slot-specific sockets. */
  headerSuffix?: string;
}

/**
 * A section of plugs in the PlugDrawer component, corresponding to a PlugSet. These will be further
 * sub-grouped by mod type.
 */
export default function PlugSection({
  plugSet,
  selectedPlugs,
  displayedStatHashes,
  isPlugSelectable,
  onPlugSelected,
  onPlugRemoved,
  sortPlugs,
}: {
  plugSet: PlugSet;
  /** The current set of selected plugs for this particular PlugSet. */
  selectedPlugs: PluggableInventoryItemDefinition[];
  /** A restricted list of stat hashes to display for each plug. If not specified, all stats will be shown. */
  displayedStatHashes?: number[];
  /** How to sort plugs within a group (PlugSet) */
  sortPlugs?: Comparator<PluggableInventoryItemDefinition>;
  /** A function to determine if a given plug is currently selectable. */
  isPlugSelectable(plug: PluggableInventoryItemDefinition): boolean;
  onPlugSelected(
    plugSetHash: number,
    mod: PluggableInventoryItemDefinition,
    selectionType: 'multi' | 'single'
  ): void;
  onPlugRemoved(plugSetHash: number, mod: PluggableInventoryItemDefinition): void;
}) {
  const { plugs, maxSelectable, plugSetHash, headerSuffix, selectionType } = plugSet;

  const handlePlugSelected = useCallback(
    (plug: PluggableInventoryItemDefinition) => onPlugSelected(plugSetHash, plug, selectionType),
    [onPlugSelected, plugSetHash, selectionType]
  );

  const handlePlugRemoved = useCallback(
    (plug: PluggableInventoryItemDefinition) => onPlugRemoved(plugSetHash, plug),
    [onPlugRemoved, plugSetHash]
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
              {plugs.map((plug) => {
                const isSelected = selectedPlugs.some((s) => s.hash === plug.hash);
                const selectable =
                  selectionType === 'multi'
                    ? selectedPlugs.length < maxSelectable && isPlugSelectable(plug)
                    : !isSelected && isPlugSelectable(plug);
                return (
                  <SelectablePlug
                    key={plug.hash}
                    selected={isSelected}
                    plug={plug}
                    displayedStatHashes={displayedStatHashes}
                    selectable={selectable}
                    selectionType={selectionType}
                    onPlugSelected={handlePlugSelected}
                    onPlugRemoved={handlePlugRemoved}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
