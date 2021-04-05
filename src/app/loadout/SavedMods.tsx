import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { sortModGroups } from 'app/loadout-builder/mod-utils';
import { PluggableItemsByPlugCategoryHash } from 'app/loadout-builder/types';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import React, { useMemo } from 'react';
import SavedModCategory from './SavedModCategory';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  savedMods: PluggableItemsByPlugCategoryHash;
  onOpenModPicker(): void;
  removeModByHash(index: number): void;
}

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, savedMods, onOpenModPicker, removeModByHash }: Props) {
  const groupedMods = useMemo(() => {
    if (!defs.isDestiny2()) {
      return [];
    }

    return Object.values(savedMods).sort(sortModGroups);
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
