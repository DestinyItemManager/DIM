import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { memo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import ModAssignmentDrawer from '../mod-assignment-drawer/ModAssignmentDrawer';
import { createGetModRenderKey } from '../mod-utils';
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
}: {
  loadout: Loadout;
  savedMods: PluggableInventoryItemDefinition[];
  storeId: string;
  hideShowModPlacements?: boolean;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);

  const unlockedPlugSetItems = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );

  // TODO: filter down by usable mods?

  if (savedMods.length === 0) {
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
            onClose={() => setShowModAssignmentDrawer(false)}
          />,
          document.body
        )}
    </div>
  );
});
