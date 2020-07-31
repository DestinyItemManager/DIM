import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item } from '../inventory/item-types';
import './EnergyMeter.scss';
import { t } from 'app/i18next-t';
import React from 'react';
import ElementIcon from 'app/inventory/ElementIcon';
import { energyNamesByEnum } from 'app/search/d2-known-values';

export default function EnergyMeter({ defs, item }: { defs: D2ManifestDefinitions; item: D2Item }) {
  if (!item.energy) {
    return null;
  }
  const energyTypeHash = item.energy?.energyTypeHash;
  const energyType = (energyTypeHash !== undefined && defs.EnergyType.get(energyTypeHash)) || null;
  const energyCapacityElementClass = energyNamesByEnum[item.energy.energyType] || null;

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
        <div className={`inner-energymeter ${energyCapacityElementClass}`}>
          <div className="energymeter-icon">{<ElementIcon element={energyType} />}</div>
          {meterIncrements.map((incrementStyle, i) => (
            <div key={i} className={`energymeter-increments ${incrementStyle}`} />
          ))}
        </div>
      </div>
    )
  );
}
