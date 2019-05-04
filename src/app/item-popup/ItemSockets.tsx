import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'app/i18next-t';
import React from 'react';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimSocket, DimSocketCategory } from '../inventory/item-types';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';
import { connect, DispatchProp } from 'react-redux';
import { curationsEnabledSelector, inventoryCuratedRollsSelector } from '../curated-rolls/reducer';
import { RootState } from '../store/reducers';
import { getReviews } from '../item-review/reducer';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { ratePerks } from '../destinyTrackerApi/d2-perkRater';
import { getItemReviews } from '../item-review/destiny-tracker.service';
import Plug from './Plug';
import BestRatedIcon from './BestRatedIcon';

interface ProvidedProps {
  item: D2Item;
  hideMods?: boolean;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
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
    curationEnabled: curationsEnabledSelector(state),
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
      classesByHash
    } = this.props;

    if (!item.sockets || !defs) {
      return null;
    }

    return (
      <div className="item-details sockets">
        {item.sockets.categories.map(
          (category, index) =>
            (!hideMods || index === 0) &&
            category.sockets.length > 0 && (
              <div
                key={category.category.hash}
                className={classNames(
                  'item-socket-category',
                  categoryStyle(category.category.categoryStyle)
                )}
              >
                {!hideMods && (
                  <div className="item-socket-category-name">
                    <div>{category.category.displayProperties.name}</div>
                    {(!curationEnabled || !inventoryCuratedRoll) &&
                      anyBestRatedUnselected(category, bestPerks) && (
                        <div className="best-rated-key">
                          <div className="tip-text">
                            <BestRatedIcon curationEnabled={false} /> {t('DtrReview.BestRatedKey')}
                          </div>
                        </div>
                      )}
                    {curationEnabled &&
                      inventoryCuratedRoll &&
                      anyCuratedRolls(category, inventoryCuratedRoll) && (
                        <div className="best-rated-key">
                          <div className="tip-text">
                            <BestRatedIcon curationEnabled={true} /> {t('CuratedRoll.BestRatedKey')}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                <div className="item-sockets">
                  {category.sockets.map((socketInfo) => (
                    <div key={socketInfo.socketIndex} className="item-socket">
                      {/* This re-sorts mods to have the currently equipped plug in front */}
                      {socketInfo.plug &&
                        category.category.categoryStyle !== DestinySocketCategoryStyle.Reusable && (
                          <Plug
                            key={socketInfo.plug.plugItem.hash}
                            plug={socketInfo.plug}
                            item={item}
                            socketInfo={socketInfo}
                            defs={defs}
                            curationEnabled={this.props.curationEnabled}
                            inventoryCuratedRoll={this.props.inventoryCuratedRoll}
                            bestPerks={bestPerks}
                            className={
                              classesByHash && classesByHash[socketInfo.plug.plugItem.hash]
                            }
                          />
                        )}
                      {filterPlugOptions(category.category.categoryStyle, socketInfo).map(
                        (plug) => (
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
                          />
                        )
                      )}
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

function filterPlugOptions(categoryStyle: DestinySocketCategoryStyle, socketInfo: DimSocket) {
  if (categoryStyle === DestinySocketCategoryStyle.Reusable) {
    return socketInfo.plugOptions;
  } else {
    return socketInfo.plugOptions.filter((p) => p !== socketInfo.plug);
  }
}

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
        inventoryCuratedRoll.curatedPerks.has(plugOption.plugItem.hash)
    )
  );
}
