import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { addIcon, AppIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { memo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import ModAssignmentDrawer from '../mod-assignment-drawer/ModAssignmentDrawer';
import { createGetModRenderKey } from '../mod-utils';
import ModPicker from '../ModPicker';
import styles from './LoadoutMods.m.scss';
import PlugDef from './PlugDef';

/**
 * Shows saved mods in the loadout view.
 */
export default memo(function LoadoutMods({
  loadout,
  savedMods,
  storeId,
  hideShowModPlacements,
  onUpdateMods,
}: {
  loadout: Loadout;
  savedMods: PluggableInventoryItemDefinition[];
  storeId: string;
  hideShowModPlacements?: boolean;
  /** If present, show an "Add Mod" button */
  onUpdateMods?(newMods: PluggableInventoryItemDefinition[]): void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);
  const [showModPicker, setShowModPicker] = useState(false);

  const unlockedPlugSetItems = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );

  // TODO: filter down by usable mods?
  // TODO: Hide the "Add Mod" button when no more mods can fit
  // TODO: turn the mod assignment drawer into a super mod editor?
  // TODO: let these be dragged and dropped into the loadout editor

  if (savedMods.length === 0 && !onUpdateMods) {
    return !isPhonePortrait ? (
      <div className={styles.modsPlaceholder}>{t('Loadouts.Mods')}</div>
    ) : null;
  }

  return (
    <div className={styles.mods}>
      <div className={styles.modsGrid}>
        {savedMods.map((mod) => (
          <PlugDef
            className={clsx({
              [styles.missingItem]: !(
                unlockedPlugSetItems.has(mod.hash) ||
                mod.hash === DEFAULT_SHADER ||
                DEFAULT_ORNAMENTS.includes(mod.hash)
              ),
            })}
            key={getModRenderKey(mod)}
            plug={mod}
          />
        ))}
        {onUpdateMods && (
          <button
            className={styles.pickModButton}
            type="button"
            title={t('Loadouts.PickMods')}
            onClick={() => setShowModPicker(true)}
          >
            <AppIcon icon={addIcon} />
          </button>
        )}
      </div>
      {!hideShowModPlacements && (
        <button
          className={styles.showModPlacementButton}
          type="button"
          onClick={() => setShowModAssignmentDrawer(true)}
        >
          {t('Loadouts.ShowModPlacement')}
        </button>
      )}
      {showModAssignmentDrawer &&
        ReactDOM.createPortal(
          <ModAssignmentDrawer
            loadout={loadout}
            onUpdateMods={onUpdateMods}
            onClose={() => setShowModAssignmentDrawer(false)}
          />,
          document.body
        )}
      {onUpdateMods &&
        showModPicker &&
        ReactDOM.createPortal(
          <ModPicker
            classType={loadout.classType}
            lockedMods={savedMods}
            onAccept={onUpdateMods}
            onClose={() => setShowModPicker(false)}
          />,
          document.body
        )}
    </div>
  );
});
