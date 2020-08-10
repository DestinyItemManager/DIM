/* eslint-disable @typescript-eslint/prefer-optional-chain */
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import '../progress/milestone.scss';
import { D2Item } from 'app/inventory/item-types';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import {
  DestinyEnergyTypeDefinition,
  DestinyInventoryItemDefinition,
} from 'bungie-api-ts/destiny2';

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

  const { energyCost, energyCostElementOverlay } = getModCostInfo(item.hash, defs);

  return (
    <div>
      <ConnectedInventoryItem
        item={item}
        allowFilter={allowFilter}
        innerRef={innerRef}
        onClick={onClick}
      />
      {children}
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

/**
 * given a mod definition or hash, returns destructurable energy cost information
 */
export function getModCostInfo(
  mod: DestinyInventoryItemDefinition | number,
  defs: D2ManifestDefinitions
) {
  const modCostInfo: {
    energyCost?: number;
    energyCostElement?: DestinyEnergyTypeDefinition;
    energyCostElementOverlay?: string;
  } = {};

  if (typeof mod === 'number') {
    mod = defs.InventoryItem.get(mod);
  }

  if (mod?.plug) {
    modCostInfo.energyCost = mod.plug.energyCost?.energyCost;

    if (mod.plug.energyCost?.energyTypeHash) {
      modCostInfo.energyCostElement = defs.EnergyType.get(mod.plug.energyCost.energyTypeHash);
    }
    if (modCostInfo.energyCostElement?.costStatHash) {
      modCostInfo.energyCostElementOverlay = defs.Stat.get(
        modCostInfo.energyCostElement.costStatHash
      )?.displayProperties.icon;
    }
  }
  return modCostInfo;
}
