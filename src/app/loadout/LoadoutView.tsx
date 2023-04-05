import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ClassIcon from 'app/dim-ui/ClassIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { emptyObject } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { count } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './LoadoutView.m.scss';
import LoadoutItemCategorySection from './loadout-ui/LoadoutItemCategorySection';
import { LoadoutArtifactUnlocks, LoadoutMods } from './loadout-ui/LoadoutMods';
import LoadoutSubclassSection from './loadout-ui/LoadoutSubclassSection';
import { useLoadoutMods } from './mod-assignment-drawer/selectors';

export function getItemsAndSubclassFromLoadout(
  itemCreationContext: ItemCreationContext,
  loadoutItems: LoadoutItem[],
  store: DimStore,
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
    itemCreationContext,
    loadoutItems,
    store.id,
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
  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);
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
      getItemsAndSubclassFromLoadout(
        itemCreationContext,
        loadout.items,
        store,
        allItems,
        modsByBucket
      ),
    [itemCreationContext, loadout.items, store, allItems, modsByBucket]
  );

  const [allMods, modDefinitions] = useLoadoutMods(loadout, store.id);

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
              <LoadoutSubclassSection subclass={subclass} power={power} />
            )}
            {(['Weapons', 'Armor', 'General'] as const).map((category) => (
              <LoadoutItemCategorySection
                key={category}
                category={category}
                subclass={subclass}
                storeId={store.id}
                items={categories[category]}
                allMods={modDefinitions}
                modsByBucket={modsByBucket}
                loadout={loadout}
                hideOptimizeArmor={hideOptimizeArmor}
              />
            ))}
            <div className={styles.modsStack}>
              <LoadoutMods
                loadout={loadout}
                allMods={allMods}
                storeId={store.id}
                hideShowModPlacements={hideShowModPlacements}
                missingSockets={missingSockets}
                hasArtifactUnlocks={Boolean(
                  loadout.parameters?.artifactUnlocks?.unlockedItemHashes.length
                )}
              />
              <LoadoutArtifactUnlocks
                loadout={loadout}
                storeId={store.id}
                className={styles.artifactMods}
              />
            </div>
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
