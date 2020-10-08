import { t } from 'app/i18next-t';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { LockedItemType } from 'app/loadout-builder/types';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import PressTip from '../dim-ui/PressTip';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
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
  adjustedPlug,
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  item: DimItem;
  socketInfo: DimSocket;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  className?: string;
  hasMenu: boolean;
  isPhonePortrait: boolean;
  onClick?(plug: DimPlug): void;
  onShiftClick?(lockedItem: LockedItemType): void;
  adjustedPlug?: DimPlug;
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
      <DefItemIcon itemDef={plug.plugDef} defs={defs} borderless={true} />
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
        selectable: socketInfo.plugOptions.length > 1 && socketInfo.socketIndex <= 2,
        selected: plug.plugDef.hash === adjustedPlug?.plugDef.hash,
        notSelected:
          plug === socketInfo.plugged &&
          adjustedPlug?.plugDef.hash &&
          plug.plugDef.hash !== adjustedPlug?.plugDef.hash,
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
      {wishListsEnabled && inventoryWishListRoll?.wishListPerks.has(plug.plugDef.hash) && (
        <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={t('WishListRoll.BestRatedTip')} />
      )}
    </div>
  );
}
