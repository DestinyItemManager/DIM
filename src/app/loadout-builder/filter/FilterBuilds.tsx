import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { useSetSetting } from 'app/settings/hooks';
import _ from 'lodash';
import React from 'react';
import { MinMax, MinMaxIgnored, statHashes, StatTypes } from '../types';
import styles from './FilterBuilds.m.scss';
import TierSelect from './TierSelect';

/**
 * A control for filtering builds by stats, and controlling the priority order of stats.
 */
export default function FilterBuilds({
  statRanges,
  stats,
  order,
  assumeMasterwork,
  onStatFiltersChanged,
}: {
  statRanges?: { [statType in StatTypes]: MinMax };
  stats: { [statType in StatTypes]: MinMaxIgnored };
  order: StatTypes[];
  assumeMasterwork: boolean;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMaxIgnored }): void;
}) {
  const setSetting = useSetSetting();

  const onStatOrderChanged = (sortOrder: StatTypes[]) => {
    setSetting(
      'loStatSortOrder',
      sortOrder.map((type) => statHashes[type])
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
        <div
          className={styles.assumeMasterwork}
          title={t('LoadoutBuilder.AssumeMasterworkDetailed')}
        >
          <CheckButton
            name="lo-assume-masterwork"
            checked={assumeMasterwork}
            onChange={(checked) => setSetting('loAssumeMasterwork', checked)}
          >
            {t('LoadoutBuilder.AssumeMasterwork')}
          </CheckButton>
        </div>
      </div>
    </div>
  );
}
