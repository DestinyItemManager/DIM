import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item } from '../inventory/item-types';
import './EnergyMeter.scss';
import { t } from 'app/i18next-t';
import React from 'react';
import ElementIcon from 'app/inventory/ElementIcon';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

const energyCapacityTypeNames: { [key in DestinyEnergyType]: 'arc' | 'solar' | 'void' | null } = {
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void',
  [DestinyEnergyType.Any]: null
};

export default function EnergyMeter({ defs, item }: { defs: D2ManifestDefinitions; item: D2Item }) {
  if (!item.energy) {
    return null;
  }
  const energyCapacityElement = energyCapacityTypeNames[item.energy.energyType] || null;

  // layer in all possible, then all, then used; on a 1-indexed array for easy math
  const meterIncrements = Array(11)
    .fill('disabled')
    .fill('unused', 0, item.energy.energyCapacity)
    .fill('used', 0, item.energy.energyUsed)
    .slice(1);

  return (
    defs && (
      <div className="energymeter">
        <div className={`energymeter-labels ${item.dmg}`}>
          <div>
            {/* why no defs.EnergyType ? {defs.Vendor.get(item.energy.energyTypeHash).displayProperties.icon}*/}
            {energyCapacityElement && <ElementIcon element={energyCapacityElement} />}
            <span>{item.energy.energyCapacity}</span>
            <span>{t('EnergyMeter.Energy')}</span>
          </div>
          <div>
            <span>{t('EnergyMeter.Unused')}</span>
            <span>{item.energy.energyUnused}</span>
          </div>
        </div>
        <div className={`energymeter-masterwork ${item.dmg}`}>M</div>
        {meterIncrements.map((incrementStyle, i) => (
          <div key={i} className={`energymeter-increments ${incrementStyle}`} />
        ))}
      </div>
    )
  );
}
