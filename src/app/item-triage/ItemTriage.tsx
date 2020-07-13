import React, { useEffect, useState } from 'react';
import { D2Item } from '../inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import SpecialtyModSlotIcon, {
  getArmorSlotSpecificModSocketDisplayName,
  ArmorSlotSpecificModSocketIcon,
} from 'app/dim-ui/SpecialtyModSlotIcon';
import ElementIcon from 'app/inventory/ElementIcon';
import styles from './ItemTriage.m.scss';
import _ from 'lodash';
import { KeepJunkDial, getValueColors } from './ValueDial';
import BungieImage from 'app/dim-ui/BungieImage';
import { getItemSpecialtyModSlotDisplayName } from 'app/utils/item-utils';
import { getAllItems } from 'app/inventory/stores-helpers';
import { classIcons } from 'app/inventory/StoreBucket';
import AppIcon from 'app/shell/icons/AppIcon';

/** a factor of interest */
interface Factor {
  id: string;
  /** bother checking this factor, if the seed item returns truthy */
  runIf(item: D2Item): any;
  render(item: D2Item): React.ReactElement;
  value(item: D2Item): string | number;
}

// factors someone might value in an item, like its mod slot or its element
const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: (item) => <AppIcon icon={classIcons[item.classType]} className={styles.classIcon} />,
    value: (item) => item.classType.toString(),
  },
  name: {
    id: 'name',
    runIf: () => true,
    render: (item) => (
      <>
        <BungieImage className={styles.inlineIcon} src={item.icon} /> {item.name}
      </>
    ),
    value: (item) => item.name,
  },
  element: {
    id: 'element',
    runIf: (item) => item.element,
    render: (item) => <ElementIcon className={styles.inlineIcon} element={item.element} />,
    value: (item) => item.element?.displayProperties.name ?? '',
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: getItemSpecialtyModSlotDisplayName,
    render: (item) => (
      <SpecialtyModSlotIcon className={styles.inlineIcon} item={item} lowRes={true} />
    ),
    value: getItemSpecialtyModSlotDisplayName,
  },
  armorSlot: {
    id: 'armorSlot',
    runIf: getArmorSlotSpecificModSocketDisplayName,
    render: (item) => (
      <ArmorSlotSpecificModSocketIcon className={styles.inlineIcon} item={item} lowRes={true} />
    ),
    value: getArmorSlotSpecificModSocketDisplayName,
  },
};

// which factors to check for which buckets
const factorCombos = {
  Weapons: [[itemFactors.element]],
  Armor: [
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket, itemFactors.armorSlot],
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket],
    [itemFactors.name],
  ],
  General: [[itemFactors.element]],
};
type factorComboCategory = keyof typeof factorCombos;
const factorComboCategories = Object.keys(factorCombos);
// const allCombosToCalculate: Factor[][] = _.uniqWith(Object.values(factorCombos).flat(), _.isEqual);

// surprisingly chill. this seems to just render 2x when item popup spawns.
// much fewer than i worried. why twice though??
export default function ItemTriage({ item }: { item: D2Item }) {
  const [notableStats, setNotableStats] = useState<ReturnType<typeof getNotableStats>>();
  const [itemFactors, setItemFactors] = useState<ReturnType<typeof getSimilarItems>>();
  //
  useEffect(() => {
    if (item.bucket.inArmor) {
      setNotableStats(getNotableStats(item));
    }
    setItemFactors(getSimilarItems(item));
  }, [item]);

  // this lets us lay out the factor categories before we have their calculated numbers
  // useEffect fills those in later for us
  // we rely on factorCombosToDisplay and itemFactors to have the same number of elements
  const factorCombosToDisplay = getItemFactorComboDisplays(item);

  return (
    <div className={styles.itemTriagePane}>
      <div className={styles.triageTable}>
        <div className={`${styles.factorCombo} ${styles.header}`}>This item</div>
        <div className={`${styles.comboCount} ${styles.header}`}>Similar items</div>
        <div className={`${styles.keepMeter} ${styles.header}`} />
        <div className={styles.headerDivider} />
        {factorCombosToDisplay.length > 0 &&
          factorCombosToDisplay.map((comboDisplay, i) => (
            <>
              {comboDisplay}
              <div className={styles.comboCount}>{itemFactors?.[i].count}</div>
              <div className={styles.keepMeter}>
                {itemFactors && <KeepJunkDial value={itemFactors[i].count} />}
              </div>
            </>
          ))}
      </div>
      {notableStats && (
        <div className={styles.triageTable}>
          <div className={`${styles.bestStat} ${styles.header}`}>
            Best item (
            <ArmorSlotSpecificModSocketIcon
              className={styles.inlineIcon}
              item={item}
              lowRes={true}
            />
            )
          </div>
          <div className={`${styles.thisStat} ${styles.header}`}>This item</div>
          <div className={`${styles.keepMeter} ${styles.header}`} />
          <div className={styles.headerDivider} />

          {notableStats.map(({ best, quality, percent, stat }) => (
            <>
              <div className={styles.bestStat}>
                <span className={styles.statIconWrapper}>
                  {(stat.displayProperties.icon && (
                    <BungieImage
                      key={stat.statHash}
                      className={styles.inlineIcon}
                      src={stat.displayProperties.icon}
                    />
                  )) ||
                    ' '}
                </span>
                <span className={styles.statValue}>{best}</span>{' '}
                <span className={styles.dimmed}>{stat.displayProperties.name}</span>
              </div>
              <div className={styles.thisStat}>
                <span className={styles.statValue}>{stat.base}</span> (
                <span style={{ color: getValueColors(quality)[1] }}>{percent}%</span>)
              </div>
              <div className={styles.keepMeter}>
                <KeepJunkDial value={quality} />
              </div>
            </>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * for all items relevant for comparison to the seed item, processes them into a Record,
 * keyed by item factor combination i.e. "arcwarlockopulent"
 * with values representing how many of that type you own
 */
function collectRelevantItemFactors(exampleItem: D2Item) {
  const combinationCounts: { [key: string]: number } = {};
  getAllItems(exampleItem.getStoresService().getStores())
    .filter(
      (i) =>
        // compare only items with the same canonical bucket.
        i.bucket.sort === exampleItem.bucket.sort &&
        // accept anything if seed item is class unknown
        (exampleItem.classType === DestinyClass.Unknown ||
          // or accept individual items if they're matching or unknown.
          i.classType === DestinyClass.Unknown ||
          i.classType === exampleItem.classType)
    )
    .forEach((item: D2Item) => {
      factorCombos[exampleItem.bucket.sort as factorComboCategory].forEach((factorCombo) => {
        const combination = applyFactorCombo(item, factorCombo);
        combinationCounts[combination] = (combinationCounts[combination] ?? 0) + 1;
      });
    });
  return combinationCounts;
}
function getSimilarItems(exampleItem: D2Item) {
  if (!factorComboCategories.includes(exampleItem.bucket.sort ?? '')) {
    return [];
  }
  const relevantFactors = collectRelevantItemFactors(exampleItem);
  return factorCombos[exampleItem.bucket.sort as factorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => {
      const count = relevantFactors[applyFactorCombo(exampleItem, factorCombo)] - 1;
      return {
        /** how many similar items you have including this one */
        count,
        /**
         * quality is a number representing keepworthiness
         * i forget how i decided tihs or how it is calculated
         * obviously it needs to change
         */
        quality: 100 - count * (100 / 3),
        // /**
        //  * what to render to represent this combination of factors
        //  * i.e. a warlock icon and a purple swirl, for void warlock armor
        //  */
        // display: renderFactorCombo(exampleItem, factorCombo),
      };
    });
}
function getItemFactorComboDisplays(exampleItem: D2Item) {
  if (!factorComboCategories.includes(exampleItem.bucket.sort ?? '')) {
    return [];
  }
  return factorCombos[exampleItem.bucket.sort as factorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => renderFactorCombo(exampleItem, factorCombo));
}

/**
 * given a seed item (one that all items will be compared to),
 * derives all items from stores, then gathers stat maxes for items worth comparing
 */
function collectRelevantStatMaxes(exampleItem: D2Item) {
  // highest values found in relevant items, keyed by stat hash
  const statMaxes: Record<number, number> = {};
  getAllItems(exampleItem.getStoresService().getStores())
    .filter(
      (i) =>
        // compare only items with the same canonical bucket.
        i.bucket.hash === exampleItem.bucket.hash &&
        // accept anything if seed item is class unknown
        (exampleItem.classType === DestinyClass.Unknown ||
          // or accept individual items if they're matching or unknown.
          i.classType === DestinyClass.Unknown ||
          i.classType === exampleItem.classType) &&
        // accept any tier if seed item is exotic, or filter out exotics if this item isn't
        (exampleItem.tier === 'Exotic' || i.tier !== 'Exotic')
    )
    .forEach((item) => {
      if (item.stats) {
        item.stats.forEach((stat) => {
          const bestStatSoFar: number =
            statMaxes[stat.statHash] ?? (stat.smallerIsBetter ? 9999999 : -9999999);
          const newBestStat = (stat.smallerIsBetter ? Math.min : Math.max)(
            bestStatSoFar,
            stat.base
          );
          statMaxes[stat.statHash] = newBestStat;
        });
      }
    });
  return statMaxes;
}

// a stat is notable on seed item when it's at least this % of the best owned
const notabilityThreshold = 0.8;
/**
 * returns an entry for each notable stat found on the seed item
 */
function getNotableStats(exampleItem: D2Item) {
  const statMaxes = collectRelevantStatMaxes(exampleItem);
  return exampleItem.stats
    ?.filter((stat) => stat.base / statMaxes[stat.statHash] >= notabilityThreshold)
    .map((stat) => {
      const best = statMaxes[stat.statHash];
      const rawRatio = stat.base / best;
      return {
        /** quality is a number from 0 to 1 representing keepworthiness */
        quality: 100 - (10 - Math.floor(rawRatio * 10)) * (100 / 3),
        /** seed item's value for this stat */
        stat,
        /** best of this stat */
        best,
        /** whole # percentage of seed item's stat compared to the best of that stat */
        percent: Math.floor(rawRatio * 100),
      };
    });
}

/**
 * turns an array of factors into a string
 * i.e. "class2,elementVoid"
 * for factorCombo [class, element]
 * and an item that's a warlock void armor
 */
function applyFactorCombo(item: D2Item, factorCombo: Factor[]) {
  return factorCombo.map((factor) => factor.id + factor.value(item)).join();
}

/**
 * turns an array of factors into UI to represent this combination of factors
 * i.e. a warlock icon and a purple swirl,
 * for factorCombo [class, element]
 * and an exampleItem that's a warlock void armor
 */
function renderFactorCombo(exampleItem: D2Item, factorCombo: Factor[]) {
  return (
    <div className={styles.factorCombo}>
      {factorCombo.map((factor) => factor.render(exampleItem))}
    </div>
  );
}

// console.log(combosToCalculate);
// export type TagValue = keyof typeof tagConfig | 'clear' | 'lock' | 'unlock';
// interface Factor {
//   render: React.ReactElement;
//   compareToExample(i: D2Item): boolean;
//   overallAdjust(overall: number, item: D2Item): number;
// }
// type FactorGenerator = (exampleItem: D2Item, statHash?: number) => Factor;

// these contain a rendered version of a desirable item factor,
// and a function to compare other items to the triaged one
// const itemElement: FactorGenerator = (exampleItem) => ({
//   render: <ElementIcon className={styles.inlineIcon} element={exampleItem.dmg} />,
//   compareToExample: (i: D2Item) => i.dmg === exampleItem.dmg,
//   overallAdjust: (overall: number, _item: D2Item) => overall++
// });
// const itemSpecialtySocket: FactorGenerator = (exampleItem) => ({
//   render: <SpecialtyModSocketIcon className={styles.inlineIcon} item={exampleItem} lowRes={true} />,
//   compareToExample: (i: D2Item) =>
//     getSpecialtyModSocketDisplayName(i) === getSpecialtyModSocketDisplayName(exampleItem),
//   overallAdjust: (overall: number, _item: D2Item) => overall++
// });
// const itemArmorSlotSpecificSocket: FactorGenerator = (exampleItem) => ({
//   render: (
//     <ArmorSlotSpecificModSocketIcon
//       className={styles.inlineIcon}
//       item={exampleItem}
//       lowRes={true}
//     />
//   ),
//   compareToExample: (i: D2Item) =>
//     getArmorSlotSpecificModSocketDisplayName(i) ===
//     getArmorSlotSpecificModSocketDisplayName(exampleItem),
//   overallAdjust: (overall: number, _item: D2Item) => overall++
// });

// const itemStat: FactorGenerator = (exampleItem: D2Item, statHash) => {
//   const statDisplayProperties = exampleItem.stats?.find((s) => s.statHash === statHash)
//     ?.displayProperties;
//   return {
//     render: (
//       <>
//         {statDisplayProperties && statDisplayProperties.icon && (
//           <BungieImage className={styles.inlineIcon} src={statDisplayProperties.icon} />
//         )}
//         {statDisplayProperties && statDisplayProperties.name}
//       </>
//     ),
//     compareToExample: (_i: D2Item) => true,
//     overallAdjust: (overall: number, item: D2Item) =>
//       Math.max(overall, item.stats?.find((s) => s.statHash === statHash)?.base ?? 0)
//   };
// };

// a function
// function checkFactors(exampleItem: D2Item) {
//   const allItemFactors = getAllItemFactors(exampleItem);
//   const matchedFactors = factorCombos[exampleItem.bucket.sort as keyof typeof factorCombos].filter(
//     (factorCombo) => !(allItemFactors[applyFactorCombo(exampleItem, factorCombo)] > 999)
//   );
//   return matchedFactors.map((factorCombo) => renderFactorCombo(exampleItem, factorCombo));
// }

// /**
//  * given an item, derives all items from stores, then gathers stat maxes
//  */
// function getStatMaxes(exampleItem: D2Item) {
//   const statMaxes: {
//     'exotic or below': { [key: number]: number };
//     'legendary or below': { [key: number]: number };
//   } = {
//     'exotic or below': {},
//     'legendary or below': {},
//   };
//   getAllItems(exampleItem.getStoresService().getStores())
//     .filter(
//       (i) =>
//         i.bucket.hash === exampleItem.bucket.hash &&
//         (exampleItem.classType === DestinyClass.Unknown ||
//           i.classType === DestinyClass.Unknown ||
//           i.classType === exampleItem.classType)
//     )
//     .forEach((item) => {
//       if (item.stats) {
//         const tierInfo =
//           item.tier === 'Exotic' ? ['exotic or below'] : ['legendary or below', 'everything'];
//         item.stats.forEach((stat) => {
//           tierInfo.forEach((tier) => {
//             const bestStatNow: number =
//               statMaxes[tier][stat.statHash] ?? (stat.smallerIsBetter ? 9999999 : -9999999);
//             const newBestStat = (stat.smallerIsBetter ? Math.min : Math.max)(
//               bestStatNow,
//               stat.base
//             );
//             statMaxes[tier][stat.statHash] = newBestStat;
//           });
//         });
//       }
//     });
//   return statMaxes;
// }

// function getItemDesirableFactors(exampleItem: D2Item) {
// const statsToFindMaxesFor = armorStatHashes.concat(exampleItem.primStat?.statHash ?? []);

// itemCollections.sort -- in the same major category (Weapons|Armor|General|Inventory)
// const itemCollections: { [key: string]: D2Item[] } = {
//   sort: exampleItem
//     .getStoresService()
//     .getAllItems()
//     .filter(
//       (i) =>
//         i.bucket.sort === exampleItem.bucket.sort &&
//         (exampleItem.classType === DestinyClass.Unknown ||
//           i.classType === DestinyClass.Unknown ||
//           i.classType === exampleItem.classType)
//     )
// };
// // itemCollections.slot -- in the same slot (Energy Weapons|Power Weapons|Helmet|Ghost|etc)
// itemCollections.slot = itemCollections.sort.filter(
//   (i) => i.bucket.hash === exampleItem.bucket.hash
// );

// exampleItem
//   .getStoresService()
//   .getAllItems()
//   .filter(
//     (i) =>
//       i.bucket.sort === exampleItem.bucket.sort &&
//       (exampleItem.classType === DestinyClass.Unknown ||
//         i.classType === DestinyClass.Unknown ||
//         i.classType === exampleItem.classType)
//   );

// const factorFinders: {
//   factors: Factor[];
//   overall: any;
// }[] = [];

// if (exampleItem.bucket.sort && ['Weapons'].includes(exampleItem.bucket.sort)) {
//   factorFinders.push({
//     factors: [itemElement(exampleItem)],
//     overall: 0
//   });
// }

// if (exampleItem.bucket.sort && ['Armor'].includes(exampleItem.bucket.sort)) {
//   if (getSpecialtyModSocketDisplayName(exampleItem)) {
//     factorFinders.push(
//       {
//         factors: [itemArmorSlotSpecificSocket(exampleItem), itemSpecialtySocket(exampleItem)],
//         overall: 0
//       },
//       {
//         factors: [itemElement(exampleItem), itemSpecialtySocket(exampleItem)],
//         overall: 0
//       },
//       ...statsToFindMaxesFor.map((statHash) => ({
//         factors: [itemStat(exampleItem, statHash)],
//         overall: 0
//       }))
//     );
//   }
// }

// factorFinders.forEach((factorFinder) =>
//   itemCollections.slot.forEach((item) => {
//     if (factorFinder.factors.every((factor) => factor.compareToExample(item))) {
//       factorFinder.overall = factorFinder.factors[0].overallAdjust(factorFinder.overall, item);
//     }
//   })
// );
// t('Triage.HighestInSlot'),
// t('Triage.NumberOfThese'),

// remove filters this item doesn't meet the standards for
// console.log(factorFinders);
// return factorFinders;
/*.filter(
    (factorFinder) =>
      // (factorFinder.compare === 'max' && f.overall <= f.accessor(item)) ||
      factorFinder.overall === 1
  );*/
// }
/*
function NumberOfItemType({ item }: { item: D2Item }) {
  t('Triage.NumberOfThese');
}
*/

// function logthru<T>(x: T): T {
//   console.log(x);
//   return x;
// }
