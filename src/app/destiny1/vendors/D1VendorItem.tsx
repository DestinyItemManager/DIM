import React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import clsx from 'clsx';
import { VendorSaleItem, VendorCost } from './vendor.service';
import styles from '../../vendors/VendorItem.m.scss';
import { VendorItemDisplay } from '../../vendors/VendorItemComponent';

interface Props {
  saleItem: VendorSaleItem;
  owned: boolean;
  totalCoins: {
    [currencyHash: number]: number;
  };
}

export default function D1VendorItem({ saleItem, owned, totalCoins }: Props) {
  return (
    <VendorItemDisplay
      item={saleItem.item}
      owned={owned}
      unavailable={!saleItem.unlocked}
      extraData={{ failureStrings: [saleItem.failureStrings] }}
    >
      {saleItem.costs.length > 0 && (
        <div className={styles.vendorCosts}>
          {saleItem.costs.map((cost) => (
            <D1VendorItemCost key={cost.currency.itemHash} cost={cost} totalCoins={totalCoins} />
          ))}
        </div>
      )}
    </VendorItemDisplay>
  );
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
      className={clsx(styles.cost, {
        [styles.notEnough]: totalCoins[cost.currency.itemHash] < cost.value
      })}
    >
      {cost.value}{' '}
      <span className={styles.currency}>
        <BungieImage src={cost.currency.icon} title={cost.currency.itemName} />
      </span>
    </div>
  );
}
