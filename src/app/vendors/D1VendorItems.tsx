import * as React from 'react';
import * as _ from 'lodash';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { Vendor, VendorCost } from './vendor.service';
import D1VendorItem from './D1VendorItem';
import { hasBadge } from '../inventory/get-badge-info';

/**
 * Display the items for a single vendor, organized by category.
 */
export default function D1VendorItems({
  vendor,
  totalCoins,
  ownedItemHashes
}: {
  vendor: Vendor;
  totalCoins: {
    [currencyHash: number]: number;
  };
  ownedItemHashes: Set<number>;
}) {
  const allCurrencies: { [hash: number]: VendorCost['currency'] } = {};

  vendor.allItems.forEach((saleItem) => {
    saleItem.costs.forEach((cost) => {
      allCurrencies[cost.currency.itemHash] = cost.currency;
    });
  });

  return (
    <div className="vendor-char-items">
      {!_.isEmpty(allCurrencies) && (
        <div className="vendor-currencies">
          {Object.values(allCurrencies).map((currency) => (
            <div className="vendor-currency" key={currency.itemHash}>
              {(totalCoins && totalCoins[currency.itemHash]) || 0}{' '}
              <BungieImage src={currency.icon} title={currency.itemName} />
            </div>
          ))}
        </div>
      )}
      <div className="vendor-item-categories">
        {_.map(vendor.categories, (category) => (
          <div className="vendor-row" key={category.index}>
            <h3 className="category-title">{category.title || 'Unknown'}</h3>
            <div
              className={classNames('vendor-items', {
                'no-badge': category.saleItems.every((i) => !hasBadge(i.item))
              })}
            >
              {_.sortBy(category.saleItems, (i) => i.item.name).map((item) => (
                <D1VendorItem
                  key={item.index}
                  saleItem={item}
                  owned={ownedItemHashes.has(item.item.hash)}
                  totalCoins={totalCoins}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
