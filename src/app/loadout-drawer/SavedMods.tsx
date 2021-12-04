import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { sortModGroups } from 'app/loadout/mod-utils';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import _ from 'lodash';
import React, { useMemo } from 'react';
import SavedModCategory from './SavedModCategory';
import styles from './SavedMods.m.scss';

interface Props {
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
function SavedMods({ savedMods, onOpenModPicker, removeModByHash }: Props) {
  // Turn savedMods into an array of mod groups where each group is
  const groupedMods = useMemo(() => {
    const indexedMods = _.groupBy(savedMods, (mod) => mod.plug.plugCategoryHash);
    return Object.values(indexedMods).sort(sortModGroups);
  }, [savedMods]);

  if (!savedMods.length) {
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
              key={group[0].plug.plugCategoryHash}
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
