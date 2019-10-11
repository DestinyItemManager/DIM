import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item } from '../inventory/item-types';
import './EnergyMeter.scss';
import { t } from 'app/i18next-t';
import React from 'react';
import ElementIcon from 'app/inventory/ElementIcon';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

export const energyCapacityTypeNames: {
  [key in DestinyEnergyType]: 'arc' | 'solar' | 'void' | null;
} = {
  [DestinyEnergyType.Any]: null,
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void'
};

export default function EnergyMeter({ defs, item }: { defs: D2ManifestDefinitions; item: D2Item }) {
  if (!item.energy) {
    return null;
  }
  const energyCapacityElement = energyCapacityTypeNames[item.energy.energyType] || null;

  // layer in possible total slots, then earned slots, then currently used slots
  const meterIncrements = Array(10)
    .fill('disabled')
    .fill('unused', 0, item.energy.energyCapacity)
    .fill('used', 0, item.energy.energyUsed);

  return (
    defs && (
      <div className="energymeter">
        <div className="item-socket-category-name">
          <div>
            <b>{item.energy.energyCapacity}</b> <span>{t('EnergyMeter.Energy')}</span>
          </div>
        </div>
        <div className={`inner-energymeter ${energyCapacityElement}`}>
          <div className="energymeter-icon">
            {energyCapacityElement && <ElementIcon element={energyCapacityElement} />}
          </div>
          {meterIncrements.map((incrementStyle, i) => (
            <div key={i} className={`energymeter-increments ${incrementStyle}`} />
          ))}
        </div>
      </div>
    )
  );
}
