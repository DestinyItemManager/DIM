import { Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimCharacterStatChange } from 'app/inventory/store-types';
import { statTier } from 'app/loadout-builder/utils';
import styles from './StatTooltip.m.scss';

interface Stat {
  hash: number;
  name: string;
  value: number;
  description: string;
  breakdown?: DimCharacterStatChange[];
}

function StatTooltip({ stat }: { stat: Stat }) {
  const tier = statTier(stat.value);

  return (
    <div>
      <Tooltip.Header text={stat.name} />
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      <hr />
      <div>{stat.description}</div>
      {stat.breakdown?.some((contribution) => contribution.source !== 'armorStats') && (
        <>
          <hr />
          {stat.breakdown.map((contribution) => (
            <div key={contribution.hash} className={styles.values}>
              <div className={styles.label}>
                {contribution.source !== 'armorStats' &&
                  contribution.source !== 'subclassPlug' &&
                  `${contribution.count}x`}
                {contribution.icon && <img className={styles.icon} src={contribution.icon} />}
                {contribution.name}
              </div>
              <div>
                {contribution.source !== 'armorStats' && contribution.value > 0 ? '+' : ''}
                {contribution.value}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default StatTooltip;
