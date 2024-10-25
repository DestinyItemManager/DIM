import BungieImage from 'app/dim-ui/BungieImage';
import { currenciesSelector } from 'app/inventory/selectors';
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
      {/* add 0-2 blank slots to keep each currencyGroup rounded to a multiple of 3 (for css grid) */}
      {Array.from({ length: (3 - (currencies.length % 3)) % 3 }, (_, i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
    </React.Fragment>
  ) : null;
});
