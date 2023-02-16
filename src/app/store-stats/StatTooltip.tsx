import { Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { statTier } from 'app/loadout-builder/utils';
import styles from './StatTooltip.m.scss';

interface Stat {
  hash: number;
  name: string;
  value: number;
  description: string;
}

function StatTooltip({ stat }: { stat: Stat }) {
  const tier = statTier(stat.value, 10);

  return (
    <div>
      <Tooltip.Header text={stat.name} />
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      <hr />
      <div>{stat.description}</div>
    </div>
  );
}

export default StatTooltip;
