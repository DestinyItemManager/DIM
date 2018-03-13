import { VendorItem } from "./vendor-item";
import * as React from "react";
import { bungieBackgroundStyle, BungieImage } from "../dim-ui/bungie-image";
import classNames from 'classnames';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { settings } from '../settings/settings';
import { DestinyItemQuantity } from "bungie-api-ts/destiny2";

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

    return (
      <div className="vendor-item">
        {!item.canPurchase &&
          <div className="locked-overlay"/>
        }
        <a href={`http://db.destinytracker.com/d2/${settings.language}/items/${item.itemHash}`} target="_blank" rel="noopener">
          <div title={item.displayProperties.name} className="item">
            <div
              className={classNames("item-img", { transparent: item.borderless })}
              style={bungieBackgroundStyle(item.displayProperties.icon)}
            />
            {item.primaryStat &&
              <div className="item-stat item-equipment">{item.primaryStat}</div>}
          </div>
        </a>
        <div className="vendor-costs">
          {item.costs.map((cost) =>
            <VendorItemCost key={cost.itemHash} defs={defs} cost={cost} />
          )}
        </div>
      </div>
    );
  }
}

function VendorItemCost({
  cost,
  defs
}: {
  defs: D2ManifestDefinitions;
  cost: DestinyItemQuantity;
}) {
  const currencyItem = defs.InventoryItem.get(cost.itemHash);
  return (
    <div key={cost.itemHash} className="cost">
      {cost.quantity}
      <span className="currency">
        <BungieImage
          src={currencyItem.displayProperties.icon}
          title={currencyItem.displayProperties.name}
        />
      </span>
    </div>
  );
}
