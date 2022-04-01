import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { hideItemPicker, showItemPicker } from 'app/item-picker/item-picker';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { isLoadoutBuilderItem, pickSubclass } from 'app/loadout/item-utils';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { createGetModRenderKey } from 'app/loadout/mod-utils';
import SubclassPlugDrawer from 'app/loadout/SubclassPlugDrawer';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import {
  getDefaultAbilityChoiceHash,
  getSocketByIndex,
  getSocketsByCategoryHashes,
} from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { Dispatch, memo, useCallback, useEffect, useMemo, useState } from 'react';
import ReactDom from 'react-dom';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import { ExcludedItems, LockableBucketHashes, PinnedItems } from '../types';
import ExoticArmorChoice from './ExoticArmorChoice';
import ExoticPicker from './ExoticPicker';
import styles from './LockArmorAndPerks.m.scss';
import LockedItem from './LockedItem';

interface Props {
  selectedStore: DimStore;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedMods: PluggableInventoryItemDefinition[];
  subclass?: ResolvedLoadoutItem;
  lockedExoticHash?: number;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

/**
 * A control section that allows for locking items and perks, or excluding items from generated sets.
 */
export default memo(function LockArmorAndPerks({
  selectedStore,
  pinnedItems,
  excludedItems,
  lockedMods,
  subclass,
  lockedExoticHash,
  searchFilter,
  lbDispatch,
}: Props) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);
  const [showSubclassOptionsPicker, setShowSubclassOptionsPicker] = useState(false);
  const defs = useD2Definitions()!;
  const isPhonePortrait = useIsPhonePortrait();
  const getModRenderKey = createGetModRenderKey();
  useEffect(() => hideItemPicker(), [selectedStore.classType]);

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () =>
    lbDispatch({
      type: 'setPinnedItems',
      items: selectedStore.items.filter((item) => item.equipped && isLoadoutBuilderItem(item)),
    });

  const chooseItem =
    (updateFunc: (item: DimItem) => void, filter?: (item: DimItem) => boolean) =>
    async (e: React.MouseEvent) => {
      e.preventDefault();

      try {
        const { item } = await showItemPicker({
          filterItems: (item: DimItem) =>
            isLoadoutBuilderItem(item) &&
            itemCanBeEquippedBy(item, selectedStore, true) &&
            (!filter || filter(item)),
          sortBy: (item) => LockableBucketHashes.indexOf(item.bucket.hash),
        });

        updateFunc(item);
      } catch (e) {}
    };

  const chooseSubclass = async () => {
    const subclassItemFilter = (item: DimItem) =>
      item.sockets !== null && selectedStore.items.includes(item) && itemCanBeInLoadout(item);

    const item = await pickSubclass(subclassItemFilter);

    if (item) {
      lbDispatch({ type: 'updateSubclass', item });
    }
  };

  const onModClicked = (mod: PluggableInventoryItemDefinition) =>
    lbDispatch({
      type: 'removeLockedMod',
      mod,
    });

  const pinItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'pinItem', item }),
    [lbDispatch]
  );
  const unpinItem = (item: DimItem) => lbDispatch({ type: 'unpinItem', item });
  const excludeItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'excludeItem', item }),
    [lbDispatch]
  );
  const unExcludeItem = (item: DimItem) => lbDispatch({ type: 'unexcludeItem', item });

  const chooseLockItem = chooseItem(
    pinItem,
    // Exclude types that already have a locked item represented
    (item) => Boolean(!pinnedItems[item.bucket.hash] && searchFilter(item))
  );
  const chooseExcludeItem = chooseItem(excludeItem, (item) => Boolean(searchFilter(item)));

  const allPinnedItems = _.sortBy(_.compact(Object.values(pinnedItems)), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );
  const allExcludedItems = _.sortBy(_.compact(Object.values(excludedItems)).flat(), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );

  // This creates a list of socket override plugs for the subclass.
  // We need to track whether it is a default ability as those cannot be deleted.
  const socketOverridePlugs: {
    plug: PluggableInventoryItemDefinition;
    isDefaultAbility: boolean;
  }[] = useMemo(() => {
    if (!subclass?.loadoutItem.socketOverrides || !subclass.item.sockets) {
      return emptyArray();
    }

    const rtn: { plug: PluggableInventoryItemDefinition; isDefaultAbility: boolean }[] = [];

    for (const socketIndexString of Object.keys(subclass?.loadoutItem.socketOverrides)) {
      const socketIndex = parseInt(socketIndexString, 10);
      const socket = getSocketByIndex(subclass.item.sockets, socketIndex);
      const abilityAndSuperSockets = getSocketsByCategoryHashes(subclass.item.sockets, [
        SocketCategoryHashes.Abilities_Abilities_DarkSubclass,
        SocketCategoryHashes.Abilities_Abilities_LightSubclass,
        SocketCategoryHashes.Super,
      ]);

      const overridePlug = defs.InventoryItem.get(
        subclass.loadoutItem.socketOverrides[socketIndex]
      ) as PluggableInventoryItemDefinition;

      const isDefaultAbility = Boolean(
        socket &&
          getDefaultAbilityChoiceHash(socket) === overridePlug.hash &&
          abilityAndSuperSockets.includes(socket)
      );

      rtn.push({ plug: overridePlug, isDefaultAbility });
    }

    return rtn;
  }, [defs, subclass?.loadoutItem.socketOverrides, subclass?.item.sockets]);

  return (
    <>
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol start={2}>
            <li>{t('LoadoutBuilder.OptimizerExplanationMods')}</li>
          </ol>
        </div>
      )}
      {/* Locked exotic */}
      <div className={styles.area}>
        {lockedExoticHash && (
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
      {/* Mods */}
      <div className={styles.area}>
        {Boolean(lockedMods.length) && (
          <div className={styles.itemGrid}>
            {lockedMods.map((mod) => (
              <PlugDef key={getModRenderKey(mod)} plug={mod} onClose={() => onModClicked(mod)} />
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
      </div>
      {/* Subclass */}
      <div className={styles.area}>
        {subclass && (
          <div className={styles.itemGrid}>
            <LockedItem
              lockedItem={subclass.item}
              onRemove={() => lbDispatch({ type: 'removeSubclass' })}
            />
            {socketOverridePlugs.map(({ plug, isDefaultAbility }) => (
              <PlugDef
                key={getModRenderKey(plug)}
                plug={plug}
                onClose={
                  isDefaultAbility
                    ? undefined
                    : () => lbDispatch({ type: 'removeSingleSubclassSocketOverride', plug })
                }
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
      {/* Armor Upgrades */}
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol start={3}>
            <li>{t('LoadoutBuilder.OptimizerExplanationUpgrades')}</li>
          </ol>
        </div>
      )}
      {/* Pinned items */}
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
      {/* Excluded items */}
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
      {showExoticPicker &&
        ReactDom.createPortal(
          <ExoticPicker
            lockedExoticHash={lockedExoticHash}
            classType={selectedStore.classType}
            onSelected={(exotic) => lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic })}
            onClose={() => setShowExoticPicker(false)}
          />,
          document.body
        )}
      {showSubclassOptionsPicker &&
        subclass &&
        ReactDom.createPortal(
          <SubclassPlugDrawer
            subclass={subclass.item}
            socketOverrides={subclass.loadoutItem.socketOverrides || emptyObject()}
            onAccept={(socketOverrides) =>
              lbDispatch({ type: 'updateSubclassSocketOverrides', socketOverrides })
            }
            onClose={() => setShowSubclassOptionsPicker(false)}
          />,
          document.body
        )}
    </>
  );
});
