import classNames from 'classnames';
import React from 'react';
import PressTip from '../dim-ui/PressTip';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimSocket, DimPlug } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import BungieImageAndAmmo from '../dim-ui/BungieImageAndAmmo';
import BestRatedIcon from './BestRatedIcon';
import PlugTooltip from './PlugTooltip';
import idx from 'idx';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';

export default function Plug({
  defs,
  plug,
  item,
  socketInfo,
  wishListsEnabled,
  inventoryWishListRoll,
  className,
  bestPerks,
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
  onShiftClick?(plug: DimPlug): void;
}) {
  const handleShiftClick =
    onShiftClick &&
    ((e) => {
      if (e.shiftKey) {
        e.stopPropagation();
        onShiftClick(plug);
      }
    });

  const itemCategories = idx(plug, (p) => p.plugItem.itemCategoryHashes) || [];
  return (
    <div
      key={plug.plugItem.hash}
      className={classNames('socket-container', className, {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plug,
        notIntrinsic: !itemCategories.includes(INTRINSIC_PLUG_CATEGORY)
      })}
      onClick={handleShiftClick}
    >
      <PressTip
        tooltip={
          <PlugTooltip
            item={item}
            plug={plug}
            defs={defs}
            wishListsEnabled={wishListsEnabled}
            bestPerks={bestPerks}
            inventoryWishListRoll={inventoryWishListRoll}
          />
        }
      >
        <div>
          <BungieImageAndAmmo
            hash={plug.plugItem.hash}
            className="item-mod"
            src={plug.plugItem.displayProperties.icon}
          />
        </div>
      </PressTip>
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
