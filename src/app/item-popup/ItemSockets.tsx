import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';
import './ItemSockets.scss';
import Objective from '../progress/Objective';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimSocket, DimSocketCategory, DimPlug } from '../inventory/item-types';
import { thumbsUpIcon, AppIcon } from '../shell/icons';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';
import { connect } from 'react-redux';
import { curationsSelector, getInventoryCuratedRoll } from '../curated-rolls/reducer';
import { RootState } from '../store/reducers';
import { dimDestinyTrackerService } from '../item-review/destiny-tracker.service';
import { $rootScope } from 'ngimport';

interface ProvidedProps {
  item: D2Item;
  hideMods?: boolean;
}

interface StoreProps {
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  return {
    curationEnabled: curationsSelector(state).curationEnabled,
    inventoryCuratedRoll: getInventoryCuratedRoll(item, curationsSelector(state).curations)
  };
}

type Props = ProvidedProps & StoreProps;

interface State {
  defs?: D2ManifestDefinitions;
}

class ItemSockets extends React.Component<Props, State> {
  private $scope = $rootScope.$new(true);

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // This is a hack / React anti-pattern so we can successfully update when the reviews async populate.
    // It should be short-term - in the future we should load review data from separate state.

    // TODO: move bestRated into redux too!
    this.$scope.$watch(
      () => this.props.item.dtrRating && this.props.item.dtrRating.lastUpdated,
      () => {
        if (this.props.item.dtrRating && this.props.item.dtrRating.lastUpdated) {
          this.setState({}); // gross
        }
      }
    );
    dimDestinyTrackerService.getItemReviews(this.props.item).then(() => this.$scope.$apply());

    // This is another hack - it should be passed in, or provided via Context API.
    getDefinitions().then((defs) => {
      this.setState({ defs });
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

  render() {
    const { item, hideMods, curationEnabled, inventoryCuratedRoll } = this.props;
    const { defs } = this.state;

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
                    {(!curationEnabled ||
                      !inventoryCuratedRoll ||
                      !inventoryCuratedRoll.isCuratedRoll) &&
                      anyBestRatedUnselected(category) && (
                        <div className="best-rated-key">
                          <div className="tip-text">
                            <BestRatedIcon curationEnabled={false} /> {t('DtrReview.BestRatedKey')}
                          </div>
                        </div>
                      )}
                    {curationEnabled &&
                      inventoryCuratedRoll &&
                      inventoryCuratedRoll.isCuratedRoll &&
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

function anyBestRatedUnselected(category: DimSocketCategory) {
  return category.sockets.some((socket) =>
    socket.plugOptions.some(
      (plugOption) => plugOption !== socket.plug && plugOption.bestRated === true
    )
  );
}

function anyCuratedRolls(category: DimSocketCategory, inventoryCuratedRoll: InventoryCuratedRoll) {
  return category.sockets.some((socket) =>
    socket.plugOptions.some(
      (plugOption) =>
        plugOption !== socket.plug &&
        socket.plugOptions.some((dp) =>
          inventoryCuratedRoll.curatedPerks.includes(dp.plugItem.hash)
        )
    )
  );
}

function Plug({
  defs,
  plug,
  item,
  socketInfo,
  curationEnabled,
  inventoryCuratedRoll
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  item: D2Item;
  socketInfo: DimSocket;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
}) {
  return (
    <div
      key={plug.plugItem.hash}
      className={classNames('socket-container', {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plug
      })}
    >
      {(!curationEnabled || !inventoryCuratedRoll || !inventoryCuratedRoll.isCuratedRoll) &&
        plug.bestRated && <BestRatedIcon curationEnabled={curationEnabled} />}
      {curationEnabled &&
        inventoryCuratedRoll &&
        inventoryCuratedRoll.curatedPerks.find((ph) => ph === plug.plugItem.hash) && (
          <BestRatedIcon curationEnabled={curationEnabled} />
        )}
      <PressTip
        tooltip={
          <PlugTooltip item={item} plug={plug} defs={defs} curationEnabled={curationEnabled} />
        }
      >
        <div>
          <BungieImage className="item-mod" src={plug.plugItem.displayProperties.icon} />
        </div>
      </PressTip>
    </div>
  );
}

function BestRatedIcon({ curationEnabled }: { curationEnabled?: boolean }) {
  const tipText = curationEnabled ? 'CuratedRoll.BestRatedTip' : 'DtrReview.BestRatedTip';

  return <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={t(tipText)} />;
}

function PlugTooltip({
  item,
  plug,
  defs,
  curationEnabled
}: {
  item: D2Item;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
  curationEnabled?: boolean;
}) {
  // TODO: show insertion costs

  return (
    <>
      <h2>
        {plug.plugItem.displayProperties.name}
        {item.masterworkInfo &&
          plug.plugItem.investmentStats &&
          plug.plugItem.investmentStats[0] &&
          item.masterworkInfo.statHash === plug.plugItem.investmentStats[0].statTypeHash &&
          ` (${item.masterworkInfo.statName})`}
      </h2>

      {plug.plugItem.displayProperties.description ? (
        <div>{plug.plugItem.displayProperties.description}</div>
      ) : (
        plug.perks.map((perk) => (
          <div key={perk.hash}>
            {plug.plugItem.displayProperties.name !== perk.displayProperties.name && (
              <div>{perk.displayProperties.name}</div>
            )}
            <div>{perk.displayProperties.description}</div>
          </div>
        ))
      )}
      {defs && plug.plugObjectives.length > 0 && (
        <div className="plug-objectives">
          {plug.plugObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} defs={defs} />
          ))}
        </div>
      )}
      {plug.enableFailReasons && <div>{plug.enableFailReasons}</div>}
      {plug.bestRated && (
        <div className="best-rated-tip">
          <BestRatedIcon curationEnabled={curationEnabled} /> = {t('DtrReview.BestRatedTip')}
        </div>
      )}
    </>
  );
}
