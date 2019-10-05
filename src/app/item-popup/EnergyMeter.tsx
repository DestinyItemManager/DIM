import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item } from '../inventory/item-types';
import './EnergyMeter.scss';
import { t } from 'app/i18next-t';

export default function EnergyMeter({ defs, item }: { defs: D2ManifestDefinitions; item: D2Item }) {
  if (!item.energy) {
    return null;
  }
  // layer in all possible, then all, then used; on a 1-indexed array for easy math
  const meterIncrements = Array(11)
    .fill('disabled')
    .fill('unused', 0, item.energy.capacity)
    .fill('used', 0, item.energy.used)
    .slice(1);

  return (
    <div className="energymeter">
      <div className={`energymeter-labels ${item.dmg}`}>
        <div>
          {/* why no defs.EnergyType ?*/}
          <div>{defs.Vendor.get(item.energy.typehash).displayProperties.icon}</div>
          <div>{item.energy.capacity}</div>
          <div>{t('EnergyMeter.Energy')}</div>
        </div>
        <div>
          <div>{t('EnergyMeter.Unused')}</div>
          <div>{item.energy.unused}</div>
        </div>
      </div>
      <div className={`energymeter-masterwork ${item.dmg}`}>M</div>
      <div className="energymeter-increments">
        {meterIncrements.map((incrementStyle, i) => (
          <div key={i} className={incrementStyle} />
        ))}
      </div>
    </div>
  );
}
