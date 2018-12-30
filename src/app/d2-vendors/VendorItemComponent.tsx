import { VendorItem } from './vendor-item';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import checkMark from '../../images/check.svg';
import { UISref } from '@uirouter/react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';

interface Props {
  defs: D2ManifestDefinitions;
  item: VendorItem;
  owned: boolean;
}

export default class VendorItemComponent extends React.Component<Props> {
  render() {
    const { item, defs, owned } = this.props;

    if (item.displayTile) {
      return (
        <div className="vendor-item">
          <UISref to="destiny2.vendor" params={{ id: item.previewVendorHash }}>
            <BungieImage
              className="vendor-tile"
              title={item.displayProperties.name}
              src={item.displayProperties.icon}
            />
          </UISref>
          {item.displayProperties.name}
        </div>
      );
    }

    let title = item.displayProperties.name;
    if (!item.canBeSold) {
      title = `${title}\n${item.failureStrings.join('\n')}`;
    }

    if (!item.item) {
      return null;
    }

    const itemDef = defs.InventoryItem.get(item.item.hash);
    const rewards = (itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : []).map(
      (iq) => ({
        quantity: iq.quantity,
        item: this.props.defs.InventoryItem.get(iq.itemHash)
      })
    );

    return (
      <div
        className={classNames('vendor-item', {
          owned,
          unavailable: !item.canPurchase || !item.canBeSold
        })}
      >
        {owned && <img className="owned-icon" src={checkMark} />}
        <ItemPopupTrigger
          item={item.item}
          extraData={{ rewards, failureStrings: item.failureStrings }}
        >
          <ConnectedInventoryItem item={item.item} allowFilter={true} />
        </ItemPopupTrigger>
        {item.costs.length > 0 && (
          <div className="vendor-costs">
            {item.costs.map((cost) => (
              <VendorItemCost key={cost.itemHash} defs={defs} cost={cost} />
            ))}
          </div>
        )}
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
    <div className="cost">
      {cost.quantity}{' '}
      <span className="currency">
        <BungieImage
          src={currencyItem.displayProperties.icon}
          title={currencyItem.displayProperties.name}
        />
      </span>
    </div>
  );
}
