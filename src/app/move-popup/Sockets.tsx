import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';
import './sockets.scss';
import { IScope } from 'angular';
import Objective from '../progress/Objective';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimSocket, DimSocketCategory, DimPlug } from '../inventory/item-types';
import { thumbsUpIcon, AppIcon } from '../shell/icons';

interface Props {
  item: D2Item;
  $scope: IScope;
  hideMods?: boolean;
}

interface State {
  defs?: D2ManifestDefinitions;
}

export default class Sockets extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // This is a hack / React anti-pattern so we can successfully update when the reviews async populate.
    // It should be short-term - in the future we should load review data from separate state.
    this.props.$scope.$watch(
      () => this.props.item.dtrRating && this.props.item.dtrRating.lastUpdated,
      () => {
        if (this.props.item.dtrRating && this.props.item.dtrRating.lastUpdated) {
          this.setState({}); // gross
        }
      }
    );

    // This is another hack - it should be passed in, or provided via Context API.
    getDefinitions().then((defs) => {
      this.setState({ defs });
    });
  }

  render() {
    const { item, hideMods } = this.props;
    const { defs } = this.state;

    if (!item.sockets || !defs) {
      return null;
    }

    // TODO: styles for mods and perks

    return (
      <div className="item-details">
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
                <div className="item-socket-category-name">
                  <div>{category.category.displayProperties.name}</div>
                  {anyBestRatedUnselected(category) && (
                    <div className="best-rated-key">
                      <div className="tip-text">
                        <BestRatedIcon /> {t('DtrReview.BestRatedKey')}
                      </div>
                    </div>
                  )}
                </div>
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

function Plug({
  defs,
  plug,
  item,
  socketInfo
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  item: D2Item;
  socketInfo: DimSocket;
}) {
  return (
    <div
      key={plug.plugItem.hash}
      className={classNames('socket-container', {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plug
      })}
    >
      {plug.bestRated && <BestRatedIcon />}
      <PressTip tooltip={<PlugTooltip item={item} plug={plug} defs={defs} />}>
        <div>
          <BungieImage className="item-mod" src={plug.plugItem.displayProperties.icon} />
        </div>
      </PressTip>
    </div>
  );
}

function BestRatedIcon() {
  return <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={t('DtrReview.BestRatedTip')} />;
}

function PlugTooltip({
  item,
  plug,
  defs
}: {
  item: D2Item;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
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
      {defs &&
        plug.plugObjectives.length > 0 && (
          <div className="plug-objectives">
            {plug.plugObjectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} defs={defs} />
            ))}
          </div>
        )}
      {plug.enableFailReasons && <div>{plug.enableFailReasons}</div>}
      {plug.bestRated && (
        <div className="best-rated-tip">
          <BestRatedIcon /> = {t('DtrReview.BestRatedTip')}
        </div>
      )}
    </>
  );
}
