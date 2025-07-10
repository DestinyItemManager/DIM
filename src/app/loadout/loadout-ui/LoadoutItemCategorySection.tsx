import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { D2BucketCategory } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useAnalyzeLoadout } from 'app/loadout-analyzer/hooks';
import { ArmorBucketHashes, ResolvedStatConstraint } from 'app/loadout-builder/types';
import {
  clearBucketCategory,
  setLoadoutParameters,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { LoadoutCharacterStats } from 'app/store-stats/CharacterStats';
import { isEmpty } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { partition } from 'es-toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import '../../inventory-page/StoreBucket.scss';
import { BucketPlaceholder } from './BucketPlaceholder';
import { FashionMods } from './FashionMods';
import styles from './LoadoutItemCategorySection.m.scss';
import LoadoutParametersDisplay from './LoadoutParametersDisplay';
import { OptimizerButton, armorItemsMissing } from './OptimizerButton';

const categoryStyles: LookupTable<D2BucketCategory, string> = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutItemCategorySection({
  category,
  subclass,
  store,
  items,
  allMods,
  modsByBucket,
  loadout,
  hideOptimizeArmor,
}: {
  category: D2BucketCategory;
  subclass?: ResolvedLoadoutItem;
  store: DimStore;
  items?: ResolvedLoadoutItem[];
  allMods: PluggableInventoryItemDefinition[];
  modsByBucket: {
    [bucketHash: number]: number[];
  };
  loadout: Loadout;
  hideOptimizeArmor?: boolean;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const analysis = useAnalyzeLoadout(loadout, store, /* active */ !hideOptimizeArmor);
  const itemsByBucket = Map.groupBy(items ?? [], (li) => li.item.bucket.hash);
  const isPhonePortrait = useIsPhonePortrait();
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : Array.from(itemsByBucket.keys(), (bucketHash) => buckets.byHash[bucketHash]).sort(
          compareBy((bucket) =>
            buckets.byCategory[category].findIndex((b) => b.hash === bucket.hash),
          ),
        );
  const equippedItems =
    items?.filter((li) => li.loadoutItem.equip && !li.missing).map((li) => li.item) ?? [];

  const isArmor = category === 'Armor';
  const hasFashion = isArmor && !isEmpty(modsByBucket);

  const [optimizeLoadout, constraints]: [Loadout, ResolvedStatConstraint[] | undefined] =
    useMemo(() => {
      if (
        analysis?.result.armorResults?.tag === 'done' &&
        analysis.result.armorResults.betterStatsAvailable
      ) {
        return [
          clearBucketCategory(
            defs,
            'Armor',
          )(setLoadoutParameters(analysis.result.armorResults.loadoutParameters)(loadout)),
          analysis.result.armorResults.strictUpgradeStatConstraints,
        ];
      } else {
        return [loadout, undefined];
      }
    }, [defs, analysis?.result.armorResults, loadout]);

  if (isPhonePortrait && !items && !hasFashion) {
    return null;
  }

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      {items || hasFashion ? (
        <div className={styles.itemsInCategory}>
          {bucketOrder.map((bucket) => (
            <ItemBucket
              key={bucket.hash}
              storeId={store.id}
              bucketHash={bucket.hash}
              items={itemsByBucket.get(bucket.hash) ?? emptyArray()}
              modsForBucket={modsByBucket[bucket.hash] ?? emptyArray()}
            />
          ))}
        </div>
      ) : (
        <>
          <div className={clsx(styles.placeholder, `category-${category}`)}>
            {t(`Bucket.${category}`, { metadata: { keys: 'buckets' } })}
          </div>
        </>
      )}
      {items && isArmor && (
        <>
          {equippedItems.length === 5 && (
            <div className="stat-bars">
              <LoadoutCharacterStats
                loadout={loadout}
                subclass={subclass}
                allMods={allMods}
                items={items}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          {!hideOptimizeArmor && (
            <OptimizerButton
              loadout={optimizeLoadout}
              storeId={store.id}
              missingArmor={armorItemsMissing(items)}
              strictUpgradeStatConstraints={constraints}
            />
          )}
        </>
      )}
    </div>
  );
}

function ItemBucket({
  bucketHash,
  storeId,
  items,
  modsForBucket,
}: {
  bucketHash: number;
  storeId?: string;
  items: ResolvedLoadoutItem[];
  modsForBucket: number[];
}) {
  const [equipped, unequipped] = partition(items, (li) => li.loadoutItem.equip);

  const showFashion = ArmorBucketHashes.includes(bucketHash);

  // TODO: should these be draggable? so you can drag them into other loadouts?

  return (
    <div className={styles.itemBucket}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map(({ item, loadoutItem, missing }) => (
              <DraggableInventoryItem item={item} key={item.id}>
                <ItemPopupTrigger
                  item={item}
                  extraData={{ socketOverrides: loadoutItem.socketOverrides }}
                >
                  {(ref, onClick) => (
                    <div
                      className={clsx({
                        [styles.missingItem]: missing,
                      })}
                    >
                      <ConnectedInventoryItem item={item} ref={ref} onClick={onClick} />
                    </div>
                  )}
                </ItemPopupTrigger>
              </DraggableInventoryItem>
            ))}
            {index === 0 && showFashion && (
              <FashionMods modsForBucket={modsForBucket} storeId={storeId} />
            )}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
              key={index}
            >
              <BucketPlaceholder bucketHash={bucketHash} />
              {/* TODO: show empty placeholder for bucket type? */}
              {showFashion && <FashionMods modsForBucket={modsForBucket} storeId={storeId} />}
            </div>
          )
        ),
      )}
    </div>
  );
}
