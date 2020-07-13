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
import { getWeaponArchetype, getWeaponArchetypeSocket } from 'app/dim-ui/WeaponArchetype';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import PressTip from 'app/dim-ui/PressTip';
import { getItemSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import clsx from 'clsx';

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
    render: (item) => (
      <PressTip elementType="span" tooltip={item.classTypeNameLocalized}>
        <AppIcon icon={classIcons[item.classType]} className={styles.classIcon} />
      </PressTip>
    ),
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
    render: (item) => (
      <PressTip elementType="span" tooltip={item.element?.displayProperties.name}>
        <ElementIcon className={clsx(styles.inlineIcon, styles.smaller)} element={item.element} />
      </PressTip>
    ),
    value: (item) => item.element?.displayProperties.name ?? '',
  },
  weaponType: {
    id: 'weaponType',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.typeName}>
        <img
          className={clsx(styles.inlineIcon, styles.smaller, styles.weaponSvg)}
          src={getItemSvgIcon(item)}
        />
      </PressTip>
    ),
    value: (item) => item.typeName ?? '',
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
  archetype: {
    id: 'archetype',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => {
      const archetypeSocket = getWeaponArchetypeSocket(item);
      return (
        <>
          {archetypeSocket && (
            <PressTip
              elementType="span"
              tooltip={<PlugTooltip item={item} plug={archetypeSocket.plug!} />}
            >
              <BungieImage
                className={styles.inlineIcon}
                src={archetypeSocket.plug!.plugItem.displayProperties.icon}
              />
            </PressTip>
          )}
        </>
      );
    },
    value: (item) => getWeaponArchetype(item)?.hash ?? 'unknown',
  },
};

// which factors to check for which buckets
const factorCombos = {
  Weapons: [
    [itemFactors.element, itemFactors.weaponType],
    [itemFactors.archetype, itemFactors.weaponType],
  ],
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

  // because of the ability to swipe between item popup tabs,
  // all tabs in a popup are rendered when the item popup is up.
  // this actually processes items really fast, and the item popup appearance animation probably
  // takes longer than the calculation, but every millisecond counts, so,
  // to keep the UI snappy, expecially since this tab may not even be viewed,
  // we put calculations in a useEffect and fill in the numbers later
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
            <React.Fragment key={i}>
              {comboDisplay}
              <div className={styles.comboCount}>{itemFactors?.[i].count}</div>
              <div className={styles.keepMeter}>
                {itemFactors && <KeepJunkDial value={itemFactors[i].count} />}
              </div>
            </React.Fragment>
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
            <React.Fragment key={stat.statHash}>
              <div className={styles.bestStat}>
                <span className={styles.statIconWrapper}>
                  {(stat.displayProperties.icon && (
                    <BungieImage
                      key={stat.statHash}
                      className={clsx(styles.inlineIcon, styles.smaller)}
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
            </React.Fragment>
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
      {factorCombo.map((factor, i) => (
        <React.Fragment key={i}>{factor.render(exampleItem)}</React.Fragment>
      ))}
    </div>
  );
}
