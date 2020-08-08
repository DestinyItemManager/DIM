import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import { LockedArmor2Mod } from '../types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import GeneratedSetMod from './GeneratedSetMod';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

const undesireablePlugs = [
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.Shader,
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance1,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance3,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance4,
];

interface Props {
  item: DimItem;
  lockedMods: LockedArmor2Mod[];
  defs: D2ManifestDefinitions;
}

function GeneratedSetSockets({ item, lockedMods, defs }: Props) {
  if (!item.isDestiny2()) {
    return null;
  }

  const modsAndPerks: DestinyInventoryItemDefinition[] = [];
  const modsToUse = [...lockedMods];

  for (const socket of item.sockets?.sockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined;

    for (let modIndex = 0; modIndex < modsToUse.length; modIndex++) {
      const mod = modsToUse[modIndex].mod;
      if (
        socketType.plugWhitelist.some((plug) => plug.categoryHash === mod.plug.plugCategoryHash)
      ) {
        toSave = mod;
        modsToUse.splice(modIndex, 1);
      }
    }

    if (!toSave) {
      toSave = defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
    }

    if (toSave && !undesireablePlugs.includes(toSave.plug.plugCategoryHash)) {
      modsAndPerks.push(toSave);
    }
  }

  return (
    <div className={'lockedItems'}>
      {modsAndPerks.map((plug, index) => (
        <GeneratedSetMod key={index} gridColumn={(index % 2) + 1} modDef={plug} defs={defs} />
      ))}
    </div>
  );
}

export default GeneratedSetSockets;
