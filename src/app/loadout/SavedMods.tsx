import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import ClosableContainer from 'app/loadout-builder/ClosableContainer';
import Mod from 'app/loadout-builder/generated-sets/Mod';
import { chainComparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { AddButton } from './Buttons';
import styles from './SavedMods.m.scss';

function modHeaderCleaner(name: string) {
  return name.replaceAll(/(mod|armor|raid)/gi, '').trim();
}

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
  onOpenModPicker(): void;
  removeModByIndex(index: number): void;
}

const sortMods = chainComparator<{ def: PluggableInventoryItemDefinition }>(
  compareBy((item) => item.def.plug.energyCost?.energyType),
  compareBy((item) => item.def.plug.energyCost?.energyCost),
  compareBy((item) => item.def.displayProperties.name)
);

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, modHashes, onOpenModPicker, removeModByIndex }: Props) {
  const groupedMods = useMemo(() => {
    const mods: { def: PluggableInventoryItemDefinition; paramIndex: number }[] = [];

    if (!modHashes?.length) {
      return {};
    }

    for (let i = 0; i < modHashes.length; i++) {
      const def = defs.InventoryItem.get(modHashes[i]);
      if (isPluggableItem(def)) {
        mods.push({ def, paramIndex: i });
      }
    }

    mods.sort(sortMods);

    return _.groupBy(mods, (item) => item.def.itemTypeDisplayName);
  }, [modHashes, defs]);

  if (!defs.isDestiny2() || !modHashes?.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('Loadouts.Mods')}</div>
      <div className={styles.categories}>
        {Object.entries(groupedMods).map(
          ([key, group]) =>
            group && (
              <div key={key} className={styles.category}>
                <div className={styles.categoryName}>{modHeaderCleaner(key)}</div>
                <div className={styles.mods}>
                  {group.map(({ def, paramIndex }, index) => (
                    <ClosableContainer
                      key={index}
                      showCloseIconOnHover={true}
                      onClose={() => removeModByIndex(paramIndex)}
                    >
                      <Mod defs={defs} plugDef={def} />
                    </ClosableContainer>
                  ))}
                  <AddButton onClick={onOpenModPicker} />
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default SavedMods;
