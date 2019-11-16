import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React, { useEffect, useState } from 'react';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimSocketCategory, DimPlug, DimSocket } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import { connect, DispatchProp } from 'react-redux';
import { wishListsEnabledSelector, inventoryWishListsSelector } from '../wishlists/reducer';
import { RootState } from '../store/reducers';
import { getReviews } from '../item-review/reducer';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { ratePerks } from '../destinyTrackerApi/d2-perkRater';
import { getItemReviews } from '../item-review/destiny-tracker.service';
import Plug from './Plug';
import BestRatedIcon from './BestRatedIcon';
import ReactDOM from 'react-dom';
import SocketDetails from './SocketDetails';

interface ProvidedProps {
  item: D2Item;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  onShiftClick?(plug: DimPlug): void;
}

interface StoreProps {
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  bestPerks: Set<number>;
  defs?: D2ManifestDefinitions;
  isPhonePortrait: boolean;
}

const EMPTY = [];

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const reviewResponse = getReviews(item, state);
  const reviews = reviewResponse ? reviewResponse.reviews : EMPTY;
  const bestPerks = ratePerks(item, reviews as D2ItemUserReview[]);
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    inventoryWishListRoll: inventoryWishListsSelector(state)[item.id],
    bestPerks,
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait
  };
}

type Props = ProvidedProps & StoreProps & DispatchProp<any>;

function ItemSockets({
  defs,
  item,
  minimal,
  wishListsEnabled,
  inventoryWishListRoll,
  bestPerks,
  classesByHash,
  isPhonePortrait,
  onShiftClick,
  dispatch
}: Props) {
  useEffect(() => {
    // TODO: want to prevent double loading these
    if (!bestPerks.size) {
      dispatch(getItemReviews(item));
    }
  }, [item, bestPerks.size, dispatch]);

  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  if (!item.sockets || !defs) {
    return null;
  }

  // special top level class for styling some specific items' popups differently
  const itemSpecificClass = [1160544508, 1160544509, 1160544511, 3633698719].includes(item.hash)
    ? 'chalice' // to-do, maybe, someday: this should be 'synthesizer' but they share classes rn
    : item.hash === 1115550924
    ? 'chalice'
    : null;

  let categories = item.sockets.categories.filter(
    (c) =>
      // hide if there's no sockets in this category
      c.sockets.length > 0 &&
      // hide if this is the energy slot. it's already displayed in ItemDetails
      c.category.categoryStyle !== DestinySocketCategoryStyle.EnergyMeter
  );
  if (minimal) {
    // Only show the first of each style of category
    const categoryStyles = new Set<DestinySocketCategoryStyle>();
    categories = categories.filter((c) => {
      if (!categoryStyles.has(c.category.categoryStyle)) {
        categoryStyles.add(c.category.categoryStyle);
        return true;
      }
      return false;
    });
  }

  return (
    <div className={clsx('item-details', 'sockets', { itemSpecificClass })}>
      {categories.map((category) => (
        <div
          key={category.category.hash}
          className={clsx('item-socket-category', categoryStyle(category.category.categoryStyle))}
        >
          {!minimal && (
            <div className="item-socket-category-name">
              {category.category.displayProperties.name}
              {bestRatedIcon(category, bestPerks, wishListsEnabled, inventoryWishListRoll)}
            </div>
          )}
          <div className="item-sockets">
            {category.sockets.map((socketInfo) => (
              <Socket
                key={socketInfo.socketIndex}
                defs={defs}
                item={item}
                isPhonePortrait={isPhonePortrait}
                socket={socketInfo}
                wishListsEnabled={wishListsEnabled}
                inventoryWishListRoll={inventoryWishListRoll}
                classesByHash={classesByHash}
                bestPerks={bestPerks}
                onClick={() => setSocketInMenu(socketInfo)}
                onShiftClick={onShiftClick}
              />
            ))}
          </div>
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

/** returns BestRatedIcon with appropriate label if this is the recommended perk */
function bestRatedIcon(
  category: DimSocketCategory,
  bestPerks: Set<number>,
  curationEnabled?: boolean,
  inventoryCuratedRoll?: InventoryWishListRoll
) {
  const returnAsWishlisted =
    (!curationEnabled || !inventoryCuratedRoll) && anyBestRatedUnselected(category, bestPerks)
      ? false // false for a review recommendation
      : curationEnabled && inventoryCuratedRoll && anyWishListRolls(category, inventoryCuratedRoll)
      ? true // true for a wishlisted perk
      : null; // don't give a thumbs up at all

  return (
    returnAsWishlisted !== null && (
      <div className="best-rated-key">
        <div className="tip-text">
          <BestRatedIcon wishListsEnabled={returnAsWishlisted} />{' '}
          {returnAsWishlisted ? t('WishListRoll.BestRatedKey') : t('DtrReview.BestRatedKey')}
        </div>
      </div>
    )
  );
}

/** converts a socket category to a valid css class name */
function categoryStyle(categoryStyle: DestinySocketCategoryStyle) {
  switch (categoryStyle) {
    case DestinySocketCategoryStyle.Unknown:
      return 'item-socket-category-Unknown';
    case DestinySocketCategoryStyle.Reusable:
      return 'item-socket-category-Reusable';
    case DestinySocketCategoryStyle.Consumable:
      return 'item-socket-category-Consumable';
    case DestinySocketCategoryStyle.Unlockable:
      return 'item-socket-category-Unlockable';
    case DestinySocketCategoryStyle.Intrinsic:
      return 'item-socket-category-Intrinsic';
    case DestinySocketCategoryStyle.EnergyMeter:
      return 'item-socket-category-EnergyMeter';
    default:
      return null;
  }
}

function anyBestRatedUnselected(category: DimSocketCategory, bestRated: Set<number>) {
  return category.sockets.some((socket) =>
    socket.plugOptions.some(
      (plugOption) => plugOption !== socket.plug && bestRated.has(plugOption.plugItem.hash)
    )
  );
}

function anyWishListRolls(
  category: DimSocketCategory,
  inventoryWishListRoll: InventoryWishListRoll
) {
  return category.sockets.some((socket) =>
    socket.plugOptions.some(
      (plugOption) =>
        plugOption !== socket.plug &&
        inventoryWishListRoll.wishListPerks.has(plugOption.plugItem.hash)
    )
  );
}

function Socket({
  defs,
  item,
  socket,
  wishListsEnabled,
  inventoryWishListRoll,
  classesByHash,
  bestPerks,
  isPhonePortrait,
  onClick,
  onShiftClick
}: {
  defs: D2ManifestDefinitions;
  item: D2Item;
  socket: DimSocket;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  bestPerks: Set<number>;
  isPhonePortrait: boolean;
  onClick(plug: DimPlug): void;
  onShiftClick?(plug: DimPlug): void;
}) {
  const hasMenu = Boolean(!socket.isPerk && socket.socketDefinition.plugSources);

  return (
    <div
      className={clsx('item-socket', {
        hasMenu
      })}
    >
      {socket.plugOptions.map((plug) => (
        <Plug
          key={plug.plugItem.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          defs={defs}
          wishListsEnabled={wishListsEnabled}
          inventoryWishListRoll={inventoryWishListRoll}
          bestPerks={bestPerks}
          hasMenu={hasMenu}
          isPhonePortrait={isPhonePortrait}
          className={classesByHash && classesByHash[plug.plugItem.hash]}
          onClick={hasMenu ? onClick : undefined}
          onShiftClick={onShiftClick}
        />
      ))}
    </div>
  );
}
