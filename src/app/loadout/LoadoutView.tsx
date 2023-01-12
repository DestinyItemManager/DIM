import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ClassIcon from 'app/dim-ui/ClassIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { t } from 'app/i18next-t';
import { D2BucketCategory, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { emptyObject } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { count } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import LoadoutItemCategorySection from './loadout-ui/LoadoutItemCategorySection';
import LoadoutMods from './loadout-ui/LoadoutMods';
import LoadoutSubclassSection from './loadout-ui/LoadoutSubclassSection';
import styles from './LoadoutView.m.scss';

export function getItemsAndSubclassFromLoadout(
  loadoutItems: LoadoutItem[],
  store: DimStore,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  allItems: DimItem[],
  modsByBucket?: {
    [bucketHash: number]: number[] | undefined;
  }
): [
  items: ResolvedLoadoutItem[],
  subclass: ResolvedLoadoutItem | undefined,
  warnitems: ResolvedLoadoutItem[]
] {
  let [items, warnitems] = getItemsFromLoadoutItems(
    loadoutItems,
    defs,
    store.id,
    buckets,
    allItems,
    modsByBucket
  );
  const subclass = items
    .concat(warnitems)
    .find((li) => li.item.bucket.hash === BucketHashes.Subclass);

  items = items.filter((li) => itemCanBeEquippedBy(li.item, store, true));
  if (subclass) {
    items = items.filter((li) => li.item.hash !== subclass.item.hash);
    warnitems = warnitems.filter((li) => li.item.hash !== subclass.item.hash);
  }

  return [items, subclass, warnitems];
}

/**
 * A presentational component for a single loadout.
 *
 * The only functionality this provides outside of
 * rendering is the ability to show the mod assignment drawer. If mods are present on the loadout a
 * button will by present under the mods section to activate the drawer.
 */
export default function LoadoutView({
  loadout,
  store,
  actionButtons,
  hideOptimizeArmor,
  hideShowModPlacements,
}: {
  loadout: Loadout;
  store: DimStore;
  actionButtons: ReactNode[];
  hideOptimizeArmor?: boolean;
  hideShowModPlacements?: boolean;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const missingSockets =
    loadout.name === t('Loadouts.FromEquipped') && allItems.some((i) => i.missingSockets);
  const isPhonePortrait = useIsPhonePortrait();

  // TODO: filter down by usable mods?
  const modsByBucket: {
    [bucketHash: number]: number[];
  } = loadout.parameters?.modsByBucket ?? emptyObject();

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(
    () =>
      getItemsAndSubclassFromLoadout(loadout.items, store, defs, buckets, allItems, modsByBucket),
    [loadout.items, defs, buckets, allItems, store, modsByBucket]
  );

  const allMods = useMemo(() => getModsFromLoadout(defs, loadout), [defs, loadout]);

  const categories = _.groupBy(items.concat(warnitems), (li) => li.item.bucket.sort);
  const power = loadoutPower(store, categories);

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
        <h2>
          {loadout.classType === DestinyClass.Unknown && (
            <ClassIcon className={styles.classIcon} classType={loadout.classType} />
          )}
          <ColorDestinySymbols text={loadout.name} />
          {warnitems.length > 0 && (
            <span className={styles.missingItems}>
              <AlertIcon />
              {t('Loadouts.MissingItemsWarning')}
            </span>
          )}
        </h2>
        <div className={styles.actions}>{actionButtons}</div>
      </div>
      {loadout.notes && (
        <ColorDestinySymbols className={styles.loadoutNotes} text={loadout.notes} />
      )}
      <div className={styles.contents}>
        {(items.length > 0 || subclass || allMods.length > 0 || !_.isEmpty(modsByBucket)) && (
          <>
            {(!isPhonePortrait || subclass) && (
              <LoadoutSubclassSection defs={defs} subclass={subclass} power={power} />
            )}
            {['Weapons', 'Armor', 'General'].map((category: D2BucketCategory) => (
              <LoadoutItemCategorySection
                key={category}
                category={category}
                subclass={subclass}
                storeId={store.id}
                items={categories[category]}
                allMods={allMods}
                modsByBucket={modsByBucket}
                loadout={loadout}
                hideOptimizeArmor={hideOptimizeArmor}
              />
            ))}
            <LoadoutMods
              loadout={loadout}
              allMods={allMods}
              storeId={store.id}
              hideShowModPlacements={hideShowModPlacements}
              missingSockets={missingSockets}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function loadoutPower(store: DimStore, categories: _.Dictionary<ResolvedLoadoutItem[]>) {
  const isEquipped = (li: ResolvedLoadoutItem) =>
    Boolean(!li.missing && li.item.power && li.loadoutItem.equip);
  const showPower =
    count(categories.Weapons ?? [], isEquipped) === 3 &&
    count(categories.Armor ?? [], isEquipped) === 5;
  const power = showPower
    ? Math.floor(
        getLight(
          store,
          [...categories.Weapons, ...categories.Armor].map((li) => li.item)
        )
      )
    : 0;

  return power;
}
