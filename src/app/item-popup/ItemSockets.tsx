import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React from 'react';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimSocket, DimSocketCategory, DimPlug } from '../inventory/item-types';
import { InventoryCuratedRoll } from '../wishlists/wishlists';
import { connect, DispatchProp } from 'react-redux';
import { wishListsEnabledSelector, inventoryCuratedRollsSelector } from '../wishlists/reducer';
import { RootState } from '../store/reducers';
import { getReviews } from '../item-review/reducer';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { ratePerks } from '../destinyTrackerApi/d2-perkRater';
import { getItemReviews } from '../item-review/destiny-tracker.service';
import Plug from './Plug';
import BestRatedIcon from './BestRatedIcon';

interface ProvidedProps {
  item: D2Item;
  /** minimal style used for loadout generator */
  hideMods?: boolean;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  onShiftClick?(plug: DimPlug): void;
}

interface StoreProps {
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
  bestPerks: Set<number>;
  defs?: D2ManifestDefinitions;
}

const EMPTY = [];

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  const reviewResponse = getReviews(item, state);
  const reviews = reviewResponse ? reviewResponse.reviews : EMPTY;
  const bestPerks = ratePerks(item, reviews as D2ItemUserReview[]);
  return {
    curationEnabled: wishListsEnabledSelector(state),
    inventoryCuratedRoll: inventoryCuratedRollsSelector(state)[item.id],
    bestPerks,
    defs: state.manifest.d2Manifest
  };
}

type Props = ProvidedProps & StoreProps & DispatchProp<any>;

class ItemSockets extends React.Component<Props> {
  componentDidMount() {
    const { item, dispatch, bestPerks } = this.props;

    // TODO: want to prevent double loading these
    if (!bestPerks.size) {
      dispatch(getItemReviews(item));
    }
  }

  render() {
    const {
      defs,
      item,
      hideMods,
      curationEnabled,
      inventoryCuratedRoll,
      bestPerks,
      classesByHash,
      onShiftClick
    } = this.props;

    if (!item.sockets || !defs) {
      return null;
    }

    // special top level class for styling some specific items' popups differently
    const itemSpecificClass = [1160544508, 1160544509, 1160544511, 3633698719].includes(item.hash)
      ? 'chalice' // to-do, maybe, someday: this should be 'synthesizer' but they share classes rn
      : item.hash === 1115550924
      ? 'chalice'
      : null;

    return (
      <div className={clsx('item-details', 'sockets', { itemSpecificClass })}>
        {item.sockets.categories.map(
          (category, index) =>
            // always show the first socket cateory even if hideMods style
            (!hideMods || index === 0) &&
            // hide if there's no sockets in this category
            category.sockets.length > 0 &&
            // hide if this is the energy slot. it's already displayed in ItemDetails
            category.category.categoryStyle !== DestinySocketCategoryStyle.EnergyMeter && (
              <div
                key={category.category.hash}
                className={clsx(
                  'item-socket-category',
                  categoryStyle(category.category.categoryStyle)
                )}
              >
                {!hideMods && (
                  <div className="item-socket-category-name">
                    {category.category.displayProperties.name}
                    {bestRatedIcon(category, bestPerks, curationEnabled, inventoryCuratedRoll)}
                  </div>
                )}
                <div className="item-sockets">
                  {category.sockets.map((socketInfo) => (
                    <div key={socketInfo.socketIndex} className="item-socket">
                      {sortPlugs(socketInfo, category.category.categoryStyle).map((plug) => (
                        <Plug
                          key={plug.plugItem.hash}
                          plug={plug}
                          item={item}
                          socketInfo={socketInfo}
                          defs={defs}
                          curationEnabled={this.props.curationEnabled}
                          inventoryCuratedRoll={this.props.inventoryCuratedRoll}
                          bestPerks={bestPerks}
                          className={classesByHash && classesByHash[plug.plugItem.hash]}
                          onShiftClick={onShiftClick}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(ItemSockets);

/** returns BestRatedIcon with appropriate label if this is the recommended perk */
function bestRatedIcon(
  category: DimSocketCategory,
  bestPerks: Set<number>,
  curationEnabled?: boolean,
  inventoryCuratedRoll?: InventoryCuratedRoll
) {
  const returnAsWishlisted =
    (!curationEnabled || !inventoryCuratedRoll) && anyBestRatedUnselected(category, bestPerks)
      ? false // false for a review recommendation
      : curationEnabled && inventoryCuratedRoll && anyCuratedRolls(category, inventoryCuratedRoll)
      ? true // true for a wishlisted perk
      : null; // don't give a thumbs up at all

  return (
    returnAsWishlisted !== null && (
      <div className="best-rated-key">
        <div className="tip-text">
          <BestRatedIcon curationEnabled={returnAsWishlisted} />{' '}
          {returnAsWishlisted ? t('CuratedRoll.BestRatedKey') : t('DtrReview.BestRatedKey')}
        </div>
      </div>
    )
  );
}

/** returns plugOptions with selected plug pushed to front, unless it's reusable (usually toggles) */
function sortPlugs(socketInfo: DimSocket, categoryStyle: DestinySocketCategoryStyle) {
  return categoryStyle === DestinySocketCategoryStyle.Reusable
    ? // return without shifting selected entry, if reusable
      socketInfo.plugOptions
    : // shift selected entry to front, if not reusable
      ((socketInfo.plug && [socketInfo.plug]) || []).concat(
        socketInfo.plugOptions.filter((p) => p !== socketInfo.plug)
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

function anyCuratedRolls(category: DimSocketCategory, inventoryCuratedRoll: InventoryCuratedRoll) {
  return category.sockets.some((socket) =>
    socket.plugOptions.some(
      (plugOption) =>
        plugOption !== socket.plug &&
        // truelog(`${JSON.stringify(category)} - ${JSON.stringify(inventoryCuratedRoll)}`) &&
        inventoryCuratedRoll.curatedPerks.has(plugOption.plugItem.hash)
    )
  );
}
// function truelog(logstring) {
//   console.log(logstring);
//   return true;
// }
