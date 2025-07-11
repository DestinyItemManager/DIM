import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import ExoticArmorChoice, { getLockedExotic } from 'app/loadout-builder/filter/ExoticArmorChoice';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, equalsIcon, greaterThanIcon, lessThanIcon, searchIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { MAX_STAT } from '../known-values';
import { includesRuntimeStatMods } from '../stats';
import styles from './LoadoutParametersDisplay.m.scss';

export function hasVisibleLoadoutParameters(params: LoadoutParameters | undefined) {
  return Boolean(
    params &&
      (params.query ||
        params.exoticArmorHash ||
        params.statConstraints?.length ||
        (params.mods &&
          includesRuntimeStatMods(params.mods) &&
          (params.includeRuntimeStatBenefits ?? true))),
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
  return (
    <span className={clsx(className, styles.constraintRange)}>
      <StatConstraintRangeExpression statConstraint={statConstraint} />
    </span>
  );
}

/** This displays the user's chosen stat constraint as a range, e.g. T4-T9 */
function StatConstraintRangeExpression({ statConstraint }: { statConstraint: StatConstraint }) {
  // Post-Edge of Fate stat constraints use minStat/maxStat instead of minTier/maxTier.
  const min =
    statConstraint.minStat ??
    (statConstraint.minTier !== undefined ? statConstraint.minTier * 10 : 0);
  const max =
    statConstraint.maxStat ??
    (statConstraint.maxTier !== undefined ? statConstraint.maxTier * 10 : MAX_STAT);

  if (min === max) {
    // =min
    return (
      <>
        <AppIcon icon={equalsIcon} />
        {min}
      </>
    );
  } else if (max === MAX_STAT) {
    // >= min
    return (
      <>
        <AppIcon icon={greaterThanIcon} />
        {min}
      </>
    );
  } else if (min === 0) {
    // <= max
    return (
      <>
        <AppIcon icon={lessThanIcon} />
        {max}
      </>
    );
  } else {
    // min-max
    return (
      <>
        {min}-{max}
      </>
    );
  }
}
