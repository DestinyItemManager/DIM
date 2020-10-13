import { getWeaponArchetypeSocket } from 'app/dim-ui/WeaponArchetype';
import { t } from 'app/i18next-t';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { LockedItemType } from 'app/loadout-builder/types';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import clsx from 'clsx';
import { ItemCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { default as React, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import PressTip from '../dim-ui/PressTip';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { inventoryWishListsSelector, wishListsEnabledSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import './ItemSockets.scss';
import styles from './ItemSocketsList.m.scss';
import PlugTooltip from './PlugTooltip';
import SocketDetails from './SocketDetails';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  defs?: D2ManifestDefinitions;
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    inventoryWishListRoll: inventoryWishListsSelector(state)[item.id],
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemSockets({
  defs,
  item,
  wishListsEnabled,
  inventoryWishListRoll,
  isPhonePortrait,
}: Props) {
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  const handleSocketClick = (
    _item: DimItem,
    socket: DimSocket,
    _plug: DimPlug,
    hasMenu: boolean
  ) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    }
  };

  if (!item.sockets || !defs) {
    return null;
  }

  // TODO: remove kill tracker perks
  // Separate out sockets. This gives us better display for things we know, but isn't as flexible to changes in how D2 works.
  const archetype = getWeaponArchetypeSocket(item);
  const cosmetics = item.sockets?.categories.find(
    (c) =>
      c.category.hash === SocketCategoryHashes.ArmorCosmetics ||
      c.category.hash === SocketCategoryHashes.WeaponCosmetics
  );
  const perks = item.sockets?.categories.find(
    (c) =>
      c.category.hash !== SocketCategoryHashes.IntrinsicTraits &&
      c.sockets.length &&
      c.sockets[0].isPerk
  );
  const mods = item.sockets.allSockets.filter((s) => !s.isPerk && s !== archetype);

  // TODO: bring back clicking perks to see stats
  // TODO: AWA buttons
  // TODO: grid for armor?

  return (
    <div className={styles.sockets}>
      <div className={clsx(styles.row, styles.archetype)}>
        {archetype?.plugged && (
          <div className={styles.archetypeMod}>
            <DefItemIcon itemDef={archetype.plugged.plugDef} defs={defs} borderless={true} />
            {archetype.plugged.plugDef.displayProperties.name}
          </div>
        )}
        {mods.length === 1 &&
          mods.map((socketInfo) => (
            <ModSocket
              key={socketInfo.socketIndex}
              defs={defs}
              item={item}
              isPhonePortrait={isPhonePortrait}
              socket={socketInfo}
              wishListsEnabled={wishListsEnabled}
              inventoryWishListRoll={inventoryWishListRoll}
              onClick={handleSocketClick}
            />
          ))}
        {cosmetics?.sockets.map((socketInfo) => (
          <ModSocket
            key={socketInfo.socketIndex}
            defs={defs}
            item={item}
            isPhonePortrait={isPhonePortrait}
            socket={socketInfo}
            wishListsEnabled={wishListsEnabled}
            inventoryWishListRoll={inventoryWishListRoll}
            onClick={handleSocketClick}
          />
        ))}
      </div>
      {perks?.sockets.map((socketInfo) => (
        <div key={socketInfo.socketIndex} className={styles.row}>
          <PerkSocket
            key={socketInfo.socketIndex}
            defs={defs}
            socket={socketInfo}
            inventoryWishListRoll={inventoryWishListRoll}
          />
        </div>
      ))}
      {socketInMenu &&
        ReactDOM.createPortal(
          <SocketDetails
            key={socketInMenu.socketIndex}
            item={item}
            socket={socketInMenu}
            onClose={() => setSocketInMenu(null)}
          />,
          document.body
        )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemSockets);

function PerkSocket({
  defs,
  socket,
  inventoryWishListRoll,
}: {
  defs: D2ManifestDefinitions;
  socket: DimSocket;
  inventoryWishListRoll?: InventoryWishListRoll;
}) {
  return (
    <div className={styles.socket}>
      {socket.plugOptions.map((plug) => (
        <PerkPlug
          key={plug.plugDef.hash}
          plug={plug}
          socketInfo={socket}
          defs={defs}
          inventoryWishListRoll={inventoryWishListRoll}
        />
      ))}
    </div>
  );
}

function PerkPlug({
  defs,
  plug,
  socketInfo,
  inventoryWishListRoll,
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  socketInfo: DimSocket;
  inventoryWishListRoll?: InventoryWishListRoll;
}) {
  if (!plug.plugDef.plug) {
    return null;
  }

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx(styles.plug, {
        [styles.plugged]: plug === socketInfo.plugged,
        [styles.disabled]: !plug.enabled,
      })}
    >
      <div className={styles.perkIcon}>
        <DefItemIcon itemDef={plug.plugDef} defs={defs} borderless={true} />
        {inventoryWishListRoll?.wishListPerks.has(plug.plugDef.hash) && (
          <AppIcon
            className="thumbs-up"
            icon={thumbsUpIcon}
            title={t('WishListRoll.BestRatedTip')}
          />
        )}
      </div>
      {socketInfo.isPerk && plug === socketInfo.plugged && (
        <span className={styles.plugLabel}>{plug.plugDef.displayProperties.name}</span>
      )}
    </div>
  );
}

function ModSocket({
  defs,
  item,
  socket,
  wishListsEnabled,
  inventoryWishListRoll,
  classesByHash,
  isPhonePortrait,
  onClick,
  onShiftClick,
  adjustedPlug,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  socket: DimSocket;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  isPhonePortrait: boolean;
  onClick(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
  onShiftClick?(lockedItem: LockedItemType): void;
  adjustedPlug?: DimPlug;
}) {
  const hasMenu = Boolean(!socket.isPerk && socket.socketDefinition.plugSources);

  return (
    <div className={styles.mod}>
      {socket.plugOptions.map((plug) => (
        <ModPlug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          defs={defs}
          wishListsEnabled={wishListsEnabled}
          inventoryWishListRoll={inventoryWishListRoll}
          hasMenu={hasMenu}
          isPhonePortrait={isPhonePortrait}
          className={classesByHash?.[plug.plugDef.hash]}
          onClick={() => {
            onClick(item, socket, plug, hasMenu);
          }}
          onShiftClick={onShiftClick}
          adjustedPlug={adjustedPlug}
        />
      ))}
    </div>
  );
}

function ModPlug({
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
      {socketInfo.isPerk && plug === socketInfo.plugged && (
        <span className={styles.plugLabel}>{plug.plugDef.displayProperties.name}</span>
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
        [styles.plugged]: plug === socketInfo.plugged,
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
