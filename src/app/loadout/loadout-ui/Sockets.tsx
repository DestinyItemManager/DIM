import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { modTypeTagByPlugCategoryHash } from 'app/search/specialty-modslots';
import { isEventArmorRerollSocket } from 'app/utils/socket-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { pickPlugPositions } from '../mod-assignment-utils';
import PlugDef from './PlugDef';
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
  automaticallyPickedMods?: number[];
  size?: 'small';
  onSocketClick?: (
    plugDef: PluggableInventoryItemDefinition,
    /** An allow-list of plug category hashes that can be inserted into this socket */
    // TODO: why not just pass the socketType hash or socket definition?
    plugCategoryHashWhitelist: number[]
  ) => void;
}

/**
 * Show sockets (mod slots) for a loadout armor item with the specified locked mods slotted into it.
 */
function Sockets({ item, lockedMods, size, onSocketClick, automaticallyPickedMods }: Props) {
  const defs = useD2Definitions()!;
  if (!item.sockets) {
    return null;
  }

  // A list of mods to show. If we aren't showing a plug for a socket we show the empty plug.
  const modsAndWhitelist: {
    plugDef: PluggableInventoryItemDefinition;
    whitelist: number[];
    automaticallyPicked: boolean;
  }[] = [];
  const modsToUse = lockedMods ? [...lockedMods] : [];

  const assignments = pickPlugPositions(defs, item, modsToUse);
  const autoMods = automaticallyPickedMods?.slice();

  for (const socket of item.sockets?.allSockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined = assignments.find(
      (a) => a.socketIndex === socket.socketIndex
    )?.mod;

    const modIdx = (toSave && autoMods?.findIndex((m) => m === toSave!.hash)) ?? -1;
    const automaticallyPicked = modIdx !== -1;
    if (automaticallyPicked) {
      autoMods!.splice(modIdx, 1);
    }

    if (!toSave) {
      const plugHash =
        socket.plugged &&
        (socket.emptyPlugItemHash ||
          (socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics &&
            socket.plugged.plugDef.hash));
      if (plugHash) {
        toSave = defs.InventoryItem.get(plugHash);
      }
    }

    if (
      toSave &&
      isPluggableItem(toSave) &&
      !undesirablePlugs.includes(toSave.plug.plugCategoryHash) &&
      !isEventArmorRerollSocket(socket) &&
      // account for plugs that look exotic-ish but are nothings
      // but always include specialty mod slots, Vow mods don't have
      // an itemTypeDisplayName https://github.com/Bungie-net/api/issues/1620
      (toSave.itemTypeDisplayName ||
        modTypeTagByPlugCategoryHash[toSave.plug.plugCategoryHash as PlugCategoryHashes])
    ) {
      modsAndWhitelist.push({
        plugDef: toSave,
        whitelist: socketType.plugWhitelist.map((plug) => plug.categoryHash),
        automaticallyPicked,
      });
    }
  }

  return (
    <div className={clsx(styles.lockedItems, { [styles.small]: size === 'small' })}>
      {modsAndWhitelist.map(({ plugDef, whitelist, automaticallyPicked }, index) => (
        <PlugDef
          className={clsx({ [styles.automaticallyPicked]: automaticallyPicked })}
          key={index}
          plug={plugDef}
          onClick={onSocketClick ? () => onSocketClick(plugDef, whitelist) : undefined}
          automaticallyPicked={automaticallyPicked}
          forClassType={item.classType}
        />
      ))}
    </div>
  );
}

export default Sockets;
