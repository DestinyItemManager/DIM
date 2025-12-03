import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getEnergyUpgradeHashes, sumModCosts } from 'app/inventory/store/energy';
import { EnergySwap } from 'app/loadout-builder/generated-sets/GeneratedSetItem';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import Cost from 'app/vendors/Cost';
import clsx from 'clsx';
import * as styles from './EnergyIncrements.m.scss';
import { PressTip } from './PressTip';

// TODO special display for T10 -> T10 + exotic artifice?

/** this accepts either an item, or a partial DimItem.energy */
function EnergyIncrements({
  item,
  energy,
}:
  | { item: DimItem; energy?: undefined }
  | {
      item?: undefined;
      energy: {
        energyCapacity: number;
        energyUsed: number;
      };
    }) {
  const { energyCapacity, energyUsed } = item?.energy ?? energy!;
  return (
    <EnergyMeterIncrements
      energyCapacity={energyCapacity}
      energyUsed={energyUsed}
      variant="small"
    />
  );
}

export function EnergyMeterIncrements({
  energyCapacity,
  energyUsed,
  minCapacity,
  previewUpgrade,
  variant,
}: {
  energyCapacity: number;
  energyUsed: number;
  minCapacity?: number;
  previewUpgrade?: (i: number) => void;
  variant: 'medium' | 'small';
}) {
  // This works because Tier 5 armor with 11 energy drops with all energy unlocked.
  const maxEnergyCapacity = Math.max(10, energyCapacity);
  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array<string | undefined>(maxEnergyCapacity)
    .fill(styles.unavailable)
    .fill(undefined, 0, energyCapacity)
    .fill(styles.used, 0, energyUsed);
  return (
    <div className={clsx(styles.energyMeterIncrements, { [styles.medium]: variant === 'medium' })}>
      {meterIncrements.map((incrementStyle, i) => (
        <div
          key={i}
          className={incrementStyle}
          role={minCapacity !== undefined && i + 1 > minCapacity ? 'button' : undefined}
          onClick={previewUpgrade ? () => previewUpgrade(i + 1) : undefined}
        />
      ))}
    </div>
  );
}

export function EnergyIncrementsWithPresstip({
  energy,
  wrapperClass,
  item,
}: {
  energy: {
    energyCapacity: number;
    energyUsed: number;
  };
  wrapperClass?: string | undefined;
  item: DimItem;
}) {
  const { energyCapacity, energyUsed } = energy;
  const energyUnused = Math.max(energyCapacity - energyUsed, 0);

  const defs = useD2Definitions()!;
  if (!item.energy) {
    return null;
  }

  const energyModHashes = getEnergyUpgradeHashes(item, energyUsed || 0);
  const costs = sumModCosts(
    defs,
    energyModHashes.map((h) => defs.InventoryItem.get(h)),
  ).sort(compareBy((c) => c.quantity));

  return (
    <PressTip
      tooltip={
        <>
          {t('EnergyMeter.Energy')}
          <hr />
          {t('EnergyMeter.Used')}: {energyUsed}
          <br />
          {t('EnergyMeter.Unused')}: {energyUnused}
          {energyUsed > energyCapacity && (
            <>
              <hr />
              {t('EnergyMeter.UpgradeNeeded', energy)}
            </>
          )}
          {costs.length > 0 && (
            <>
              <hr />
              <div className={styles.costs}>
                <span>{t('Loadouts.ModPlacement.UpgradeCosts')}</span>
                {costs.map((cost) => (
                  <Cost key={cost.itemHash} cost={cost} className={styles.cost} />
                ))}
              </div>
            </>
          )}
        </>
      }
      className={wrapperClass}
    >
      <EnergyIncrements
        energy={{
          energyCapacity,
          energyUsed,
        }}
      />
      {energyUsed > energyCapacity && <EnergySwap energy={energy} />}
    </PressTip>
  );
}
