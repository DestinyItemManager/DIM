import { t } from 'app/i18next-t';
import { statTier } from 'app/loadout-builder/utils';
import React from 'react';
import styles from './StatTooltip.m.scss';

interface Stat {
  hash: number;
  name: string;
  value: number;
  description: string;
}

function StatTooltip({ stat }: { stat: Stat }) {
  const tier = statTier(stat.value);

  return (
    <div>
      <div className={styles.name}>{stat.name}</div>
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      <div className={styles.description}>{stat.description}</div>
    </div>
  );
}

export default StatTooltip;
