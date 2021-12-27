import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { bucketsSelector } from 'app/inventory/selectors';
import { SelectedArmorUpgrade } from 'app/loadout-builder/filter/ArmorUpgradePicker';
import ExoticArmorChoice from 'app/loadout-builder/filter/ExoticArmorChoice';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faCalculator, searchIcon } from 'app/shell/icons';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './LoadoutItemCategorySection.m.scss';

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
  equippedItemIds,
  loadout,
}: {
  category: string;
  subclass?: DimLoadoutItem;
  items?: DimItem[];
  savedMods: PluggableInventoryItemDefinition[];
  equippedItemIds: Set<string>;
  loadout: Loadout;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.type);
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category].map((b) => b.type!)
      : _.sortBy(Object.keys(itemsByBucket), (bucketType) =>
          buckets.byCategory[category].findIndex((b) => b.type === bucketType)
        );

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      {items ? (
        <div className={styles.itemsInCategory}>
          {bucketOrder.map((bucketType) => (
            <ItemBucket
              key={bucketType}
              items={itemsByBucket[bucketType]}
              equippedItemIds={equippedItemIds}
            />
          ))}
        </div>
      ) : (
        <>
          <div className={clsx(styles.placeholder, `category-${category}`)}>
            {t(`Bucket.${category}`)}
          </div>
          {category === 'Armor' && loadout.parameters && <OptimizerButton loadout={loadout} />}
        </>
      )}
      {category === 'Armor' && items && (
        <>
          {items.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
                stats={getLoadoutStats(defs, loadout.classType, subclass, items, savedMods)}
                characterClass={loadout.classType}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          <OptimizerButton loadout={loadout} />
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
  items,
  equippedItemIds,
}: {
  items: DimItem[] | undefined;
  equippedItemIds: Set<string>;
}) {
  if (!items) {
    return <div className={styles.items} />;
  }

  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

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
                  <div className={clsx({ [styles.missingItem]: item.owner === 'unknown' })}>
                    <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                  </div>
                )}
              </ItemPopupTrigger>
            ))}
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
            />
          )
        )
      )}
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
