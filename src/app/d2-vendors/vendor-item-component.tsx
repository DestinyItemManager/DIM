import { VendorItem } from "./vendor-item";
import * as React from "react";
import { bungieBackgroundStyle, BungieImage } from "../dim-ui/bungie-image";
import classNames from 'classnames';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";

interface Props {
  defs: D2ManifestDefinitions;
  item: VendorItem;
}

export class VendorItemComponent extends React.Component<Props, {}> {
  shouldComponentUpdate(
    nextProps: Readonly<Props>) {
    return !nextProps.item.equals(this.props.item);
  }

  render() {
    const { item, defs } = this.props;

    if (item.displayTile) {
      return (
        <div className="vendor-item">
          <BungieImage
            className="vendor-tile"
            title={item.displayProperties.name}
            src={item.displayProperties.icon}
          />
          {item.displayProperties.name}
        </div>
      );
    }

    // TODO: clean up costs
    return (
      <div className="vendor-item">
        <div title={item.displayProperties.name} className="item">
          <div
            className={classNames("item-img", { transparent: item.borderless })}
            style={bungieBackgroundStyle(item.displayProperties.icon)}
          />
        </div>
        <div className="vendor-costs">
          {item.costs.map((cost) =>
            <div key={cost.itemHash} className="cost">
              {cost.quantity}
              <span className="currency">
                <BungieImage
                  src={defs.InventoryItem.get(cost.itemHash).displayProperties.icon}
                  title={defs.InventoryItem.get(cost.itemHash).displayProperties.name}
                />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
