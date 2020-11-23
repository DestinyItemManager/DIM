import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { LockedArmor2Mod, ModPickerCategory } from '../types';
import { getModPickerCategoryFromPlugCategoryHash } from '../utils';
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

interface PlugAndCategory {
  plugDef: PluggableInventoryItemDefinition;
  category?: ModPickerCategory;
}

interface Props {
  item: DimItem;
  lockedMods?: LockedArmor2Mod[];
  defs: D2ManifestDefinitions;
  onSocketClick?(plugDef: PluggableInventoryItemDefinition, category?: ModPickerCategory): void;
}

function Sockets({ item, lockedMods, defs, onSocketClick }: Props) {
  if (!item.sockets) {
    return null;
  }

  const modsAndPerks: PlugAndCategory[] = [];
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
      modsAndPerks.push({
        plugDef: toSave,
        category: getModPickerCategoryFromPlugCategoryHash(toSave.plug.plugCategoryHash),
      });
    }
  }

  return (
    <>
      <div className={styles.lockedItems}>
        {modsAndPerks.map(({ plugDef, category }, index) => (
          <Mod
            key={index}
            gridColumn={(index % 2) + 1}
            plugDef={plugDef}
            defs={defs}
            onClick={onSocketClick ? () => onSocketClick?.(plugDef, category) : undefined}
          />
        ))}
      </div>
    </>
  );
}

export default Sockets;
