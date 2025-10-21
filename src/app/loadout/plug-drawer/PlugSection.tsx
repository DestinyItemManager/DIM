import { TileGrid } from 'app/dim-ui/TileGrid';
import { t, tl } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { count } from 'app/utils/collections';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { useCallback } from 'react';
import { groupModsByModType } from '../mod-utils';
import * as styles from './PlugSection.m.scss';
import SelectablePlug from './SelectablePlug';
import { PlugSelectionType, PlugSet } from './types';

/**
 * A section of plugs in the PlugDrawer component, corresponding to a PlugSet. These will be further
 * sub-grouped by mod type.
 */
export default function PlugSection({
  plugSet,
  classType,
  numSelected,
  maxSelectable,
  isPlugSelectable,
  onPlugSelected,
  onPlugRemoved,
}: {
  plugSet: PlugSet;
  classType: DestinyClass;
  numSelected: number;
  maxSelectable: number;
  /** A function to further refine whether a given plug is currently selectable. */
  isPlugSelectable: (plug: PluggableInventoryItemDefinition) => boolean;
  onPlugSelected: (
    plugSetHash: number,
    mod: PluggableInventoryItemDefinition,
    selectionType: PlugSelectionType,
  ) => void;
  onPlugRemoved: (plugSetHash: number, mod: PluggableInventoryItemDefinition) => void;
}) {
  const { plugs, plugSetHash, headerSuffix, selectionType } = plugSet;

  const handlePlugSelected = useCallback(
    (plug: PluggableInventoryItemDefinition) => onPlugSelected(plugSetHash, plug, selectionType),
    [onPlugSelected, plugSetHash, selectionType],
  );

  const handlePlugRemoved = useCallback(
    (plug: PluggableInventoryItemDefinition) => onPlugRemoved(plugSetHash, plug),
    [onPlugRemoved, plugSetHash],
  );

  if (!plugs.length) {
    return null;
  }

  const multiSelect = selectionType !== PlugSelectionType.Single;

  // Here we split the section into further pieces so that each plug category has has its own title
  // This is important for combat mods, which would otherwise be grouped into one massive category
  const plugsGroupedByModType = groupModsByModType(plugs);

  return (
    <>
      {Object.entries(plugsGroupedByModType).map(([groupName, plugs]) => {
        // fall back to headerSuffix if no groupName
        let header = groupName || headerSuffix;
        // use parentheses if both exist
        if (groupName && headerSuffix) {
          header += ` (${headerSuffix})`;
        }

        const key = header;

        if (multiSelect) {
          header += ` (${t(plugSet.overrideSelectedAndMax ?? tl('LB.SelectModsCount'), {
            selected: numSelected,
            maxSelectable,
          })})`;
        }

        return (
          <TileGrid key={key} header={header} className={styles.section}>
            {plugs.map((plug) => {
              const isSelected = plugSet.selected.some((s) => s.hash === plug.hash);
              const selectable = multiSelect
                ? (selectionType !== PlugSelectionType.Unique || !isSelected) &&
                  numSelected < maxSelectable &&
                  isPlugSelectable(plug)
                : !isSelected && isPlugSelectable(plug);
              const stack = count(plugSet.selected, (p) => p.hash === plug.hash);
              return (
                <SelectablePlug
                  key={plug.hash}
                  selected={isSelected}
                  plug={plug}
                  stack={stack}
                  classType={classType}
                  selectable={selectable}
                  selectionType={selectionType}
                  removable={multiSelect}
                  onPlugSelected={handlePlugSelected}
                  onPlugRemoved={handlePlugRemoved}
                />
              );
            })}
          </TileGrid>
        );
      })}
    </>
  );
}
