import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { BungieImage } from '../dim-ui/bungie-image';
import { PressTip } from '../dim-ui/press-tip';
import { DimItem, DimSocketCategory } from '../inventory/store/d2-item-factory.service';
import './sockets.scss';

export default function Sockets({
  item
}: {
  item: DimItem;
}) {
  if (!item.sockets) {
    return null;
  }

  // TODO: fix that tip thing
  // TODO: styles for mods and perks
  // TODO: show all perks in tip
  // TODO: break this up into smaller components

  return (
    <div className="item-sockets item-details">
      {item.sockets.categories.map((category) =>
        <div key={category.category.hash} className={classNames("item-socket-category", categoryStyle(category.category.categoryStyle))}>
          <div className="item-socket-category-name">
            <div>{category.category.displayProperties.name}</div>
            {anyBestRatedUnselected(category) &&
              <div className="best-rated-key">
                <div className="best-rated-tip-container">
                  <div className="best-rated-tip"/>
                  <div className="circle-container">
                    <div className="thumbs-up"><i className="fa fa-thumbs-up" aria-hidden="true"/></div>
                  </div>
                </div>
                <div className="tip-text">{t('DtrReview.BestRatedKey')}</div>
              </div>
            }
          </div>
          <div className="item-sockets">
            {category.sockets.map((socketInfo) =>
              <div
                key={socketInfo.socketIndex}
                className={classNames("item-socket", { disabled: socketInfo.plug && !socketInfo.plug.enabled })}
              >
                {socketInfo.plugOptions.map((plug) =>
                  <div
                    key={plug.plugItem.hash}
                    className="socket-container"
                  >
                    {plug.bestRated &&
                      <div className="circle-container">
                        <div className="thumbs-up"><i className="fa fa-thumbs-up" aria-hidden="true"/></div>
                      </div>
                    }
                    <PressTip
                      tooltip={
                        <>
                          <h2>{plug.plugItem.displayProperties.name}</h2>
                          {plug.isMasterwork && item.masterworkInfo &&
                            <strong>{item.masterworkInfo.statName} {item.masterworkInfo.statValue}</strong>
                          }
                          {plug.plugItem.displayProperties.description}
                          {plug.plugItem.displayProperties.name !== plug.perks[0].displayProperties.name &&
                              plug.perks[0].displayProperties.name}
                          {plug.perks[0].displayProperties.description}
                          {plug.enableFailReasons}
                          {plug.bestRated && t('DtrReview.BestRatedTip')}
                        </>
                      }
                    >
                      <BungieImage
                        className={classNames("item-mod", { notChosen: plug !== socketInfo.plug })}
                        src={plug.plugItem.displayProperties.icon}
                      />
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
