import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Select from 'app/dim-ui/Select';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { updateLoadout } from 'app/loadout-drawer/actions';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { convertToLoadoutItem } from 'app/loadout-drawer/loadout-utils';
import LoadoutView from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ArmorSet, LockableBucketHashes } from '../types';
import styles from './CompareDrawer.m.scss';

interface Props {
  set: ArmorSet;
  selectedStore: DimStore;
  loadouts: Loadout[];
  initialLoadoutId?: string;
  subclass: ResolvedLoadoutItem | undefined;
  classType: DestinyClass;
  params: LoadoutParameters;
  notes?: string;
  onClose(): void;
}

function chooseInitialLoadout(
  setItems: DimItem[],
  useableLoadouts: Loadout[],
  initialLoadoutId?: string
): Loadout | undefined {
  const loadoutFromInitialId = useableLoadouts.find((lo) => lo.id === initialLoadoutId);
  if (loadoutFromInitialId) {
    return loadoutFromInitialId;
  }
  const exotic = setItems.find((i) => i.isExotic);
  return (
    (exotic && useableLoadouts.find((l) => l.items.some((i) => i.hash === exotic.hash))) ||
    (useableLoadouts.length ? useableLoadouts[0] : undefined)
  );
}

/**
 * Creates an updated loadout from an old `loadout`, with
 * equipped armor replaced with `setItems`, any subclass
 * replaced with `subclass`, and the given `params` and `notes`.
 */
function createLoadoutUsingLOItems(
  defs: D2ManifestDefinitions,
  allItems: DimItem[],
  autoMods: number[],
  storeId: string | undefined,
  buckets: InventoryBuckets,
  setItems: DimItem[],
  subclass: ResolvedLoadoutItem | undefined,
  loadout: Loadout | undefined,
  params: LoadoutParameters,
  notes: string | undefined
) {
  return produce(loadout, (draftLoadout) => {
    if (draftLoadout) {
      const [resolvedItems, warnItems] = getItemsFromLoadoutItems(
        draftLoadout.items,
        defs,
        storeId,
        buckets,
        allItems
      );
      const newItems = setItems.map((item) => convertToLoadoutItem(item, true));
      if (subclass) {
        newItems.push(subclass.loadoutItem);
      }

      // We treat missing and existing items all the same here, we just need to
      // investigate the resolution result for whether items need to be
      // retained or will be replaced.
      // NB this drops items if fake item creation fails, but that's fine
      // because the user gets a preview of the entire loadout as it would be saved
      for (const existingItem of resolvedItems.concat(warnItems)) {
        // An item is replaced if
        const hasBeenReplaced =
          // it's an equipped armor piece (since our LO set always consists of 5 equipped pieces)
          (existingItem.loadoutItem.equip &&
            LockableBucketHashes.includes(existingItem.item.bucket.hash)) ||
          // it already exists in our setItems (it may be pocketed)
          setItems.some((i) => i.id === existingItem.item.id) ||
          // or we replace the subclass
          (subclass && existingItem.item.bucket.hash === BucketHashes.Subclass);
        if (!hasBeenReplaced) {
          newItems.push(existingItem.loadoutItem);
        }
      }

      draftLoadout.items = newItems;
      const allMods = [...(params.mods ?? []), ...autoMods];
      // FIXME(#8733) add auto mods to autoStatMods instead of adding them to regular mods
      params = { ...params, mods: allMods.length ? allMods : undefined };
      draftLoadout.parameters = params;
      // loadout.autoStatMods = autoMods.length ? autoMods : undefined;
      draftLoadout.notes = notes || draftLoadout.notes;
    }
  });
}

export default function CompareDrawer({
  loadouts,
  selectedStore,
  initialLoadoutId,
  set,
  subclass,
  classType,
  params,
  notes,
  onClose,
}: Props) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const setItems = set.armor.map((items) => items[0]);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(() =>
    chooseInitialLoadout(setItems, useableLoadouts, initialLoadoutId)
  );

  const allItems = useSelector(allItemsSelector);
  const buckets = useSelector(bucketsSelector)!;

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const generatedLoadout = useMemo(
    () =>
      createLoadoutUsingLOItems(
        defs,
        allItems,
        set.statMods,
        selectedStore.id,
        buckets,
        setItems,
        subclass,
        selectedLoadout,
        params,
        notes
      ),
    [
      defs,
      allItems,
      set.statMods,
      selectedStore.id,
      buckets,
      setItems,
      subclass,
      selectedLoadout,
      params,
      notes,
    ]
  );

  const onSaveLoadout = (e: React.MouseEvent) => {
    e.preventDefault();

    if (
      selectedLoadout &&
      !confirm(t('LoadoutBuilder.ConfirmOverwrite', { name: selectedLoadout.name }))
    ) {
      return;
    }

    if (!generatedLoadout) {
      return;
    }

    dispatch(updateLoadout(generatedLoadout));
    onClose();
  };

  const header = <div className={styles.header}>{t('LoadoutBuilder.CompareLoadout')}</div>;

  // This is likely never to happen but since it is disconnected to the button its here for safety.
  if (!selectedLoadout || !generatedLoadout) {
    return (
      <Sheet onClose={onClose} header={header}>
        <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoLoadoutsToCompare')}</div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} header={header}>
      <div className={styles.content}>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.OptimizerSet')}</div>
          </div>
          <LoadoutView
            loadout={generatedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <button key="save" className="dim-button" type="button" onClick={onSaveLoadout}>
                {t('LoadoutBuilder.SaveAs')}{' '}
                <span className={styles.loadoutName}>{selectedLoadout.name}</span>
              </button>,
            ]}
          />
        </div>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.ExistingLoadout')}</div>
          </div>
          <LoadoutView
            loadout={selectedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <Select<Loadout>
                key="select-loadout"
                value={selectedLoadout}
                options={useableLoadouts.map((l) => ({
                  key: l.id,
                  value: l,
                  content: l.name,
                }))}
                onChange={(l) => setSelectedLoadout(l)}
              />,
            ]}
          />
        </div>
      </div>
    </Sheet>
  );
}
