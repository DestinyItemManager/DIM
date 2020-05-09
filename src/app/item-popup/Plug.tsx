import clsx from 'clsx';
import React from 'react';
import PressTip from '../dim-ui/PressTip';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimSocket, DimPlug } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import BungieImageAndAmmo from '../dim-ui/BungieImageAndAmmo';
import BestRatedIcon from './BestRatedIcon';
import PlugTooltip from './PlugTooltip';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { LockedItemType } from 'app/loadout-builder/types';

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
  onShiftClick
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
  // TODO: Do this with SVG to make it scale better!
  const modDef = defs.InventoryItem.get(plug.plugItem.hash);
  if (!modDef) {
    return null;
  }

  const energyType =
    (modDef?.plug?.energyCost?.energyTypeHash &&
      defs.EnergyType.get(modDef.plug.energyCost.energyTypeHash)) ||
    undefined;
  const energyCostStat = energyType && defs.Stat.get(energyType.costStatHash);
  const costElementIcon = energyCostStat?.displayProperties.icon;

  const itemCategories = plug?.plugItem?.itemCategoryHashes || [];

  const handleShiftClick =
    (onShiftClick || onClick) &&
    ((e: React.MouseEvent<HTMLDivElement>) => {
      if (onShiftClick && e.shiftKey) {
        e.stopPropagation();
        const plugSetHash = socketInfo.socketDefinition.reusablePlugSetHash;
        const lockedItem: LockedItemType =
          energyType && plugSetHash
            ? { type: 'mod', mod: plug.plugItem, plugSetHash, bucket: item.bucket }
            : { type: 'perk', perk: plug.plugItem, bucket: item.bucket };
        onShiftClick(lockedItem);
      } else {
        onClick?.(plug);
      }
    });

  const contents = (
    <div>
      <BungieImageAndAmmo
        hash={plug.plugItem.hash}
        className="item-mod"
        title={plug.plugItem.displayProperties.name}
        src={plug.plugItem.displayProperties.icon}
      />
      {costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(costElementIcon)}")` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{modDef.plug.energyCost.energyCost}</div>
        </>
      )}
    </div>
  );

  return (
    <div
      key={plug.plugItem.hash}
      className={clsx('socket-container', className, {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plug,
        notIntrinsic: !itemCategories.includes(INTRINSIC_PLUG_CATEGORY)
      })}
      onClick={handleShiftClick}
    >
      {!(hasMenu && isPhonePortrait) ? (
        <PressTip
          tooltip={() => (
            <PlugTooltip
              item={item}
              plug={plug}
              defs={defs}
              wishListsEnabled={wishListsEnabled}
              bestPerks={bestPerks}
              inventoryWishListRoll={inventoryWishListRoll}
            />
          )}
        >
          {contents}
        </PressTip>
      ) : (
        contents
      )}
      {(!wishListsEnabled || !inventoryWishListRoll) && bestPerks.has(plug.plugItem.hash) && (
        <BestRatedIcon wishListsEnabled={wishListsEnabled} />
      )}
      {wishListsEnabled &&
        inventoryWishListRoll &&
        inventoryWishListRoll.wishListPerks.has(plug.plugItem.hash) && (
          <BestRatedIcon wishListsEnabled={wishListsEnabled} />
        )}
    </div>
  );
}
