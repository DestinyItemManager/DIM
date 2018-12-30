import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';
import { VendorSaleItem, VendorCost } from './vendor.service';
import checkMark from '../../images/check.svg';

interface Props {
  saleItem: VendorSaleItem;
  owned: boolean;
  totalCoins: {
    [currencyHash: number]: number;
  };
}

export default class D1VendorItem extends React.Component<Props> {
  render() {
    const { saleItem, owned, totalCoins } = this.props;

    return (
      <div
        className={classNames('vendor-item', {
          unavailable: !saleItem.unlocked
        })}
      >
        {owned && <img className="owned-icon" src={checkMark} />}
        <ItemPopupTrigger
          item={saleItem.item}
          extraData={{ failureStrings: [saleItem.failureStrings] }}
        >
          <ConnectedInventoryItem item={saleItem.item} allowFilter={true} />
        </ItemPopupTrigger>
        {saleItem.costs.length > 0 && (
          <div className="vendor-costs">
            {saleItem.costs.map((cost) => (
              <D1VendorItemCost key={cost.currency.itemHash} cost={cost} totalCoins={totalCoins} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

function D1VendorItemCost({
  cost,
  totalCoins
}: {
  cost: VendorCost;
  totalCoins: {
    [currencyHash: number]: number;
  };
}) {
  return (
    <div
      className={classNames('cost', {
        notenough: totalCoins[cost.currency.itemHash] < cost.value
      })}
    >
      {cost.value}{' '}
      <span className="currency">
        <BungieImage src={cost.currency.icon} title={cost.currency.itemName} />
      </span>
    </div>
  );
}
