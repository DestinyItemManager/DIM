import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { knownModPlugCategoryHashes } from 'app/loadout-builder/types';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { chainComparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import React, { useMemo } from 'react';
import SavedModCategory from './SavedModCategory';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
  onOpenModPicker(): void;
  removeModByIndex(index: number): void;
}

const sortMods = chainComparator<{ def: PluggableInventoryItemDefinition; paramIndex: number }>(
  compareBy((mod) => mod.def.plug.energyCost?.energyType),
  compareBy((mod) => mod.def.plug.energyCost?.energyCost),
  compareBy((mod) => mod.def.displayProperties.name)
);

type ModDefAndIndex = { def: PluggableInventoryItemDefinition; paramIndex: number };

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, modHashes, onOpenModPicker, removeModByIndex }: Props) {
  const groupedMods = useMemo(() => {
    const mods: ModDefAndIndex[] = [];

    if (!modHashes?.length) {
      return [];
    }

    for (let i = 0; i < modHashes.length; i++) {
      const def = defs.InventoryItem.get(modHashes[i]);
      if (isPluggableItem(def)) {
        mods.push({ def, paramIndex: i });
      }
    }

    mods.sort(sortMods);

    const groups = Object.values(_.groupBy(mods, (mods) => mods.def.plug.plugCategoryHash));

    return groups.sort(
      chainComparator(
        compareBy((mods) => {
          // We sort by known knownModPlugCategoryHashes so that it general, helmet, ..., classitem, raid, others.
          const knownIndex = knownModPlugCategoryHashes.indexOf(mods[0].def.plug.plugCategoryHash);
          return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
        }),
        compareBy((mods) => mods[0].def.itemTypeDisplayName)
      )
    );
  }, [modHashes, defs]);

  if (!defs.isDestiny2() || !modHashes?.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.title}>{t('Loadouts.Mods')}</div>
      </div>
      <div className={styles.categories}>
        {groupedMods.map(
          (group) =>
            group.length && (
              <SavedModCategory
                defs={defs}
                mods={group}
                onRemove={(index: number) => removeModByIndex(index)}
                onOpenModPicker={onOpenModPicker}
              />
            )
        )}
      </div>
      <div className={styles.disclaimer}>
        <AppIcon className={styles.warningIcon} icon={faExclamationTriangle} />
        {t('Loadouts.ModsInfo')}
      </div>
    </div>
  );
}

export default SavedMods;
