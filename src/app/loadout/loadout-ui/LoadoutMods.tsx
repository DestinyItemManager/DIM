import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { addIcon, AppIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { Portal } from 'app/utils/temp-container';
import clsx from 'clsx';
import { memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ModAssignmentDrawer from '../mod-assignment-drawer/ModAssignmentDrawer';
import { createGetModRenderKey } from '../mod-utils';
import ModPicker from '../ModPicker';
import styles from './LoadoutMods.m.scss';
import PlugDef from './PlugDef';

const LoadoutModMemo = memo(function LoadoutMod({
  mod,
  className,
  onRemoveMod,
}: {
  mod: PluggableInventoryItemDefinition;
  className: string;
  onRemoveMod?(modHash: number): void;
}) {
  // We need this to be undefined if `onRemoveMod` is not present as the presence of the onClose
  // callback determines whether the close icon is displayed on hover
  const onClose = onRemoveMod && (() => onRemoveMod(mod.hash));
  return <PlugDef className={className} plug={mod} onClose={onClose} />;
});

/**
 * Shows saved mods in the loadout view.
 */
export default memo(function LoadoutMods({
  loadout,
  allMods,
  storeId,
  clearUnsetMods,
  missingSockets,
  hideShowModPlacements,
  onUpdateMods,
  onRemoveMod,
  onClearUnsetModsChanged,
}: {
  loadout: Loadout;
  allMods: PluggableInventoryItemDefinition[];
  storeId: string;
  hideShowModPlacements?: boolean;
  clearUnsetMods?: boolean;
  missingSockets?: boolean;
  /** If present, show an "Add Mod" button */
  onUpdateMods?(newMods: PluggableInventoryItemDefinition[]): void;
  onRemoveMod?(modHash: number): void;
  onClearUnsetModsChanged?(checked: boolean): void;
}) {
  const defs = useD2Definitions()!;
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);
  const [showModPicker, setShowModPicker] = useState(false);

  const unlockedPlugSetItems = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );

  // Explicitly show only actual saved mods in the mods picker, not auto mods,
  // otherwise we'd duplicate auto mods into loadout parameter mods when coonfirming
  const savedMods = useMemo(() => getModsFromLoadout(defs, loadout, false), [defs, loadout]);

  // TODO: filter down by usable mods?
  // TODO: Hide the "Add Mod" button when no more mods can fit
  // TODO: turn the mod assignment drawer into a super mod editor?
  // TODO: let these be dragged and dropped into the loadout editor

  if (allMods.length === 0 && !onUpdateMods) {
    return !isPhonePortrait ? (
      <div className={styles.modsPlaceholder}>
        {missingSockets ? (
          <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
        ) : (
          t('Loadouts.Mods')
        )}
      </div>
    ) : null;
  }

  if (missingSockets) {
    return <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>;
  }

  return (
    <div className={styles.mods}>
      <div className={styles.modsGrid}>
        {allMods.map((mod) => (
          <LoadoutModMemo
            className={clsx({
              [styles.missingItem]: !(
                unlockedPlugSetItems.has(mod.hash) ||
                mod.hash === DEFAULT_SHADER ||
                DEFAULT_ORNAMENTS.includes(mod.hash)
              ),
            })}
            key={getModRenderKey(mod)}
            mod={mod}
            onRemoveMod={onRemoveMod}
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
      {(!hideShowModPlacements || onClearUnsetModsChanged) && (
        <div className={styles.buttons}>
          {!hideShowModPlacements && (
            <button
              className="dim-button"
              type="button"
              onClick={() => setShowModAssignmentDrawer(true)}
            >
              {t('Loadouts.ShowModPlacement')}
            </button>
          )}
          {onClearUnsetModsChanged && (
            <CheckButton
              name="clearUnsetMods"
              checked={Boolean(clearUnsetMods)}
              onChange={onClearUnsetModsChanged}
            >
              {t('Loadouts.ClearUnsetMods')}
            </CheckButton>
          )}
        </div>
      )}
      {showModAssignmentDrawer && (
        <Portal>
          <ModAssignmentDrawer
            loadout={loadout}
            storeId={storeId}
            onUpdateMods={onUpdateMods}
            onClose={() => setShowModAssignmentDrawer(false)}
          />
        </Portal>
      )}
      {onUpdateMods && showModPicker && (
        <Portal>
          <ModPicker
            classType={loadout.classType}
            owner={storeId}
            lockedMods={savedMods}
            onAccept={onUpdateMods}
            onClose={() => setShowModPicker(false)}
          />
        </Portal>
      )}
    </div>
  );
});
