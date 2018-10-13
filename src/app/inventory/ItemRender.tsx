import * as React from 'react';
import classNames from 'classnames';
import ItemMod from './ItemMod';
import ItemRating from './ItemRating';
import ItemTag from './ItemTag';
import { BadgeInfo } from './get-badge-info';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { D2Item } from './item-types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import './ItemRender.scss';
import { TagValue } from './dim-item-info';
import * as _ from 'lodash';

interface Props {
  item: D2Item;
  badge: BadgeInfo;
  rating?: number;
  hideRating?: boolean;
  tag?: TagValue;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { item, badge, rating, hideRating, tag } = this.props;
    const category =
      item.sockets &&
      item.sockets.categories.find(
        (category) => category.category.categoryStyle === DestinySocketCategoryStyle.Consumable
      );

    const sockets = category
      ? _.take(category.sockets.filter((socketInfo) => socketInfo.plug), 3)
      : [];

    return (
      <div
        className={classNames(
          `item-render`,
          item.dmg || '',
          item.ammoType > 0 ? 'ammo-overlay ammo-type-' + item.ammoType : '',
          {
            masterwork: item.masterwork,
            exotic: item.isExotic
          }
        )}
      >
        <div className="image">
          <div className="image-well" style={bungieBackgroundStyle(item.icon)} />
          <div className="overlay" />
        </div>
        <div className="plugs">
          {category &&
            sockets.map((socketInfo, index) => (
              <div key={socketInfo.socketIndex} className={`plug-${index + 1}`}>
                {socketInfo.plug &&
                  category.category.categoryStyle !== DestinySocketCategoryStyle.Reusable && (
                    <ItemMod mod={socketInfo.plug.plugItem} />
                  )}
              </div>
            ))}
        </div>
        <div className="attributes">
          <div className="area-overlap attribute-1">
            {tag ? <ItemTag tag={tag} /> : <ItemRating rating={rating} hideRating={hideRating} />}
          </div>
          <div className="attribute-2">
            {badge.showBadge && <div className="power">{badge.badgeCount}</div>}
          </div>
        </div>
      </div>
    );
  }
}
