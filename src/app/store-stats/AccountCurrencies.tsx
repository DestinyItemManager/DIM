import { destinyVersionSelector } from 'app/accounts/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { currenciesSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './AccountCurrencies.m.scss';

/** The account currencies (glimmer, shards, etc.) */
export default memo(function AccountCurrency() {
  let currencies = useSelector(currenciesSelector);
  const destinyVersion = useSelector(destinyVersionSelector);
  const defs = useD2Definitions();
  let missingSilver = false;

  if (
    destinyVersion === 2 &&
    defs &&
    !currencies.some((c) => c.itemHash === 3147280338 /* Silver */)
  ) {
    const silverDef = defs.InventoryItem.get(3147280338);
    missingSilver = true;
    currencies = [
      ...currencies,
      { itemHash: silverDef.hash, quantity: 0, displayProperties: silverDef.displayProperties },
    ];
  }

  return currencies.length > 0 ? (
    <React.Fragment key={currencies.map((c) => c.itemHash).join()}>
      {currencies.map((currency) => {
        const isMissingSilver = missingSilver && currency.itemHash === 3147280338;
        const title = isMissingSilver
          ? t('Inventory.MissingSilver')
          : `${currency.quantity.toLocaleString()} ${currency.displayProperties.name}`;
        return (
          <React.Fragment key={currency.itemHash}>
            <BungieImage
              className={clsx(styles.icon, {
                [styles.faded]: isMissingSilver,
              })}
              src={currency.displayProperties.icon}
              title={title}
            />
            <div
              className={clsx(styles.text, {
                [styles.faded]: isMissingSilver,
              })}
              title={title}
            >
              {isMissingSilver ? '???' : currency.quantity.toLocaleString()}
            </div>
          </React.Fragment>
        );
      })}
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
