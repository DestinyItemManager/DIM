import { VendorItem } from './vendor-item';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { IDialogOpenResult } from 'ng-dialog';
import dialogTemplate from './vendor-item-dialog.html';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import checkMark from '../../images/check.svg';
import { UISref } from '@uirouter/react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';

interface Props {
  defs: D2ManifestDefinitions;
  item: VendorItem;
  trackerService?: DestinyTrackerService;
  owned: boolean;
}

export default class VendorItemComponent extends React.Component<Props> {
  private dialogResult: IDialogOpenResult | null = null;

  constructor(props: Props) {
    super(props);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>) {
    return !nextProps.item.equals(this.props.item);
  }

  componentWillUnmount() {
    if (this.dialogResult) {
      this.dialogResult.close();
    }
  }

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

    const itemDef = defs.InventoryItem.get(item.itemHash);
    const rewards = (itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : []).map(
      (iq) => ({
        quantity: iq.quantity,
        item: this.props.defs.InventoryItem.get(iq.itemHash)
      })
    );

    function controller() {
      this.item = item.item;
      this.vendorItem = item;
      this.rewards = rewards;
    }

    return (
      <div
        className={classNames('vendor-item', {
          owned,
          unavailable: !item.canPurchase || !item.canBeSold
        })}
      >
        {owned && <img className="owned-icon" src={checkMark} />}
        <ItemPopupTrigger item={item.item} template={dialogTemplate} controller={controller}>
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
    <div key={cost.itemHash} className="cost">
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
