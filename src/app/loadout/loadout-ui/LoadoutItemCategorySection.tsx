import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { bucketsSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, faCalculator } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BucketPlaceholder } from './BucketPlaceholder';
import styles from './LoadoutItemCategorySection.m.scss';
import LoadoutParametersDisplay from './LoadoutParametersDisplay';
import PlugDef from './PlugDef';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutItemCategorySection({
  category,
  subclass,
  storeId,
  items,
  savedMods,
  modsByBucket,
  equippedItemIds,
  loadout,
  hideOptimizeArmor,
}: {
  category: string;
  subclass?: DimLoadoutItem;
  storeId?: string;
  items?: DimItem[];
  savedMods: PluggableInventoryItemDefinition[];
  modsByBucket: {
    [bucketHash: number]: number[];
  };
  equippedItemIds: Set<string>;
  loadout: Loadout;
  hideOptimizeArmor?: boolean;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);
  const isPhonePortrait = useIsPhonePortrait();
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : _.sortBy(
          Object.keys(itemsByBucket).map((bucketHash) => buckets.byHash[parseInt(bucketHash, 10)]),
          (bucket) => buckets.byCategory[category].findIndex((b) => b.hash === bucket.hash)
        );
  const equippedItems =
    items?.filter((i) => equippedItemIds.has(i.id) && i.owner !== 'unknown') ?? [];

  const isArmor = category === 'Armor';
  const hasFashion = isArmor && !_.isEmpty(modsByBucket);

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
              storeId={storeId}
              bucketHash={bucket.hash}
              items={itemsByBucket[bucket.hash]}
              equippedItemIds={equippedItemIds}
              modsForBucket={modsByBucket[bucket.hash] ?? emptyArray()}
            />
          ))}
        </div>
      ) : (
        <>
          <div className={clsx(styles.placeholder, `category-${category}`)}>
            {t(`Bucket.${category}`, { contextList: 'buckets' })}
          </div>
        </>
      )}
      {items && isArmor && (
        <>
          {equippedItems.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
                showTier
                stats={getLoadoutStats(defs, loadout.classType, subclass, equippedItems, savedMods)}
                characterClass={loadout.classType}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          {!hideOptimizeArmor && <OptimizerButton loadout={loadout} />}
        </>
      )}
    </div>
  );
}

function OptimizerButton({ loadout }: { loadout: Loadout }) {
  return (
    <Link className="dim-button" to="../optimizer" state={{ loadout }}>
      <AppIcon icon={faCalculator} /> {t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}

function ItemBucket({
  bucketHash,
  storeId,
  items,
  equippedItemIds,
  modsForBucket,
}: {
  bucketHash: number;
  storeId?: string;
  items: DimItem[];
  equippedItemIds: Set<string>;
  modsForBucket: number[];
}) {
  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

  const showFashion = LockableBucketHashes.includes(bucketHash);

  return (
    <div className={clsx(styles.itemBucket, { [styles.showFashion]: showFashion })}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map((item) => (
              <ItemPopupTrigger item={item} key={item.id}>
                {(ref, onClick) => (
                  <div
                    className={clsx({
                      [styles.missingItem]: item.owner === 'unknown',
                    })}
                  >
                    <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                  </div>
                )}
              </ItemPopupTrigger>
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
        )
      )}
    </div>
  );
}

// TODO: Consolidate with the one in FashionDrawer
function FashionMods({ modsForBucket, storeId }: { modsForBucket: number[]; storeId?: string }) {
  const defs = useD2Definitions()!;
  const unlockedPlugSetItems = useSelector((state: RootState) =>
    unlockedPlugSetItemsSelector(state, storeId)
  );
  const isShader = (m: number) =>
    defs.InventoryItem.get(m)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
  const shader = modsForBucket.find(isShader);
  const ornament = modsForBucket.find((m) => !isShader(m));

  const shaderItem = shader ? defs.InventoryItem.get(shader) : undefined;
  const ornamentItem = ornament ? defs.InventoryItem.get(ornament) : undefined;

  const defaultShader = defs.InventoryItem.get(DEFAULT_SHADER);
  const defaultOrnament = defs.InventoryItem.get(DEFAULT_ORNAMENTS[2]);

  const canSlotShader =
    shader !== undefined && (shader === DEFAULT_SHADER || unlockedPlugSetItems.has(shader));
  const canSlotOrnament =
    ornament !== undefined &&
    (DEFAULT_ORNAMENTS.includes(ornament) || unlockedPlugSetItems.has(ornament));

  return (
    <div className={clsx(styles.items, styles.unequipped, styles.fashion)}>
      <PlugDef
        className={clsx({ [styles.missingItem]: !canSlotShader })}
        plug={(shaderItem ?? defaultShader) as PluggableInventoryItemDefinition}
      />
      <PlugDef
        className={clsx({ [styles.missingItem]: !canSlotOrnament })}
        plug={(ornamentItem ?? defaultOrnament) as PluggableInventoryItemDefinition}
      />
    </div>
  );
}
