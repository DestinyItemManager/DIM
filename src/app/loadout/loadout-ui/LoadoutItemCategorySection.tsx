import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { bucketsSelector } from 'app/inventory/selectors';
import { SelectedArmorUpgrade } from 'app/loadout-builder/filter/ArmorUpgradePicker';
import ExoticArmorChoice from 'app/loadout-builder/filter/ExoticArmorChoice';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { AppIcon, faCalculator, searchIcon } from 'app/shell/icons';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './LoadoutItemCategorySection.m.scss';
import PlugDef from './PlugDef';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutItemCategorySection({
  category,
  subclass,
  items,
  savedMods,
  modsByBucket,
  equippedItemIds,
  loadout,
  hideOptimizeArmor,
}: {
  category: string;
  subclass?: DimLoadoutItem;
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
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : _.sortBy(
          Object.keys(itemsByBucket).map((bucketHash) => buckets.byHash[parseInt(bucketHash, 10)]),
          (bucket) => buckets.byCategory[category].findIndex((b) => b.hash === bucket.hash)
        );
  const equippedItems =
    items?.filter((i) => equippedItemIds.has(i.id) && i.owner !== 'unknown') ?? [];

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      {items ? (
        <div className={styles.itemsInCategory}>
          {bucketOrder.map((bucket) => (
            <ItemBucket
              key={bucket.hash}
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
          {category === 'Armor' && loadout.parameters && <OptimizerButton loadout={loadout} />}
        </>
      )}
      {category === 'Armor' && items && (
        <>
          {equippedItems.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
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
  items,
  equippedItemIds,
  modsForBucket,
}: {
  bucketHash: number;
  items: DimItem[];
  equippedItemIds: Set<string>;
  modsForBucket: number[];
}) {
  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

  const showFashion = LockableBucketHashes.includes(bucketHash);

  return (
    <div className={styles.itemBucket}>
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
              <FashionMods item={items[0]} modsForBucket={modsForBucket} />
            )}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(
                styles.items,
                styles.empty,
                index === 0 ? styles.equipped : styles.unequipped
              )}
              key={index}
            >
              {/* TODO: show empty placeholder for bucket type? */}
              {showFashion && <FashionMods modsForBucket={modsForBucket} />}
            </div>
          )
        )
      )}
    </div>
  );
}

// TODO: Consolidate with the one in FashionDrawer
function FashionMods({ item, modsForBucket }: { item?: DimItem; modsForBucket: number[] }) {
  const defs = useD2Definitions()!;
  const isShader = (m: number) =>
    defs.InventoryItem.get(m)?.plug?.plugCategoryHash === PlugCategoryHashes.Shader;
  const shader = modsForBucket.find(isShader);
  const ornament = modsForBucket.find((m) => !isShader(m));

  const shaderItem = shader ? defs.InventoryItem.get(shader) : undefined;
  const ornamentItem = ornament ? defs.InventoryItem.get(ornament) : undefined;

  // TODO: dim out the mod if it's really unselected - differentiate between "I chose no mod"

  // TODO: dim out the mod if it's not unlocked or doesn't fit on the selected item
  //const cosmeticSockets = item?.sockets ? getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics) : []
  //const shaderEnabled = shader && cosmeticSockets.some(())

  const defaultShader = defs.InventoryItem.get(DEFAULT_SHADER);
  const defaultOrnament = defs.InventoryItem.get(DEFAULT_ORNAMENTS[0]);

  return (
    <div className={clsx(styles.items, styles.fashion, styles.unequipped)}>
      <PlugDef
        className={clsx({ [styles.missingItem]: !shader })}
        plug={(shaderItem ?? defaultShader) as PluggableInventoryItemDefinition}
      />
      <PlugDef
        className={clsx({ [styles.missingItem]: !ornament })}
        plug={(ornamentItem ?? defaultOrnament) as PluggableInventoryItemDefinition}
      />
    </div>
  );
}

function LoadoutParametersDisplay({ params }: { params: LoadoutParameters }) {
  const defs = useD2Definitions()!;
  const { query, exoticArmorHash, upgradeSpendTier, statConstraints, lockItemEnergyType } = params;
  const show =
    params.query ||
    params.exoticArmorHash ||
    params.upgradeSpendTier !== undefined ||
    params.statConstraints?.some((s) => s.maxTier !== undefined || s.minTier !== undefined);
  if (!show) {
    return null;
  }

  return (
    <div className={styles.loParams}>
      {query && (
        <div className={styles.loQuery}>
          <AppIcon icon={searchIcon} />
          {query}
        </div>
      )}
      {exoticArmorHash && (
        <div className={styles.loExotic}>
          <ExoticArmorChoice lockedExoticHash={exoticArmorHash} />
        </div>
      )}
      {upgradeSpendTier !== undefined && (
        <div className={styles.loSpendTier}>
          <SelectedArmorUpgrade
            defs={defs}
            upgradeSpendTier={upgradeSpendTier}
            lockItemEnergyType={lockItemEnergyType ?? false}
          />
        </div>
      )}
      {statConstraints && (
        <div className={styles.loStats}>
          {statConstraints.map((s) => (
            <div key={s.statHash} className={styles.loStat}>
              <BungieImage src={defs.Stat.get(s.statHash).displayProperties.icon} />
              {s.minTier !== undefined && s.minTier !== 0 ? (
                <span>
                  {t('LoadoutBuilder.TierNumber', {
                    tier: s.minTier,
                  })}
                  {(s.maxTier === 10 || s.maxTier === undefined) && s.minTier !== 10
                    ? '+'
                    : s.maxTier !== undefined && s.maxTier !== s.minTier
                    ? `-${s.maxTier}`
                    : ''}
                </span>
              ) : s.maxTier !== undefined ? (
                <span>T{s.maxTier}-</span>
              ) : (
                t('LoadoutBuilder.TierNumber', {
                  tier: 10,
                }) + '-'
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
