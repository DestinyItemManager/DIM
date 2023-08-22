import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { useItemPicker } from 'app/item-picker/item-picker';
import { ResolvedLoadoutItem, ResolvedLoadoutMod } from 'app/loadout-drawer/loadout-types';
import SubclassPlugDrawer from 'app/loadout/SubclassPlugDrawer';
import { getSubclassPlugs, isLoadoutBuilderItem, pickSubclass } from 'app/loadout/item-utils';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { createGetModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { emptyObject } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { Portal } from 'app/utils/temp-container';
import { objectValues } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { Dispatch, memo, useCallback, useMemo, useState } from 'react';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ExcludedItems, LockableBucketHashes, PinnedItems } from '../types';
import ExoticArmorChoice from './ExoticArmorChoice';
import ExoticPicker from './ExoticPicker';
import styles from './LoadoutOptimizerMenuItems.m.scss';
import LockedItem from './LockedItem';

export type ChooseItemFunction = (
  updateFunc: (item: DimItem) => void,
  filter?: ((item: DimItem) => boolean) | undefined
) => (e: React.MouseEvent) => Promise<void>;

export const LoadoutOptimizerSubclass = memo(function LoadoutOptimizerSubclass({
  selectedStore,
  subclass,
  lbDispatch,
}: {
  selectedStore: DimStore;
  subclass: ResolvedLoadoutItem | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const [showSubclassOptionsPicker, setShowSubclassOptionsPicker] = useState(false);
  const defs = useD2Definitions()!;
  const getModRenderKey = createGetModRenderKey();
  const showItemPicker = useItemPicker();

  const chooseSubclass = async () => {
    const subclassItemFilter = (item: DimItem) =>
      item.sockets !== null && selectedStore.items.includes(item) && itemCanBeInLoadout(item);

    const item = await pickSubclass(showItemPicker, subclassItemFilter);

    if (item) {
      lbDispatch({ type: 'updateSubclass', item });
    }
  };

  const socketOverridePlugs = useMemo(() => getSubclassPlugs(defs, subclass), [defs, subclass]);

  return (
    <>
      <div className={styles.area}>
        {subclass && (
          <div className={styles.itemGrid}>
            <LockedItem
              lockedItem={subclass.item}
              onRemove={() => lbDispatch({ type: 'removeSubclass' })}
            />
            {socketOverridePlugs.map(({ plug, canBeRemoved }) => (
              <PlugDef
                key={getModRenderKey(plug)}
                plug={plug}
                onClose={
                  canBeRemoved
                    ? () =>
                        lbDispatch({ type: 'removeSingleSubclassSocketOverride', plug, subclass })
                    : undefined
                }
                forClassType={selectedStore.classType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={chooseSubclass}>
            {t('LB.SelectSubclass')}
          </button>
          <button
            type="button"
            className="dim-button"
            disabled={!subclass}
            onClick={() => setShowSubclassOptionsPicker(true)}
          >
            {t('LB.SelectSubclassOptions')}
          </button>
        </div>
      </div>

      {showSubclassOptionsPicker && subclass && (
        <Portal>
          <SubclassPlugDrawer
            subclass={subclass.item}
            socketOverrides={subclass.loadoutItem.socketOverrides ?? emptyObject()}
            onAccept={(socketOverrides) =>
              lbDispatch({ type: 'updateSubclassSocketOverrides', socketOverrides, subclass })
            }
            onClose={() => setShowSubclassOptionsPicker(false)}
          />
        </Portal>
      )}
    </>
  );
});

export const LoadoutOptimizerMods = memo(function LoadoutOptimizerMods({
  classType,
  lockedMods,
  autoStatMods,
  lbDispatch,
}: {
  classType: DestinyClass;
  lockedMods: ResolvedLoadoutMod[];
  autoStatMods: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const getModRenderKey = createGetModRenderKey();

  const onModClicked = (mod: ResolvedLoadoutMod) =>
    lbDispatch({
      type: 'removeLockedMod',
      mod,
    });

  const onMaxStatModsChanged = (autoStatMods: boolean) =>
    lbDispatch({ type: 'autoStatModsChanged', autoStatMods });

  return (
    <div className={styles.area}>
      {Boolean(lockedMods.length) && (
        <div className={styles.itemGrid}>
          {lockedMods.map((mod) => (
            <PlugDef
              key={getModRenderKey(mod.resolvedMod)}
              plug={mod.resolvedMod}
              onClose={() => onModClicked(mod)}
              forClassType={classType}
              disabledByAutoStatMods={
                autoStatMods &&
                mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General
              }
            />
          ))}
        </div>
      )}
      <div className={styles.buttons}>
        <button
          type="button"
          className="dim-button"
          onClick={() => lbDispatch({ type: 'openModPicker' })}
        >
          {t('LB.ModLockButton')}
        </button>
      </div>
      {$featureFlags.loAutoStatMods && (
        <CheckButton onChange={onMaxStatModsChanged} name="autoStatMods" checked={autoStatMods}>
          {t('LoadoutBuilder.AutoStatMods')}
        </CheckButton>
      )}
    </div>
  );
});

export const LoadoutOptimizerExotic = memo(function LoadoutOptimizerExotic({
  classType,
  lockedExoticHash,
  lbDispatch,
}: {
  classType: DestinyClass;
  lockedExoticHash: number | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);

  return (
    <>
      <div className={styles.area}>
        {lockedExoticHash !== undefined && (
          <div className={styles.notItemGrid}>
            <ExoticArmorChoice
              lockedExoticHash={lockedExoticHash}
              onClose={() => lbDispatch({ type: 'removeLockedExotic' })}
            />
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={() => setShowExoticPicker(true)}>
            {t('LB.SelectExotic')}
          </button>
        </div>
      </div>
      {showExoticPicker && (
        <Portal>
          <ExoticPicker
            lockedExoticHash={lockedExoticHash}
            classType={classType}
            onSelected={(exotic) => lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic })}
            onClose={() => setShowExoticPicker(false)}
          />
        </Portal>
      )}
    </>
  );
});

export const LoadoutOptimizerPinnedItems = memo(function LoadoutOptimizerPinnedItems({
  chooseItem,
  selectedStore,
  pinnedItems,
  searchFilter,
  lbDispatch,
}: {
  chooseItem: ChooseItemFunction;
  selectedStore: DimStore;
  pinnedItems: PinnedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () =>
    lbDispatch({
      type: 'setPinnedItems',
      items: selectedStore.items.filter((item) => item.equipped && isLoadoutBuilderItem(item)),
    });

  const pinItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'pinItem', item }),
    [lbDispatch]
  );
  const unpinItem = (item: DimItem) => lbDispatch({ type: 'unpinItem', item });

  const chooseLockItem = chooseItem(
    pinItem,
    // Exclude types that already have a locked item represented
    (item) => Boolean(!pinnedItems[item.bucket.hash] && searchFilter(item))
  );

  const allPinnedItems = _.sortBy(_.compact(objectValues(pinnedItems)), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );

  return (
    <LoadoutBucketDropTarget className={styles.area} onItemLocked={pinItem}>
      {Boolean(allPinnedItems.length) && (
        <div className={styles.itemGrid}>
          {allPinnedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unpinItem} />
          ))}
        </div>
      )}
      <div className={styles.buttons}>
        <button type="button" className="dim-button" onClick={chooseLockItem}>
          <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockItem')}
        </button>
        <button type="button" className="dim-button" onClick={lockEquipped}>
          <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockEquipped')}
        </button>
      </div>
    </LoadoutBucketDropTarget>
  );
});

export const LoadoutOptimizerExcludedItems = memo(function LoadoutOptimizerExcludedItems({
  chooseItem,
  excludedItems,
  searchFilter,
  lbDispatch,
}: {
  chooseItem: ChooseItemFunction;
  excludedItems: ExcludedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const excludeItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'excludeItem', item }),
    [lbDispatch]
  );
  const unExcludeItem = (item: DimItem) => lbDispatch({ type: 'unexcludeItem', item });

  const chooseExcludeItem = chooseItem(excludeItem, (item) => Boolean(searchFilter(item)));

  const allExcludedItems = _.sortBy(_.compact(objectValues(excludedItems)).flat(), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );
  return (
    <LoadoutBucketDropTarget className={styles.area} onItemLocked={excludeItem}>
      {Boolean(allExcludedItems.length) && (
        <div className={styles.itemGrid}>
          {allExcludedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unExcludeItem} />
          ))}
        </div>
      )}
      <div className={styles.buttons}>
        <button type="button" className="dim-button" onClick={chooseExcludeItem}>
          <AppIcon icon={faTimesCircle} /> {t('LoadoutBuilder.ExcludeItem')}
        </button>
      </div>
    </LoadoutBucketDropTarget>
  );
});

export const loMenuSection = styles.area;
