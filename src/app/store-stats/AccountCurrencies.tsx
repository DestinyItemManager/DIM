import React from 'react';
import _ from 'lodash';
import BungieImage from 'app/dim-ui/BungieImage';
import type { DimVault } from '../inventory/store-types';
import styles from './AccountCurrencies.m.scss';

/** The account currencies (glimmer, shards, etc.) */
export default function AccountCurrency({ store }: { store: DimVault }) {
  return (
    <>
      {store.currencies.map((currency) => (
        <React.Fragment key={currency.itemHash}>
          <BungieImage
            className={styles.currency}
            src={currency.displayProperties.icon}
            title={currency.displayProperties.name}
          />
          <div className={styles.currency} title={currency.displayProperties.name}>
            {currency.quantity.toLocaleString()}
          </div>
        </React.Fragment>
      ))}
      {_.times(4 - store.currencies.length, (i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
    </>
  );
}
