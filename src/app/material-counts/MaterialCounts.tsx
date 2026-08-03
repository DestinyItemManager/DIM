import { destinyVersionSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import {
  currenciesSelector,
  materialsSelector,
  transmogCurrenciesSelector,
  upgradeCurrenciesSelector,
} from 'app/inventory/selectors';
import { AccountCurrency } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { compact, filterMap } from 'app/utils/collections';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { addDividers } from 'app/utils/react';
import clsx from 'clsx';
import glimmerMats from 'data/d2/spider-mats.json' with { type: 'json' };
import { useSelector } from 'react-redux';
import * as styles from './MaterialCounts.m.scss';

const upgradeMats = [
  4257549984, // Enhancement Prism
  3853748946, // Enhancement Core
  2718300701, // Unstable Cores
  4257549985, // Ascendant Shard
  353704689, // Ascendant Alloy
  3467984096, // Exotic Cipher
  2228452164, // Deepsight Harmonizer
];

// Deprecated or otherwise uninteresting materials
// TODO: Generate this in d2ai based on items that say "This item serves no purpose and can be safely dismantled."
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
  2512446424, // Nonary Manifold
  443031983, // Phantasmal Core
];

// Synthcord is a material, Synthweave is a currency
const transmogMats = [
  3855200273, // InventoryItem "Rigid Synthcord"
  3552107018, // InventoryItem "Plush Synthcord"
  3107195131, // InventoryItem "Sleek Synthcord"
];

export function MaterialCounts({
  wide,
  includeCurrencies,
}: {
  wide?: boolean;
  includeCurrencies?: boolean;
}) {
  const defs = useD2Definitions()!;
  const allMats = useSelector(materialsSelector);
  const materials = Map.groupBy(allMats, (m) => m.hash);
  for (const h of hiddenMats) {
    materials.delete(h);
  }

  let currencies = useSelector(currenciesSelector);
  const destinyVersion = useSelector(destinyVersionSelector);
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
  let transmogCurrencies = useSelector(transmogCurrenciesSelector);
  const upgradeCurrencies = useSelector(upgradeCurrenciesSelector);

  // TODO: This bucket hash doesn't have a name in the manifest, so I'm not sure if it's "Seasonal" or "Kepler".
  const seasonalMats = allMats.filter((m) => m.bucket.hash === 2207872501).map((m) => m.hash);

  // Track materials which have already appeared, in case these categories overlap
  const shownMats = new Set<number>();
  const matsToCurrencies = (matgroup: number[]) =>
    filterMap(matgroup, (h): AccountCurrency | undefined => {
      const items = materials.get(h);
      if (!items || shownMats.has(h)) {
        return undefined;
      }
      shownMats.add(h);
      const amount = items.reduce((total, i) => total + i.amount, 0);
      if (amount === undefined) {
        return undefined;
      }
      const item = items[0];
      return {
        itemHash: item.hash,
        displayProperties: {
          icon: item.icon,
          name: item.name,
          description: item.description,
          hasIcon: Boolean(item.icon),
          iconSequences: [],
          highResIcon: '',
          iconHash: 0,
        },
        quantity: amount,
      };
    });

  const [
    seasonalMatsAsCurrencies,
    upgradeMatsAsCurrencies,
    glimmerMatsAsCurrencies,
    transmogMatsAsCurrencies,
    remainingMatsAsCurrencies,
  ]: AccountCurrency[][] = [
    seasonalMats,
    upgradeMats,
    [
      ...glimmerMats,
      2979281381, // Upgrade Module (deprecated in edge of fate and turned into a source of glimmer/enhancement cores)
    ],
    transmogMats,
    [...materials.keys()],
  ].map(matsToCurrencies);

  upgradeMatsAsCurrencies.push(...upgradeCurrencies);
  transmogCurrencies = [...transmogCurrencies, ...transmogMatsAsCurrencies];

  const content = [
    ...[
      includeCurrencies ? currencies : [],
      upgradeMatsAsCurrencies,
      glimmerMatsAsCurrencies,
      remainingMatsAsCurrencies,
      transmogCurrencies,
      seasonalMatsAsCurrencies,
    ].map(
      (currencies) =>
        currencies.length > 0 && (
          <CurrencyGroup
            key={currencies[0].itemHash}
            currencies={currencies}
            defs={defs}
            missingSilver={missingSilver}
          />
        ),
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

function CurrencyGroup({
  currencies,
  defs,
  missingSilver,
}: {
  currencies: AccountCurrency[];
  defs: D2ManifestDefinitions;
  missingSilver: boolean;
}) {
  return currencies
    .toSorted(
      chainComparator(
        compareBy(({ itemHash }) => defs.InventoryItem.get(itemHash)?.inventory?.tierType ?? 0),
        compareBy(({ displayProperties }) => displayProperties.name),
      ),
    )
    .map((currency) => {
      const isMissingSilver = missingSilver && currency.itemHash === 3147280338;
      const title = isMissingSilver ? t('Inventory.MissingSilver') : undefined;
      return (
        <div className={styles.material} key={currency.itemHash}>
          <span className={styles.amount} title={title}>
            {isMissingSilver ? '???' : currency.quantity.toLocaleString()}
          </span>
          <BungieImage src={currency.displayProperties.icon} />
          <span>{currency.displayProperties.name}</span>
        </div>
      );
    });
}
