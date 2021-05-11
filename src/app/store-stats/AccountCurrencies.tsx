import BungieImage from 'app/dim-ui/BungieImage';
import { currenciesSelector } from 'app/inventory/selectors';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './AccountCurrencies.m.scss';

/** The account currencies (glimmer, shards, etc.) */
export default React.memo(function AccountCurrency() {
  const currencies = useSelector(currenciesSelector);
  return (
    <>
      {currencies.map((currency) => (
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
      {_.times(4 - (currencies.length % 4), (i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
    </>
  );
});
