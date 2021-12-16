import 'app/dim-ui/EnergyMeterIncrements.scss';
import { DimItem } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';

export const energyStyles: { [energy in DestinyEnergyType]?: string } = {
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void',
  [DestinyEnergyType.Stasis]: 'stasis',
} as const;

export function EnergyIncrements({ item }: { item: DimItem }) {
  const { energyCapacity, energyUsed, energyType } = item.energy!;
  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array<string>(10)
    .fill('unavailable')
    .fill('unused', 0, energyCapacity)
    .fill('used', 0, energyUsed);
  return (
    <div className={clsx('energyMeterIncrements', 'small', energyStyles[energyType])}>
      {meterIncrements.map((incrementStyle, i) => (
        <div key={i} className={incrementStyle} />
      ))}
    </div>
  );
}
