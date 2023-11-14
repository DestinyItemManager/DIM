import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import ExoticArmorChoice, { getLockedExotic } from 'app/loadout-builder/filter/ExoticArmorChoice';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { includesRuntimeStatMods } from '../stats';
import styles from './LoadoutParametersDisplay.m.scss';

export function hasVisibleLoadoutParameters(params: LoadoutParameters | undefined) {
  return (
    params &&
    (params.query ||
      params.exoticArmorHash ||
      params.statConstraints?.some((s) => s.maxTier !== undefined || s.minTier !== undefined) ||
      (params.mods &&
        includesRuntimeStatMods(params.mods) &&
        (params.includeRuntimeStatBenefits ?? true)))
  );
}

export default function LoadoutParametersDisplay({ params }: { params: LoadoutParameters }) {
  const defs = useD2Definitions()!;
  const { query, exoticArmorHash, statConstraints } = params;
  const show = hasVisibleLoadoutParameters(params);
  if (!show) {
    return null;
  }
  const lbParamDesc = (str: string) => `${t('Loadouts.LoadoutParameters')} – ${str}`;

  return (
    <div className={styles.loParams}>
      {query && (
        <PressTip
          className={styles.loQuery}
          tooltip={() => lbParamDesc(t('Loadouts.LoadoutParametersQuery'))}
        >
          <AppIcon icon={searchIcon} />
          {query}
        </PressTip>
      )}
      {exoticArmorHash !== undefined && (
        <PressTip
          className={styles.loExotic}
          tooltip={() => {
            const [, exoticName] = getLockedExotic(defs, exoticArmorHash);
            return lbParamDesc(t('Loadouts.LoadoutParametersExotic', { exoticName: exoticName! }));
          }}
        >
          <ExoticArmorChoice lockedExoticHash={exoticArmorHash} />
        </PressTip>
      )}
      {params.mods &&
        includesRuntimeStatMods(params.mods) &&
        (params.includeRuntimeStatBenefits ?? true) && (
          <PressTip tooltip={t('Loadouts.IncludeRuntimeStatBenefitsDesc')}>
            {t('Loadouts.IncludeRuntimeStatBenefits')}
          </PressTip>
        )}
      {statConstraints && (
        <PressTip
          className={styles.loStats}
          tooltip={() => lbParamDesc(t('Loadouts.LoadoutParametersStats'))}
        >
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
                `${t('LoadoutBuilder.TierNumber', {
                  tier: 10,
                })}-`
              )}
            </div>
          ))}
        </PressTip>
      )}
    </div>
  );
}
