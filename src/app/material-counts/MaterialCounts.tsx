import BungieImage from 'app/dim-ui/BungieImage';
import {
  craftingMaterialCountsSelector,
  currenciesSelector,
  materialsSelector,
  transmogCurrenciesSelector,
} from 'app/inventory/selectors';
import clsx from 'clsx';
import spiderMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './MaterialCounts.m.scss';

const showMats = spiderMats;
const goodMats = [2979281381, 4257549984, 3853748946, 4257549985, 3702027555];
const seasonal = [1224079819, 1289622079, 1471199156];
const crafting = [2497395625, 353704689, 2708128607];

export function MaterialCounts({
  wide,
  includeCurrencies,
}: {
  wide?: boolean;
  includeCurrencies?: boolean;
}) {
  const allMats = useSelector(materialsSelector);
  const craftingMaterialCounts = useSelector(craftingMaterialCountsSelector);
  const materials = _.groupBy(allMats, (m) => m.hash);

  const currencies = useSelector(currenciesSelector);
  const transmogCurrencies = useSelector(transmogCurrenciesSelector);

  return (
    <div className={clsx(styles.materialCounts, { [styles.wide]: wide })}>
      {includeCurrencies &&
        currencies.map((currency) => (
          <div className={styles.material} key={currency.itemHash}>
            <span className={styles.amount}>{currency.quantity.toLocaleString()}</span>
            <BungieImage src={currency.displayProperties.icon} />
            <span>{currency.displayProperties.name}</span>
          </div>
        ))}
      {[seasonal, goodMats, crafting, showMats].map((matgroup, i) => (
        <React.Fragment key={matgroup[0]}>
          {(includeCurrencies || i > 0) && (
            <span className={styles.spanGrid}>
              <hr />
            </span>
          )}
          {/* tack on a special section when we hit the crafting mats group */}
          {matgroup.includes(353704689) && (
            <>
              {craftingMaterialCounts.map(([name, icon, count]) => (
                <React.Fragment key={name}>
                  <span className={styles.amount}>{count.toLocaleString()}</span>
                  <BungieImage src={icon} />
                  <span>{name}</span>
                </React.Fragment>
              ))}
            </>
          )}
          {matgroup.map((h) => {
            const items = materials[h];
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
      ))}
      {transmogCurrencies.length > 0 && (
        <>
          <span className={styles.spanGrid}>
            <hr />
          </span>
          {transmogCurrencies.map((currency) => (
            <div className={styles.material} key={currency.itemHash}>
              <span className={styles.amount}>{currency.quantity.toLocaleString()}</span>
              <BungieImage src={currency.displayProperties.icon} />
              <span>{currency.displayProperties.name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
