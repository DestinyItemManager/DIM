import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import _ from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';
import { MinMax, MinMaxIgnored, statHashes, StatTypes, UpgradeSpendTiers } from '../types';
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
  upgradeSpendTier: UpgradeSpendTiers;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMaxIgnored }): void;
}) {
  const dispatch = useDispatch();

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
          <select
            className={styles.materialSelect}
            value={upgradeSpendTier}
            onChange={(event) =>
              dispatch(setSetting('loUpgradeSpendTier', parseInt(event.target.value, 10)))
            }
          >
            <option value={UpgradeSpendTiers.Nothing}>
              {t('LoadoutBuilder.SpendNoMaterials')}
            </option>
            <option value={UpgradeSpendTiers.LegendaryShards}>
              {t('LoadoutBuilder.LegendaryShards')}
            </option>
            <option value={UpgradeSpendTiers.EnhancementPrisms}>
              {t('LoadoutBuilder.EnhancementPrisms')}
            </option>
            <option value={UpgradeSpendTiers.AscendantShardsNotExotic}>
              {t('LoadoutBuilder.AscendantShardsNotExotics')}
            </option>
            <option value={UpgradeSpendTiers.AscendantShards}>
              {t('LoadoutBuilder.AscendantShards')}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
