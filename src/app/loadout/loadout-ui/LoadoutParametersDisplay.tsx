import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ExoticArmorChoice from 'app/loadout-builder/filter/ExoticArmorChoice';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, searchIcon } from 'app/shell/icons';
import styles from './LoadoutParametersDisplay.m.scss';

export function hasVisibleLoadoutParameters(params: LoadoutParameters | undefined) {
  return (
    params &&
    (params.query ||
      params.exoticArmorHash ||
      params.statConstraints?.some((s) => s.maxTier !== undefined || s.minTier !== undefined))
  );
}

export default function LoadoutParametersDisplay({ params }: { params: LoadoutParameters }) {
  const defs = useD2Definitions()!;
  const { query, exoticArmorHash, statConstraints } = params;
  const show = hasVisibleLoadoutParameters(params);
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
      {Boolean(exoticArmorHash) && (
        <div className={styles.loExotic}>
          <ExoticArmorChoice lockedExoticHash={exoticArmorHash} />
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
