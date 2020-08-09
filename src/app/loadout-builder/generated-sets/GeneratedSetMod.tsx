import React from 'react';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getModCostInfo } from 'app/collections/Mod';
import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import clsx from 'clsx';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

interface Props {
  plugDef: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  gridColumn: number;
  onClick(): void;
}

function GeneratedSetMod({ plugDef, defs, gridColumn, onClick }: Props) {
  const { energyCost, energyCostElementOverlay } = getModCostInfo(plugDef, defs);

  const classes = {
    item: true,
    perk: plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics,
  };

  return (
    <div
      className={clsx(classes)}
      style={{ gridColumn }}
      title={plugDef.displayProperties.name}
      tabIndex={0}
      onClick={onClick}
    >
      <BungieImage className="item-img" src={plugDef.displayProperties.icon} />
      {energyCostElementOverlay && (
        <>
          <div
            style={bungieBackgroundStyle(energyCostElementOverlay)}
            className="energyCostOverlay"
          />
          <div className="energyCost">{energyCost}</div>
        </>
      )}
    </div>
  );
}

export default GeneratedSetMod;
