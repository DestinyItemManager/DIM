import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { BungieImage } from '../dim-ui/bungie-image';
import { PressTip } from '../dim-ui/press-tip';
import { DimItem, DimSocketCategory, DimPlug } from '../inventory/store/d2-item-factory.service';
import './sockets.scss';
import { IScope } from 'angular';
import Objective from '../progress/Objective';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

interface Props {
  item: DimItem;
  $scope: IScope;
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
    this.props.$scope.$watch(() => this.props.item.reviewsUpdated, () => {
      if (this.props.item.reviewsUpdated) {
        this.setState({}); // gross
      }
    });

    // This is another hack - it should be passed in, or provided via Context API.
    getDefinitions().then((defs) => {
      this.setState({ defs });
    });
  }

  render() {
    const { item } = this.props;

    if (!item.sockets) {
      return null;
    }

    // TODO: styles for mods and perks

    return (
      <div className="item-details">
        {item.sockets.categories.map((category) =>
          category.sockets.length > 0 &&
            <div key={category.category.hash} className={classNames("item-socket-category", categoryStyle(category.category.categoryStyle))}>
              <div className="item-socket-category-name">
                <div>{category.category.displayProperties.name}</div>
                {anyBestRatedUnselected(category) &&
                  <div className="best-rated-key">
                    <div className="tip-text"><BestRatedIcon /> {t('DtrReview.BestRatedKey')}</div>
                  </div>
                }
              </div>
              <div className="item-sockets">
                {category.sockets.map((socketInfo) =>
                  <div key={socketInfo.socketIndex} className="item-socket">
                    {socketInfo.plugOptions.map((plug) =>
                      <div
                        key={plug.plugItem.hash}
                        className={classNames("socket-container", { disabled: !plug.enabled, notChosen: plug !== socketInfo.plug })}
                      >
                        {plug.bestRated && <BestRatedIcon />}
                        <PressTip tooltip={<PlugTooltip item={item} plug={plug} defs={this.state.defs}/>}>
                          <div>
                            <BungieImage
                              className="item-mod"
                              src={plug.plugItem.displayProperties.icon}
                            />
                          </div>
                        </PressTip>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
        )}
      </div>
    );
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
    socket.plugOptions.some((plugOption) =>
      plugOption !== socket.plug && plugOption.bestRated === true)
  );
}

function BestRatedIcon() {
  return <i className="fa fa-thumbs-up thumbs-up" title={t('DtrReview.BestRatedTip')} />;
}

function PlugTooltip({
  item,
  plug,
  defs
}: {
  item: DimItem;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
}) {

  // TODO: Show objectives too, by processing plugObjectives like any other objectives
  // TODO: show insertion costs

  return (
    <>
      <h2>{plug.plugItem.displayProperties.name}</h2>
      {plug.isMasterwork && item.masterworkInfo &&
        <div><strong>{item.masterworkInfo.statName} {item.masterworkInfo.statValue}</strong></div>
      }
      {plug.plugItem.displayProperties.description
        ? <div>{plug.plugItem.displayProperties.description}</div>
        : plug.perks.map((perk) =>
          <div key={perk.hash}>
            {plug.plugItem.displayProperties.name !== perk.displayProperties.name &&
              <div>{perk.displayProperties.name}</div>}
            <div>{perk.displayProperties.description}</div>
          </div>
      )}
      {defs && plug.plugObjectives.length > 0 &&
        <div className="plug-objectives">
          {plug.plugObjectives.map((objective) =>
            <Objective key={objective.objectiveHash} objective={objective} defs={defs}/>
          )}
        </div>
      }
      {plug.enableFailReasons && <div>{plug.enableFailReasons}</div>}
      {plug.bestRated && <div className="best-rated-tip"><BestRatedIcon/> = {t('DtrReview.BestRatedTip')}</div>}
    </>
  );
}
