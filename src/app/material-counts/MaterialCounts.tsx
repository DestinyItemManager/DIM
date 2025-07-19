import BungieImage from 'app/dim-ui/BungieImage';
import {
  currenciesSelector,
  materialsSelector,
  transmogCurrenciesSelector,
  vendorCurrencyEngramsSelector,
} from 'app/inventory/selectors';
import { AccountCurrency } from 'app/inventory/store-types';
import { compact } from 'app/utils/collections';
import { addDividers } from 'app/utils/react';
import clsx from 'clsx';
import glimmerMats from 'data/d2/spider-mats.json';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './MaterialCounts.m.scss';

const goodMats = [
  800069450, // Strange Coins
  2569113415, // Strange Coin (Exotic)
  3702027555, // Spoils of Conquest
];
const upgradeMats = [
  2979281381, // Upgrade Module
  4257549984, // Enhancement Prism
  3853748946, // Enhancement Core
  2718300701, // Unstable Cores
  4257549985, // Ascendant Shard
  353704689, // Ascendant Alloy
  3467984096, // Exotic Cipher
];

// Deprecated or otherwise uninteresting materials
const hiddenMats = [
  529424730, // Upgrade Points
  1624697519, // Engram Tracker
  592227263, // Baryon Bough
  950899352, // Dusklight Shard
  1485756901, // Glacial Starwort
  3592324052, // Helium Filaments
  4046539562, // Mod Components
  4114204995, // Ghost Fragments
  1289622079, // Strand Meditations
];

export function MaterialCounts({
  wide,
  includeCurrencies,
}: {
  wide?: boolean;
  includeCurrencies?: boolean;
}) {
  const allMats = useSelector(materialsSelector);
  const materials = Map.groupBy(allMats, (m) => m.hash);
  for (const h of hiddenMats) {
    materials.delete(h);
  }

  const currencies = useSelector(currenciesSelector);
  const transmogCurrencies = useSelector(transmogCurrenciesSelector);
  const vendorCurrencyEngrams = useSelector(vendorCurrencyEngramsSelector);

  // Track materials which have already appeared, in case these categories overlap
  const shownMats = new Set<number>();
  const content = [
    includeCurrencies && <CurrencyGroup key="currencies" currencies={currencies} />,
    vendorCurrencyEngrams.length > 0 && (
      <CurrencyGroup key="engrams" currencies={vendorCurrencyEngrams} />
    ),
    ...[goodMats, upgradeMats, glimmerMats, [...materials.keys()]].map((matgroup) => (
      <React.Fragment key={matgroup[0]}>
        {matgroup.map((h) => {
          const items = materials.get(h);
          if (!items || shownMats.has(h)) {
            return null;
          }
          shownMats.add(h);
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
        compact(content),
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
