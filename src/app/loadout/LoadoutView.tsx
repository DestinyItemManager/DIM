import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { DimLoadoutItem, Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { emptyObject } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { count } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { ReactNode, useMemo } from 'react';
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
): [items: DimLoadoutItem[], subclass: DimLoadoutItem | undefined, warnitems: DimLoadoutItem[]] {
  const [items, warnitems] = getItemsFromLoadoutItems(
    loadoutItems,
    defs,
    buckets,
    allItems,
    modsByBucket
  );
  const subclass = items.find((item) => item.bucket.hash === BucketHashes.Subclass);

  let equippableItems = items.filter((i) => itemCanBeEquippedBy(i, store, true));
  if (subclass) {
    equippableItems = equippableItems.filter((i) => i.hash !== subclass.hash);
  }

  return [equippableItems, subclass, warnitems];
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

  const savedMods = useMemo(() => getModsFromLoadout(defs, loadout), [defs, loadout]);

  const equippedItemIds = new Set(loadout.items.filter((i) => i.equipped).map((i) => i.id));

  const categories = _.groupBy(items.concat(warnitems), (i) => i.bucket.sort);

  const isEquipped = (i: DimItem) =>
    Boolean(i.owner !== 'unknown' && i.power && equippedItemIds.has(i.id));
  const showPower =
    count(categories.Weapons ?? [], isEquipped) === 3 &&
    count(categories.Armor ?? [], isEquipped) === 5;
  const power = showPower
    ? Math.floor(getLight(store, [...categories.Weapons, ...categories.Armor]))
    : 0;

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
        <h2>
          {loadout.classType === DestinyClass.Unknown && (
            <ClassIcon className={styles.classIcon} classType={loadout.classType} />
          )}
          {loadout.name}
          {warnitems.length > 0 && (
            <span className={styles.missingItems}>
              <AppIcon className="warning-icon" icon={faExclamationTriangle} />
              {t('Loadouts.MissingItemsWarning')}
            </span>
          )}
        </h2>
        <div className={styles.actions}>{actionButtons}</div>
      </div>
      {loadout.notes && <div className={styles.loadoutNotes}>{loadout.notes}</div>}
      <div className={styles.contents}>
        {(items.length > 0 || subclass || savedMods.length > 0 || !_.isEmpty(modsByBucket)) && (
          <>
            {(!isPhonePortrait || subclass) && (
              <LoadoutSubclassSection defs={defs} subclass={subclass} power={power} />
            )}
            {['Weapons', 'Armor', 'General'].map((category) => (
              <LoadoutItemCategorySection
                key={category}
                category={category}
                subclass={subclass}
                storeId={store.id}
                items={categories[category]}
                savedMods={savedMods}
                modsByBucket={modsByBucket}
                equippedItemIds={equippedItemIds}
                loadout={loadout}
                hideOptimizeArmor={hideOptimizeArmor}
              />
            ))}
            <LoadoutMods
              loadout={loadout}
              savedMods={savedMods}
              storeId={store.id}
              hideShowModPlacements={hideShowModPlacements}
            />
          </>
        )}
      </div>
    </div>
  );
}
