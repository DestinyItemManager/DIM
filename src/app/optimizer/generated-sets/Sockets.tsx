import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { LockedMod } from '../types';
import Mod from './Mod';
import styles from './Sockets.m.scss';

const undesireablePlugs = [
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.Shader,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance1,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance3,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance4,
];

interface Props {
  item: DimItem;
  lockedMods?: LockedMod[];
  defs: D2ManifestDefinitions;
  onSocketClick?(plugDef: PluggableInventoryItemDefinition, whitelist: number[]): void;
}

function Sockets({ item, lockedMods, defs, onSocketClick }: Props) {
  if (!item.sockets) {
    return null;
  }

  const modsAndWhitelist: { plugDef: PluggableInventoryItemDefinition; whitelist: number[] }[] = [];
  const modsToUse = lockedMods ? [...lockedMods] : [];

  for (const socket of item.sockets?.allSockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined;

    for (let modIndex = 0; modIndex < modsToUse.length; modIndex++) {
      const mod = modsToUse[modIndex].modDef;
      if (
        socketType.plugWhitelist.some((plug) => plug.categoryHash === mod.plug.plugCategoryHash)
      ) {
        toSave = mod;
        modsToUse.splice(modIndex, 1);
      }
    }

    if (!toSave && socket.socketDefinition.singleInitialItemHash) {
      toSave = defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
    }

    if (
      toSave &&
      isPluggableItem(toSave) &&
      !undesireablePlugs.includes(toSave.plug.plugCategoryHash)
    ) {
      modsAndWhitelist.push({
        plugDef: toSave,
        whitelist: socketType.plugWhitelist.map((plug) => plug.categoryHash),
      });
    }
  }

  return (
    <>
      <div className={styles.lockedItems}>
        {modsAndWhitelist.map(({ plugDef, whitelist }, index) => (
          <Mod
            key={index}
            gridColumn={(index % 2) + 1}
            plugDef={plugDef}
            defs={defs}
            onClick={onSocketClick ? () => onSocketClick?.(plugDef, whitelist) : undefined}
          />
        ))}
      </div>
    </>
  );
}

export default Sockets;
