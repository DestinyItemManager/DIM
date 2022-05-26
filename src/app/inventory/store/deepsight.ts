import { socketContainsPlugWithCategory } from 'app/utils/socket-utils';
import { DestinyInventoryItemDefinition, DestinyItemComponent } from 'bungie-api-ts/destiny2';
import { resonantElementTagsByObjectiveHash } from 'data/d2/crafting-resonant-elements';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimDeepsight, DimItem, DimSocket } from '../item-types';

export const resonantElementObjectiveHashes = Object.keys(resonantElementTagsByObjectiveHash).map(
  (objectiveHashStr) => parseInt(objectiveHashStr, 10)
);

export function buildDeepsightInfo(
  item: DimItem,
  itemComponent: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition
): DimDeepsight | null {
  const resonanceSocket = getResonanceSocket(item);
  if (!resonanceSocket || !resonanceSocket.plugged?.plugObjectives) {
    return null;
  }

  // A heuristic for what tooltips deepsight weapons have - right now if a
  // pattern can be extracted then the first tooltip index is "pattern can be
  // extracted".
  const extractPattern =
    itemDef.tooltipNotifications.length === 3 &&
    itemDef.tooltipNotifications[0].displayStyle === 'ui_display_style_info' &&
    itemComponent.tooltipNotificationIndexes[0] === 0;

  const attunementObjective = resonanceSocket.plugged.plugObjectives[0];
  return {
    complete: attunementObjective?.complete,
    progress: attunementObjective?.progress
      ? attunementObjective.progress / attunementObjective.completionValue
      : 0,
    extractPattern,
  };
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return item.sockets.allSockets.find(isDeepsightResonanceSocket);
  }
}

export function isDeepsightResonanceSocket(socket: DimSocket): boolean {
  return Boolean(
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.CraftingPlugsWeaponsModsMemories) &&
      socket.plugged.plugDef.objectives
  );
}
