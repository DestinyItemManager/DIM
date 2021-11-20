import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useIsPhonePortrait } from 'app/shell/selectors';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import PressTip from '../dim-ui/PressTip';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import './ItemSockets.scss';
import DimPlugTooltip from './PlugTooltip';

export default function Plug({
  plug,
  item,
  socketInfo,
  wishlistRoll,
  hasMenu,
  onClick,
}: {
  plug: DimPlug;
  item: DimItem;
  socketInfo: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  hasMenu: boolean;
  onClick?(plug: DimPlug): void;
}) {
  const defs = useD2Definitions()!;
  const isPhonePortrait = useIsPhonePortrait();

  // TODO: Do this with SVG to make it scale better!
  const modDef = defs.InventoryItem.get(plug.plugDef.hash);
  if (!modDef || !isPluggableItem(modDef)) {
    return null;
  }

  const itemCategories = plug?.plugDef.itemCategoryHashes || [];

  const doClick = onClick && (() => onClick(plug));

  const contents = <DefItemIcon itemDef={plug.plugDef} borderless={true} />;

  const tooltip = () => <DimPlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} />;

  // Is this the currently active plug - either because it's what's slotted in game or the user has clicked to preview it
  const plugged = plug === socketInfo.plugged;
  const selectable = socketInfo.plugOptions.length > 1;

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx('socket-container', {
        disabled: !plug.enabled,
        notChosen: !plugged,
        selectable,
        // This has been selected by the user but isn't the original plugged item
        selected: socketInfo.actuallyPlugged && plugged,
        // Another plug was selected by the user
        notSelected: socketInfo.actuallyPlugged && !plugged && plug === socketInfo.actuallyPlugged,
        notIntrinsic: !itemCategories.includes(ItemCategoryHashes.WeaponModsIntrinsic),
        cannotRoll: plug.cannotCurrentlyRoll,
      })}
      onClick={hasMenu || selectable ? doClick : undefined}
    >
      {!(hasMenu && isPhonePortrait) ? <PressTip tooltip={tooltip}>{contents}</PressTip> : contents}
      {wishlistRoll?.wishListPerks.has(plug.plugDef.hash) && (
        <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={t('WishListRoll.BestRatedTip')} />
      )}
    </div>
  );
}
