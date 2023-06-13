import BungieImage from 'app/dim-ui/BungieImage';
import { currenciesSelector } from 'app/inventory/selectors';
import _ from 'lodash';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import styles from './AccountCurrencies.m.scss';

/** The account currencies (glimmer, shards, etc.) */
export default memo(function AccountCurrency() {
  const currencies = useSelector(currenciesSelector);
  return currencies.length > 0 ? (
    <React.Fragment key={currencies.map((c) => c.itemHash).join()}>
      {currencies.map((currency) => (
        <React.Fragment key={currency.itemHash}>
          <BungieImage
            className={styles.icon}
            src={currency.displayProperties.icon}
            title={currency.displayProperties.name}
          />
          <div
            className={styles.text}
            title={`${currency.quantity.toLocaleString()} ${currency.displayProperties.name}`}
          >
            {currency.quantity.toLocaleString()}
          </div>
        </React.Fragment>
      ))}
      {/* add 0-3 blank slots to keep each currencyGroup rounded to a multiple of 4 (for css grid) */}
      {_.times((4 - (currencies.length % 4)) % 4, (i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
    </React.Fragment>
  ) : null;
});
