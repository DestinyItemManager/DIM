import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import ExoticArmorChoice, { getLockedExotic } from 'app/loadout-builder/filter/ExoticArmorChoice';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, equalsIcon, greaterThanIcon, lessThanIcon, searchIcon } from 'app/shell/icons';
import clsx from 'clsx';
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
              <StatConstraintRange statConstraint={s} />
            </div>
          ))}
        </PressTip>
      )}
    </div>
  );
}

function StatConstraintRange({
  statConstraint,
  className,
}: {
  statConstraint: StatConstraint;
  className?: string;
}) {
  className = clsx(className, styles.constraintRange);

  return (
    <span className={className}>
      <StatConstraintRangeExpression statConstraint={statConstraint} />
    </span>
  );
}

function StatConstraintRangeExpression({ statConstraint }: { statConstraint: StatConstraint }) {
  const min = statConstraint.minTier ?? 0;
  const max = statConstraint.maxTier ?? 10;

  if (min === max) {
    // =Tmin
    return (
      <>
        <AppIcon icon={equalsIcon} />
        {t('LoadoutBuilder.TierNumber', {
          tier: min,
        })}
      </>
    );
  } else if (max === 10) {
    // >= Tmin
    return (
      <>
        <AppIcon icon={greaterThanIcon} />
        {t('LoadoutBuilder.TierNumber', {
          tier: min,
        })}
      </>
    );
  } else if (min === 0) {
    // <= Tmax
    return (
      <>
        <AppIcon icon={lessThanIcon} />
        {t('LoadoutBuilder.TierNumber', {
          tier: max,
        })}
      </>
    );
  } else {
    // Tmin-Tmax
    return (
      <>
        {`${t('LoadoutBuilder.TierNumber', {
          tier: min,
        })}-${max}`}
      </>
    );
  }
}
