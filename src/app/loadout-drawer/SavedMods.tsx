import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { sortModGroups } from 'app/loadout-builder/mod-utils';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import _ from 'lodash';
import React, { useMemo } from 'react';
import SavedModCategory from './SavedModCategory';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  /** The loadouts saved mods hydrated. */
  savedMods: PluggableInventoryItemDefinition[];
  /** Opens the mod picker sheet with a supplied query to filter the mods. */
  onOpenModPicker(query?: string): void;
  /** Removes a mod from the loadout via the mods item hash. */
  removeModByHash(itemHash: number): void;
}

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, savedMods, onOpenModPicker, removeModByHash }: Props) {
  // Turn savedMods into an array of mod groups where each group is
  const groupedMods = useMemo(() => {
    if (!defs.isDestiny2()) {
      return [];
    }

    const indexedMods = _.groupBy(savedMods, (mod) => mod.plug.plugCategoryHash);

    return Object.values(indexedMods).sort(sortModGroups);
  }, [savedMods, defs]);

  if (!defs.isDestiny2() || !Object.keys(savedMods).length) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.title}>{t('Loadouts.Mods')}</div>
      </div>
      <div className={styles.categories}>
        {groupedMods.map((group) =>
          group?.length ? (
            <SavedModCategory
              defs={defs}
              mods={group}
              onRemove={(index: number) => removeModByHash(index)}
              onOpenModPicker={onOpenModPicker}
            />
          ) : null
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
