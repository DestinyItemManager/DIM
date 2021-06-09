import BungieImage from 'app/dim-ui/BungieImage';
import Select, { Option } from 'app/dim-ui/Select';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { UpgradeMaterialHashes } from 'app/search/d2-known-values';
import { setSetting } from 'app/settings/actions';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { MinMax, MinMaxIgnored, statHashes, StatTypes, UpgradeSpendTier } from '../types';
import styles from './FilterBuilds.m.scss';
import TierSelect from './TierSelect';

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  statRanges,
  stats,
  order,
  upgradeSpendTier,
  onStatFiltersChanged,
}: {
  statRanges?: { [statType in StatTypes]: MinMax };
  stats: { [statType in StatTypes]: MinMaxIgnored };
  order: StatTypes[];
  upgradeSpendTier: UpgradeSpendTier;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMaxIgnored }): void;
}) {
  const dispatch = useDispatch();
  const defs = useD2Definitions();

  const onStatOrderChanged = (sortOrder: StatTypes[]) => {
    dispatch(
      setSetting(
        'loStatSortOrder',
        sortOrder.map((type) => statHashes[type])
      )
    );
  };

  const workingStatRanges =
    statRanges || _.mapValues(statHashes, () => ({ min: 0, max: 10, ignored: false }));

  const legendaryShardDef = defs?.InventoryItem.get(UpgradeMaterialHashes.legendaryShard);
  const enhancementPrismDef = defs?.InventoryItem.get(UpgradeMaterialHashes.enhancementPrism);
  const ascendantShardDef = defs?.InventoryItem.get(UpgradeMaterialHashes.ascendantShard);
  const legendaryShardIcon = legendaryShardDef?.displayProperties.icon;
  const enhancementPrismIcon = enhancementPrismDef?.displayProperties.icon;
  const ascendantShardIcon = ascendantShardDef?.displayProperties.icon;
  const ascendantShardName = ascendantShardDef?.displayProperties.name || 'Ascendant Shard';

  const upgradeOptions: Option<UpgradeSpendTier>[] = useMemo(
    () => [
      {
        key: 'explanation',
        disabled: true,
        content: (
          <div className={styles.materialSpendInfo}>
            {t('LoadoutBuilder.UpgradeTierExplanation')}
          </div>
        ),
      },
      {
        key: UpgradeSpendTier.Nothing.toString(),
        value: UpgradeSpendTier.Nothing,
        content: (
          <div className={styles.upgradeOption}>
            <div className={styles.materialName}>{t('LoadoutBuilder.Nothing')}</div>
          </div>
        ),
      },
      {
        key: UpgradeSpendTier.LegendaryShards.toString(),
        value: UpgradeSpendTier.LegendaryShards,
        content: (
          <div className={styles.upgradeOption}>
            {legendaryShardIcon && <BungieImage src={legendaryShardIcon} />}
            <div className={styles.materialName}>
              {legendaryShardDef?.displayProperties.name || 'Legendary Shard'}
            </div>
          </div>
        ),
      },
      {
        key: UpgradeSpendTier.EnhancementPrisms.toString(),
        value: UpgradeSpendTier.EnhancementPrisms,
        content: (
          <div className={styles.upgradeOption}>
            {enhancementPrismIcon && <BungieImage src={enhancementPrismIcon} />}
            <div className={styles.materialName}>
              {enhancementPrismDef?.displayProperties.name || 'Enhancement Prism'}
            </div>
          </div>
        ),
      },
      {
        key: UpgradeSpendTier.AscendantShardsNotExotic.toString(),
        value: UpgradeSpendTier.AscendantShardsNotExotic,
        content: (
          <div className={styles.upgradeOption}>
            {ascendantShardIcon && <BungieImage src={ascendantShardIcon} />}
            <div className={styles.materialName}>
              {t('LoadoutBuilder.NotExotics', {
                material: ascendantShardName,
              })}
            </div>
          </div>
        ),
      },
      {
        key: UpgradeSpendTier.AscendantShards.toString(),
        value: UpgradeSpendTier.AscendantShards,
        content: (
          <div className={styles.upgradeOption}>
            {ascendantShardIcon && <BungieImage src={ascendantShardIcon} />}
            <div className={styles.materialName}>{ascendantShardName}</div>
          </div>
        ),
      },
    ],
    [
      ascendantShardIcon,
      ascendantShardName,
      enhancementPrismDef?.displayProperties.name,
      enhancementPrismIcon,
      legendaryShardDef?.displayProperties.name,
      legendaryShardIcon,
    ]
  );

  return (
    <div>
      <div className={styles.filters}>
        <TierSelect
          rowClassName={styles.row}
          stats={stats}
          statRanges={workingStatRanges}
          order={order}
          onStatFiltersChanged={onStatFiltersChanged}
          onStatOrderChanged={onStatOrderChanged}
        />
        <div className={styles.upgradeMaterials}>
          <Select
            className={styles.materialSelect}
            maxDropdownWidth={'button'}
            options={upgradeOptions}
            value={upgradeSpendTier}
            onChange={(value) => value && dispatch(setSetting('loUpgradeSpendTier', value))}
          />
        </div>
      </div>
    </div>
  );
}
