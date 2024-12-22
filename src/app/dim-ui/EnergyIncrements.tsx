import 'app/dim-ui/EnergyMeterIncrements.scss';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { EnergySwap } from 'app/loadout-builder/generated-sets/GeneratedSetItem';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import clsx from 'clsx';
import styles from './EnergyIncrements.m.scss';
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
  handleHoverStart,
  handleHoverEnd,
  previewUpgrade,
  variant,
}: {
  energyCapacity: number;
  energyUsed: number;
  handleHoverStart?: (i: number) => void;
  handleHoverEnd?: () => void;
  previewUpgrade?: (i: number) => void;
  variant: 'medium' | 'small';
}) {
  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array<string>(MAX_ARMOR_ENERGY_CAPACITY)
    .fill(styles.unavailable)
    .fill(styles.unused, 0, energyCapacity)
    .fill(styles.used, 0, energyUsed);
  return (
    <div
      className={clsx(
        styles.energyMeterIncrements,
        variant === 'medium' ? styles.medium : styles.small,
      )}
    >
      {meterIncrements.map((incrementStyle, i) => (
        <div
          key={i}
          className={incrementStyle}
          role={handleHoverStart && i + 1 > energyCapacity ? 'button' : undefined}
          onPointerEnter={handleHoverStart ? () => handleHoverStart(i + 1) : undefined}
          onPointerLeave={handleHoverEnd}
          onClick={previewUpgrade ? () => previewUpgrade(i + 1) : undefined}
        />
      ))}
    </div>
  );
}

export function EnergyIncrementsWithPresstip({
  energy,
  wrapperClass,
}: {
  energy: {
    energyCapacity: number;
    energyUsed: number;
  };
  wrapperClass?: string | undefined;
}) {
  const { energyCapacity, energyUsed } = energy;
  const energyUnused = Math.max(energyCapacity - energyUsed, 0);

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
