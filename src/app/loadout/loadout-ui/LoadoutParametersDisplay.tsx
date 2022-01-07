import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { SelectedArmorUpgrade } from 'app/loadout-builder/filter/ArmorUpgradePicker';
import ExoticArmorChoice from 'app/loadout-builder/filter/ExoticArmorChoice';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, searchIcon } from 'app/shell/icons';
import React from 'react';
import styles from './LoadoutParametersDisplay.m.scss';

export default function LoadoutParametersDisplay({ params }: { params: LoadoutParameters }) {
  const defs = useD2Definitions()!;
  const { query, exoticArmorHash, upgradeSpendTier, statConstraints, lockItemEnergyType } = params;
  const show =
    params.query ||
    params.exoticArmorHash ||
    params.upgradeSpendTier !== undefined ||
    params.statConstraints?.some((s) => s.maxTier !== undefined || s.minTier !== undefined);
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
      {exoticArmorHash && (
        <div className={styles.loExotic}>
          <ExoticArmorChoice lockedExoticHash={exoticArmorHash} />
        </div>
      )}
      {upgradeSpendTier !== undefined && (
        <div className={styles.loSpendTier}>
          <SelectedArmorUpgrade
            defs={defs}
            upgradeSpendTier={upgradeSpendTier}
            lockItemEnergyType={lockItemEnergyType ?? false}
          />
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
