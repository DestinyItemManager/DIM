import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import CheckButton from 'app/dim-ui/CheckButton';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { hashesToPluggableItems } from 'app/inventory/store/sockets';
import { autoAssignmentPCHs } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem, ResolvedLoadoutMod } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, addIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ModPicker from '../ModPicker';
import ModAssignmentDrawer from '../mod-assignment-drawer/ModAssignmentDrawer';
import { useLoadoutMods } from '../mod-assignment-drawer/selectors';
import { createGetModRenderKey, sortMods } from '../mod-utils';
import * as styles from './LoadoutMods.m.scss';
import PlugDef from './PlugDef';

const LoadoutMod = memo(function LoadoutMod({
  mod,
  className,
  classType,
  autoStatMods,
  onRemoveMod,
}: {
  mod: ResolvedLoadoutMod;
  className: string;
  classType: DestinyClass;
  /** Are stat mods being chosen automatically by LO? */
  autoStatMods?: boolean;
  onRemoveMod?: (mod: ResolvedLoadoutMod) => void;
}) {
  // We need this to be undefined if `onRemoveMod` is not present as the presence of the onClose
  // callback determines whether the close icon is displayed on hover
  const onClose = onRemoveMod && (() => onRemoveMod(mod));
  return (
    <PlugDef
      className={className}
      plug={mod.resolvedMod}
      // TODO: if there's an item we can assign this mod to, pass that item in
      forClassType={classType}
      onClose={onClose}
      disabledByAutoStatMods={
        autoStatMods &&
        mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General
      }
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
  hideShowModPlacements,
  autoStatMods,
  includeRuntimeStats,
  onUpdateMods,
  onRemoveMod,
  onClearUnsetModsChanged,
  onAutoStatModsChanged,
  onIncludeRuntimeStatsChanged,
}: {
  loadout: Loadout;
  allMods: ResolvedLoadoutMod[];
  storeId: string;
  hideShowModPlacements?: boolean;
  clearUnsetMods?: boolean;
  missingSockets?: boolean;
  /** Are stat mods being chosen automatically by LO? */
  autoStatMods?: boolean;
  includeRuntimeStats?: boolean;
  /** If present, show an "Add Mod" button */
  onUpdateMods?: (newMods: number[]) => void;
  onRemoveMod?: (mod: ResolvedLoadoutMod) => void;
  onClearUnsetModsChanged?: (checked: boolean) => void;
  onAutoStatModsChanged?: (checked: boolean) => void;
  onIncludeRuntimeStatsChanged?: (checked: boolean) => void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  const [showModPicker, setShowModPicker] = useState(false);

  const unlockedPlugSetItems = useSelector(unlockedPlugSetItemsSelector(storeId));

  // Explicitly show only actual saved mods in the mods picker, not auto mods,
  // otherwise we'd duplicate auto mods into loadout parameter mods when confirming
  const [resolvedMods] = useLoadoutMods(loadout, storeId);

  // Mods are stored/resolved in the order the loadout keeps them (slot order for
  // tuning mods, which the assignment code relies on); sort here purely for a
  // stable grouped display.
  const sortedMods = useMemo(
    () => allMods.toSorted((a, b) => sortMods(a.resolvedMod, b.resolvedMod)),
    [allMods],
  );

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
    <div>
      <div className={styles.modsGrid}>
        {sortedMods.map((mod) => (
          <LoadoutMod
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
            autoStatMods={Boolean(autoStatMods)}
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
      {(!hideShowModPlacements ||
        onClearUnsetModsChanged ||
        onAutoStatModsChanged ||
        onIncludeRuntimeStatsChanged) &&
        (allMods.length > 0 || onUpdateMods) && (
          <div className={styles.buttons}>
            {!hideShowModPlacements && (
              <ShowModAssignmentButton
                loadout={loadout}
                storeId={storeId}
                onUpdateMods={onUpdateMods}
              />
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

            {onIncludeRuntimeStatsChanged && (
              <PressTip tooltip={t('Loadouts.IncludeRuntimeStatBenefitsDesc')}>
                <CheckButton
                  name="includeRuntimeStats"
                  checked={includeRuntimeStats ?? true}
                  onChange={onIncludeRuntimeStatsChanged}
                >
                  {t('Loadouts.IncludeRuntimeStatBenefits')}
                </CheckButton>
              </PressTip>
            )}

            {$featureFlags.loAutoStatMods && onAutoStatModsChanged && (
              <>
                <CheckButton
                  onChange={onAutoStatModsChanged}
                  name="autoStatMods"
                  checked={Boolean(autoStatMods)}
                >
                  {t('LoadoutBuilder.AutoStatMods')}
                </CheckButton>
                <div className={styles.fineprint}>{t('LoadoutBuilder.AlwaysAutoMods')}</div>
              </>
            )}
          </div>
        )}
      {onUpdateMods && showModPicker && (
        <ModPicker
          classType={loadout.classType}
          owner={storeId}
          lockedMods={resolvedMods}
          onAccept={onUpdateMods}
          plugCategoryHashDenyList={
            // autoStatMods being set means we're in Loadout Optimizer, which should not allow picking artifice mods
            autoStatMods !== undefined
              ? autoStatMods
                ? // Exclude stat mods from the mod picker when they're auto selected
                  [...autoAssignmentPCHs, PlugCategoryHashes.EnhancementsV2General]
                : autoAssignmentPCHs
              : undefined
          }
          onClose={() => setShowModPicker(false)}
        />
      )}
    </div>
  );
});

/**
 * Shows artifact unlocks in the loadout view.
 */
export const LoadoutArtifactMods = memo(function LoadoutArtifactMods({
  artifact,
  legacyArtifactUnlocks,
  classType,
  className,
  showArtifactItem,
  compact,
}: {
  artifact?: ResolvedLoadoutItem | undefined;
  legacyArtifactUnlocks: LoadoutParameters['artifactUnlocks'];
  classType: DestinyClass;
  className?: string;
  showArtifactItem?: boolean;
  compact?: boolean;
}) {
  const defs = useD2Definitions()!;

  const legacyArtifactMods: ResolvedLoadoutMod[] = useMemo(
    () =>
      hashesToPluggableItems(defs, legacyArtifactUnlocks?.unlockedItemHashes ?? []).map((def) => ({
        originalModHash: def.hash,
        resolvedMod: def,
      })) ?? [],
    [defs, legacyArtifactUnlocks?.unlockedItemHashes],
  );

  const artifactOverrides: ResolvedLoadoutMod[] = useMemo(
    () =>
      artifact
        ? hashesToPluggableItems(
            defs,
            Object.values(artifact.loadoutItem.socketOverrides ?? {}),
          ).map((def) => ({
            originalModHash: def.hash,
            resolvedMod: def,
          }))
        : [],
    [defs, artifact],
  );

  const artifactMods = artifactOverrides?.length > 0 ? artifactOverrides : legacyArtifactMods;

  const artifactTitle =
    legacyArtifactUnlocks && !artifact
      ? t('Loadouts.ArtifactUnlocksWithSeason', {
          seasonNumber: legacyArtifactUnlocks?.seasonNumber,
        })
      : t('Bucket.Artifact');

  return artifact || artifactMods.length > 0 ? (
    <div className={className}>
      {showArtifactItem && artifactTitle && <h3>{artifactTitle}</h3>}
      <div className={clsx(styles.modsGrid, { [styles.compact]: compact })}>
        {showArtifactItem && artifact ? (
          <DraggableInventoryItem item={artifact.item}>
            <ItemPopupTrigger
              item={artifact.item}
              extraData={{ socketOverrides: artifact.loadoutItem.socketOverrides }}
            >
              {(ref, onClick) => (
                <ConnectedInventoryItem ref={ref} onClick={onClick} item={artifact.item} />
              )}
            </ItemPopupTrigger>
          </DraggableInventoryItem>
        ) : null}
        {artifactMods.map((mod) => (
          <LoadoutMod
            key={mod.resolvedMod.hash}
            mod={mod}
            className={styles.artifactUnlock}
            classType={classType}
          />
        ))}
      </div>
    </div>
  ) : null;
});

/**
 * A button that shows the ModAssignmentDrawer.
 */
function ShowModAssignmentButton({
  loadout,
  storeId,
  onUpdateMods,
}: {
  loadout: Loadout;
  storeId: string;
  /** If present, show an "Add Mod" button */
  onUpdateMods?: (newMods: number[]) => void;
}) {
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);

  return (
    <>
      <button className="dim-button" type="button" onClick={() => setShowModAssignmentDrawer(true)}>
        {t('Loadouts.ShowModPlacement')}
      </button>
      {showModAssignmentDrawer && (
        <ModAssignmentDrawer
          loadout={loadout}
          storeId={storeId}
          onUpdateMods={onUpdateMods}
          onClose={() => setShowModAssignmentDrawer(false)}
        />
      )}
    </>
  );
}
