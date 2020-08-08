import React from 'react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getModCostInfo } from 'app/collections/Mod';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import clsx from 'clsx';

interface Props {
  modDef: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  gridColumn: number;
}

function GeneratedSetMod({ modDef, defs, gridColumn }: Props) {
  const { energyCost, energyCostElementOverlay } = getModCostInfo(modDef, defs);

  const classes = {
    item: true,
    perk: modDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics,
  };

  return (
    <div
      className={clsx(classes)}
      style={{ gridColumn }}
      title={modDef.displayProperties.name}
      tabIndex={0}
    >
      <BungieImage className="item-img" src={modDef.displayProperties.icon} />
      {energyCostElementOverlay && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(energyCostElementOverlay)}")` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{energyCost}</div>
        </>
      )}
    </div>
  );
}

export default GeneratedSetMod;
