import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { getDefaultPlugHash } from '../mod-utils';
import Mod from './Mod';
import styles from './Sockets.m.scss';

const undesirablePlugs = [
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.Shader,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance1,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance3,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance4,
];

interface Props {
  item: DimItem;
  lockedMods?: PluggableInventoryItemDefinition[];
  size?: 'small';
  onSocketClick?(
    plugDef: PluggableInventoryItemDefinition,
    /** An allow-list of plug category hashes that can be inserted into this socket */
    // TODO: why not just pass the socketType hash or socket definition?
    plugCategoryHashWhitelist: number[]
  ): void;
}

/**
 * Show sockets (mod slots) for an armor item with the specified locked mods slotted into
 */
function Sockets({ item, lockedMods, size, onSocketClick }: Props) {
  const defs = useD2Definitions()!;
  if (!item.sockets) {
    return null;
  }

  // A list of mods to show. If we aren't showing a plug for a socket we show the empty plug.
  const modsAndWhitelist: { plugDef: PluggableInventoryItemDefinition; whitelist: number[] }[] = [];
  const modsToUse = lockedMods ? [...lockedMods] : [];

  for (const socket of item.sockets?.allSockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined;

    for (let modIndex = 0; modIndex < modsToUse.length; modIndex++) {
      const mod = modsToUse[modIndex];
      if (
        socketType.plugWhitelist.some((plug) => plug.categoryHash === mod.plug.plugCategoryHash)
      ) {
        toSave = mod;
        modsToUse.splice(modIndex, 1);
        break;
      }
    }

    if (!toSave) {
      const plugHash = getDefaultPlugHash(socket, defs);
      if (plugHash) {
        toSave = defs.InventoryItem.get(plugHash);
      }
    }

    if (
      toSave &&
      isPluggableItem(toSave) &&
      !undesirablePlugs.includes(toSave.plug.plugCategoryHash) &&
      toSave.itemTypeDisplayName // account for plugs that look exotic-ish but are nothings
    ) {
      modsAndWhitelist.push({
        plugDef: toSave,
        whitelist: socketType.plugWhitelist.map((plug) => plug.categoryHash),
      });
    }
  }

  return (
    <div className={clsx(styles.lockedItems, { [styles.small]: size === 'small' })}>
      {modsAndWhitelist.map(({ plugDef, whitelist }, index) => (
        <Mod
          key={index}
          gridColumn={(index % 2) + 1}
          plugDef={plugDef}
          onClick={onSocketClick ? () => onSocketClick(plugDef, whitelist) : undefined}
        />
      ))}
    </div>
  );
}

export default Sockets;
