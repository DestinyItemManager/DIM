import clsx from 'clsx';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import PressTip from '../dim-ui/PressTip';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimSocket, DimPlug } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import BungieImageAndAmmo from '../dim-ui/BungieImageAndAmmo';
import BestRatedIcon from './BestRatedIcon';
import PlugTooltip from './PlugTooltip';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { LockedItemType } from 'app/loadout-builder/types';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';

import './ItemSockets.scss';

export default function Plug({
  defs,
  plug,
  item,
  socketInfo,
  wishListsEnabled,
  inventoryWishListRoll,
  className,
  bestPerks,
  hasMenu,
  isPhonePortrait,
  onClick,
  onShiftClick,
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  item: D2Item;
  socketInfo: DimSocket;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  bestPerks: Set<number>;
  className?: string;
  hasMenu: boolean;
  isPhonePortrait: boolean;
  onClick?(plug: DimPlug): void;
  onShiftClick?(lockedItem: LockedItemType): void;
}) {
  // Support dragging over plugs items on mobile
  const [{ hovering }, drop] = useDrop({
    accept: mobileDragType,
    collect: (monitor) => ({ hovering: Boolean(monitor.isOver()) }),
  });
  const ref = useRef<HTMLDivElement>(null);

  // TODO: Do this with SVG to make it scale better!
  const modDef = defs.InventoryItem.get(plug.plugDef.hash);
  if (!modDef || !isPluggableItem(modDef)) {
    return null;
  }

  const energyType =
    (modDef?.plug?.energyCost?.energyTypeHash &&
      defs.EnergyType.get(modDef.plug.energyCost.energyTypeHash)) ||
    undefined;
  const energyCostStat = energyType && defs.Stat.get(energyType.costStatHash);
  const costElementIcon = energyCostStat?.displayProperties.icon;

  const itemCategories = plug?.plugDef?.itemCategoryHashes || [];

  const handleShiftClick =
    (onShiftClick || onClick) &&
    ((e: React.MouseEvent<HTMLDivElement>) => {
      if (onShiftClick && e.shiftKey) {
        e.stopPropagation();
        const plugSetHash = socketInfo.socketDefinition.reusablePlugSetHash;
        const lockedItem: LockedItemType =
          energyType && plugSetHash
            ? { type: 'mod', mod: plug.plugDef, plugSetHash, bucket: item.bucket }
            : { type: 'perk', perk: plug.plugDef, bucket: item.bucket };
        onShiftClick(lockedItem);
      } else {
        onClick?.(plug);
      }
    });

  const contents = (
    <div ref={drop}>
      <BungieImageAndAmmo
        hash={plug.plugDef.hash}
        className="item-mod"
        title={plug.plugDef.displayProperties.name}
        src={plug.plugDef.displayProperties.icon}
      />
      {costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(costElementIcon)}")` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{modDef.plug.energyCost!.energyCost}</div>
        </>
      )}
    </div>
  );

  const tooltip = () => (
    <PlugTooltip
      item={item}
      plug={plug}
      defs={defs}
      wishListsEnabled={wishListsEnabled}
      bestPerks={bestPerks}
      inventoryWishListRoll={inventoryWishListRoll}
    />
  );

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx('socket-container', className, {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plugged,
        notIntrinsic: !itemCategories.includes(ItemCategoryHashes.WeaponModsIntrinsic),
      })}
      onClick={handleShiftClick}
    >
      {!(hasMenu && isPhonePortrait) || hovering ? (
        hovering ? (
          <PressTip.Control tooltip={tooltip} triggerRef={ref} open={hovering}>
            {contents}
          </PressTip.Control>
        ) : (
          <PressTip tooltip={tooltip}>{contents}</PressTip>
        )
      ) : (
        contents
      )}
      {(!wishListsEnabled || !inventoryWishListRoll) && bestPerks.has(plug.plugDef.hash) && (
        <BestRatedIcon wishListsEnabled={wishListsEnabled} />
      )}
      {wishListsEnabled &&
        inventoryWishListRoll &&
        inventoryWishListRoll.wishListPerks.has(plug.plugDef.hash) && (
          <BestRatedIcon wishListsEnabled={wishListsEnabled} />
        )}
    </div>
  );
}
