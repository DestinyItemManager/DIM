import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { artifactUnlocksSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { Loadout, ResolvedLoadoutMod } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, addIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ModPicker from '../ModPicker';
import ModAssignmentDrawer from '../mod-assignment-drawer/ModAssignmentDrawer';
import { useLoadoutMods } from '../mod-assignment-drawer/selectors';
import { createGetModRenderKey } from '../mod-utils';
import styles from './LoadoutMods.m.scss';
import PlugDef from './PlugDef';

const LoadoutModMemo = memo(function LoadoutMod({
  mod,
  className,
  classType,
  onRemoveMod,
}: {
  mod: ResolvedLoadoutMod;
  className: string;
  classType: DestinyClass;
  onRemoveMod?: (mod: ResolvedLoadoutMod) => void;
}) {
  // We need this to be undefined if `onRemoveMod` is not present as the presence of the onClose
  // callback determines whether the close icon is displayed on hover
  const onClose = onRemoveMod && (() => onRemoveMod(mod));
  return (
    <PlugDef
      className={className}
      plug={mod.resolvedMod}
      forClassType={classType}
      onClose={onClose}
    />
  );
});

/**
 * Shows saved mods in the loadout view.
 */
export const LoadoutMods = memo(function LoadoutMods({
  loadout,
  allMods,
  storeId,
  clearUnsetMods,
  missingSockets,
  hasArtifactUnlocks,
  hideShowModPlacements,
  onUpdateMods,
  onRemoveMod,
  onClearUnsetModsChanged,
}: {
  loadout: Loadout;
  allMods: ResolvedLoadoutMod[];
  storeId: string;
  hideShowModPlacements?: boolean;
  clearUnsetMods?: boolean;
  missingSockets?: boolean;
  hasArtifactUnlocks?: boolean;
  /** If present, show an "Add Mod" button */
  onUpdateMods?: (newMods: number[]) => void;
  onRemoveMod?: (mod: ResolvedLoadoutMod) => void;
  onClearUnsetModsChanged?: (checked: boolean) => void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);
  const [showModPicker, setShowModPicker] = useState(false);

  const unlockedPlugSetItems = useSelector(unlockedPlugSetItemsSelector(storeId));

  // Explicitly show only actual saved mods in the mods picker, not auto mods,
  // otherwise we'd duplicate auto mods into loadout parameter mods when confirming
  const [resolvedMods] = useLoadoutMods(loadout, storeId, false);

  // TODO: filter down by usable mods?
  // TODO: Hide the "Add Mod" button when no more mods can fit
  // TODO: turn the mod assignment drawer into a super mod editor?
  // TODO: let these be dragged and dropped into the loadout editor

  if (allMods.length === 0 && !onUpdateMods) {
    return !isPhonePortrait && !hasArtifactUnlocks ? (
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
    <div>
      <div className={styles.modsGrid}>
        {allMods.map((mod) => (
          <LoadoutModMemo
            className={clsx({
              [styles.missingItem]: !(
                unlockedPlugSetItems.has(mod.resolvedMod.hash) ||
                mod.resolvedMod.hash === DEFAULT_SHADER ||
                DEFAULT_ORNAMENTS.includes(mod.resolvedMod.hash)
              ),
            })}
            key={getModRenderKey(mod.resolvedMod)}
            mod={mod}
            classType={loadout.classType}
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
      {(!hideShowModPlacements || onClearUnsetModsChanged) &&
        (allMods.length > 0 || onUpdateMods) && (
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
            lockedMods={resolvedMods}
            onAccept={onUpdateMods}
            onClose={() => setShowModPicker(false)}
          />
        </Portal>
      )}
    </div>
  );
});

/**
 * Shows artifact unlocks in the loadout view.
 */
export const LoadoutArtifactUnlocks = memo(function LoadoutArtifactUnlocks({
  loadout,
  storeId,
  className,
  onRemoveMod,
  onSyncFromEquipped,
}: {
  loadout: Loadout;
  storeId: string;
  className?: string;
  onRemoveMod?: (mod: number) => void;
  onSyncFromEquipped?: () => void;
}) {
  const defs = useD2Definitions()!;
  const unlockedArtifactMods = useSelector(artifactUnlocksSelector(storeId));

  const loadoutArtifactMods: ResolvedLoadoutMod[] = useMemo(
    () =>
      loadout.parameters?.artifactUnlocks?.unlockedItemHashes
        .map((item) => defs.InventoryItem.get(item))
        .filter(isPluggableItem)
        .map((def) => ({ originalModHash: def.hash, resolvedMod: def })) ?? [],
    [defs.InventoryItem, loadout.parameters?.artifactUnlocks]
  );

  const handleRemoveMod = useCallback(
    (mod: ResolvedLoadoutMod) => onRemoveMod!(mod.originalModHash),
    [onRemoveMod]
  );
  const artifactTitle = loadout.parameters?.artifactUnlocks
    ? t('Loadouts.ArtifactUnlocksWithSeason', {
        seasonNumber: loadout.parameters?.artifactUnlocks?.seasonNumber,
      })
    : t('Loadouts.ArtifactUnlocks');

  return (
    <div className={className}>
      {loadoutArtifactMods.length > 0 ? (
        <>
          {!onRemoveMod && <h3>{artifactTitle}</h3>}
          <div className={styles.modsGrid}>
            {loadoutArtifactMods.map((mod) => {
              const unlocked = unlockedArtifactMods?.unlockedItemHashes.includes(
                mod.resolvedMod.hash
              );
              return (
                <LoadoutModMemo
                  key={mod.resolvedMod.hash}
                  mod={mod}
                  className={clsx({
                    [styles.artifactUnlock]: unlocked,
                    [styles.missingItem]: !unlocked,
                  })}
                  classType={loadout.classType}
                  onRemoveMod={onRemoveMod ? handleRemoveMod : undefined}
                />
              );
            })}
          </div>
        </>
      ) : (
        onSyncFromEquipped && (
          <div className={styles.buttons}>
            <button className="dim-button" type="button" onClick={onSyncFromEquipped}>
              {t('Loadouts.SyncFromEquipped')}
            </button>
          </div>
        )
      )}
    </div>
  );
});
