import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import exoticsWithoutCatalysts from 'data/d2/exotics-without-catalysts.json';
import { DimCatalyst, DimItem } from '../item-types';

export function buildCatalystInfo(
  createdItem: DimItem,
  itemDef: DestinyInventoryItemDefinition
): DimCatalyst | undefined {
  if (createdItem.equippingLabel !== 'exotic_weapon') {
    return undefined;
  }

  if (exoticsWithoutCatalysts.includes(createdItem.hash)) {
    return undefined;
  }

  const catalystSocket = Boolean(
    itemDef.sockets?.socketEntries.filter((s) => s.singleInitialItemHash === 1498917124)
  );

  const objectives = itemDef.objectives?.objectiveHashes ? itemDef.objectives.objectiveHashes : [];

  if (objectives.length === 0 && !catalystSocket) {
    return undefined;
  }

  const complete = Boolean(createdItem.masterwork);

  // const progress = 0;

  return { hasCatalyst: true, complete: complete };
}
