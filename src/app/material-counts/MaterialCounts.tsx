import BungieImage from 'app/dim-ui/BungieImage';
import {
  currenciesSelector,
  materialsSelector,
  transmogCurrenciesSelector,
  vendorCurrencyEngramsSelector,
} from 'app/inventory/selectors';
import { AccountCurrency } from 'app/inventory/store-types';
import { addDividers } from 'app/utils/react';
import clsx from 'clsx';
import glimmerMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './MaterialCounts.m.scss';

const goodMats = [800069450, 2569113415, 3702027555];
const upgradeMats = [2979281381, 4257549984, 3853748946, 4257549985, 353704689, 3467984096];
const seasonal = [1289622079, 1471199156];

export function MaterialCounts({
  wide,
  includeCurrencies,
}: {
  wide?: boolean;
  includeCurrencies?: boolean;
}) {
  const allMats = useSelector(materialsSelector);
  const materials = Map.groupBy(allMats, (m) => m.hash);

  const currencies = useSelector(currenciesSelector);
  const transmogCurrencies = useSelector(transmogCurrenciesSelector);
  const vendorCurrencyEngrams = useSelector(vendorCurrencyEngramsSelector);

  const content = [
    includeCurrencies && <CurrencyGroup key="currencies" currencies={currencies} />,
    vendorCurrencyEngrams.length > 0 && (
      <CurrencyGroup key="engrams" currencies={vendorCurrencyEngrams} />
    ),
    ...[goodMats, upgradeMats, glimmerMats, seasonal].map((matgroup) => (
      <React.Fragment key={matgroup[0]}>
        {matgroup.map((h) => {
          const items = materials.get(h);
          if (!items) {
            return null;
          }
          const amount = items.reduce((total, i) => total + i.amount, 0);
          const item = items[0];
          const materialName = item.name;
          const icon = item.icon;

          if (amount === undefined) {
            return null;
          }

          return (
            <div className={styles.material} key={h}>
              <span className={styles.amount}>{amount.toLocaleString()}</span>
              <BungieImage src={icon} />
              <span>{materialName}</span>
            </div>
          );
        })}
      </React.Fragment>
    )),
    transmogCurrencies.length > 0 && (
      <CurrencyGroup key="transmog" currencies={transmogCurrencies} />
    ),
  ];

  return (
    <div className={clsx(styles.materialCounts, { [styles.wide]: wide })}>
      {addDividers(
        _.compact(content),
        <span className={styles.spanGrid}>
          <hr />
        </span>,
      )}
    </div>
  );
}

function CurrencyGroup({ currencies }: { currencies: AccountCurrency[] }) {
  return currencies.map((currency) => (
    <div className={styles.material} key={currency.itemHash}>
      <span className={styles.amount}>{currency.quantity.toLocaleString()}</span>
      <BungieImage src={currency.displayProperties.icon} />
      <span>{currency.displayProperties.name}</span>
    </div>
  ));
}
