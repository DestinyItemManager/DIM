import * as React from "react";
import { D2Item } from "./item-types";
import classNames from "classnames";
import { DestinySocketCategoryStyle } from "bungie-api-ts/destiny2";
import ItemRating from './ItemRating';
import "./ItemRender.scss";

interface Props {
  item: D2Item;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { item } = this.props;

    const styles = {
      backgroundImage: `url('https://www.bungie.net${item.icon}')`
    };

    let className = `item-render`;

    if (item.masterwork) {
      className = className + " masterwork";
    }

    if (item.isExotic) {
      className = className + " exotic";
    }

    const category =
      item.sockets &&
      item.sockets.categories.find(
        (category) =>
          category.category.categoryStyle ===
          DestinySocketCategoryStyle.Consumable
      );

    return (
      <div
        className={classNames(`item-render ${item.dmg ? item.dmg : ""}`, {
          masterwork: item.masterwork,
          exotic: item.isExotic
        })}
      >
        <div className="image">
          <div className="image-well" style={styles} />
          <div className="overlay" />
        </div>
        <div className="plugs">
          {category &&
            category.sockets.map((socketInfo, index) => {
              if (index > 2) {
                return null;
              }

              return (
                <div
                  key={socketInfo.socketIndex}
                  className={`plug-${index + 1}`}
                >
                  {socketInfo.plug &&
                    category.category.categoryStyle !==
                      DestinySocketCategoryStyle.Reusable && (
                      <div
                        className="item-mod"
                        style={{
                          backgroundImage: `url('https://www.bungie.net${
                            socketInfo.plug.plugItem.displayProperties.icon
                          }')`
                        }}
                      />
                    )}
                </div>
              );
            })}
        </div>
        <div className="attributes">
          <div className="area-overlap attribute-1">
            <ItemRating item={item} />
          </div>
          <div className="attribute-2">
            <div className="power">{item.primStat && item.primStat.value}</div>
          </div>
        </div>
      </div>
    );
  }
}
