import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { LockedItemType } from 'app/loadout-builder/types';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImageAndAmmo from '../dim-ui/BungieImageAndAmmo';
import PressTip from '../dim-ui/PressTip';
import { D2Item, DimPlug, DimSocket } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import './ItemSockets.scss';
import PlugTooltip from './PlugTooltip';

export default function Plug({
  defs,
  plug,
  item,
  socketInfo,
  wishListsEnabled,
  inventoryWishListRoll,
  className,
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
        const lockedItem: LockedItemType = {
          type: 'perk',
          perk: plug.plugDef,
          bucket: item.bucket,
        };
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
      {wishListsEnabled &&
        inventoryWishListRoll &&
        inventoryWishListRoll.wishListPerks.has(plug.plugDef.hash) && (
          <AppIcon
            className="thumbs-up"
            icon={thumbsUpIcon}
            title={t('WishListRoll.BestRatedTip')}
          />
        )}
    </div>
  );
}
