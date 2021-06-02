import BungieImage from 'app/dim-ui/BungieImage';
import { currenciesSelector } from 'app/inventory/selectors';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './AccountCurrencies.m.scss';

// TO-DO: top level currency display should really be a handpicked list, not
// a naive echo of whatever the API decides is a currency
const synthCurrencies = [
  1583786617, // InventoryItem "Synthweave Template"
  3107195131, // InventoryItem "Sleek Synthcord"
  3552107018, // InventoryItem "Plush Synthcord"
  3855200273, // InventoryItem "Rigid Synthcord"
  3905974032, // InventoryItem "Synthstrand"
  1498161294, // InventoryItem "Synthweave Bolt"
  4019412287, // InventoryItem "Synthweave Strap"
  4238733045, // InventoryItem "Synthweave Plate"
];

/** The account currencies (glimmer, shards, etc.) */
export default React.memo(function AccountCurrency() {
  const currencies = useSelector(currenciesSelector);
  const [synth, other] = _.partition(currencies, (c) => synthCurrencies.includes(c.itemHash));
  return (
    <>
      {[other, synth].map(
        (currencyGroup, ci) =>
          currencyGroup.length > 0 && (
            <React.Fragment key={currencyGroup.map((c) => c.itemHash).join()}>
              {currencyGroup.map((currency) => (
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
              {/* add 0-3 blank slots to keep each currencyGroup rounded to a multiple of 4 (for css grid) */}
              {_.times((4 - (currencyGroup.length % 4)) % 4, (i) => (
                <React.Fragment key={`${ci}-${i}`}>
                  <div />
                  <div />
                </React.Fragment>
              ))}
            </React.Fragment>
          )
      )}
    </>
  );
});
