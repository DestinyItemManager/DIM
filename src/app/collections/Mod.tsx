import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import '../progress/milestone.scss';
import { D2Item } from 'app/inventory/item-types';
import { bungieNetPath } from 'app/dim-ui/BungieImage';

interface ModProps {
  item: D2Item;
  defs: D2ManifestDefinitions;
  children?: React.ReactNode;
  allowFilter?: boolean;
  innerRef?;
  onClick?;
}

/** displays a mod image + its energy cost amount & element */
export default function Mod({ item, defs, allowFilter, innerRef, onClick, children }: ModProps) {
  if (!item) {
    return null;
  }

  const modDef = defs.InventoryItem.get(item.hash);
  const energyType = defs.EnergyType.get(modDef?.plug.energyCost?.energyTypeHash);
  const energyCostStat = defs.Stat.get(energyType?.costStatHash);
  const costElementIcon = energyCostStat?.displayProperties.icon;

  return (
    <div>
      <ConnectedInventoryItem
        item={item}
        allowFilter={allowFilter}
        innerRef={innerRef}
        onClick={onClick}
      />
      {children}
      {costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(costElementIcon)}")` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{modDef.plug.energyCost.energyCost}</div>
        </>
      )}
    </div>
  );
}
