import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import Mod from 'app/loadout-builder/generated-sets/Mod';
import { AppIcon, faInfoCircle } from 'app/shell/icons';
import { chainComparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styles from './SavedMods.m.scss';

function modHeaderCleaner(name: string) {
  return name.replaceAll(/(mod|armor|raid)/gi, '').trim();
}

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
}

const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((def) => def.plug.energyCost?.energyType),
  compareBy((def) => def.plug.energyCost?.energyCost),
  compareBy((def) => def.displayProperties.name)
);

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, modHashes }: Props) {
  const groupedMods = useMemo(() => {
    const mods: PluggableInventoryItemDefinition[] = [];

    if (!modHashes?.length) {
      return {};
    }

    for (const hash of modHashes) {
      const def = defs.InventoryItem.get(hash);
      if (isPluggableItem(def)) {
        mods.push(def);
      }
    }

    mods.sort(sortMods);

    return _.groupBy(mods, (def) => def.itemTypeDisplayName);
  }, [modHashes, defs]);

  if (!defs.isDestiny2() || !modHashes?.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <div className={styles.title}>{t('Loadouts.Mods')}</div>
        <PressTip tooltip={t('Loadouts.ModsInfo')}>
          <AppIcon icon={faInfoCircle}></AppIcon>
        </PressTip>
      </div>
      <div className={styles.categories}>
        {Object.entries(groupedMods).map(
          ([key, group]) =>
            group && (
              <div key={key} className={styles.category}>
                <div className={styles.categoryName}>{modHeaderCleaner(key)}</div>
                <div className={styles.mods}>
                  {/* Unfortunately we need to use index here as we may have duplicate mods */}
                  {groupedMods[key].map((def, index) => (
                    <Mod key={index} defs={defs} plugDef={def} />
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default SavedMods;
