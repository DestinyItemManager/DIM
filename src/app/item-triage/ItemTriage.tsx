import { settingsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { StatHashListsKeyedByDestinyClass, StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import ElementIcon from 'app/dim-ui/ElementIcon';
import PressTip from 'app/dim-ui/PressTip';
import SpecialtyModSlotIcon, {
  ArmorSlotSpecificModSocketIcon,
  getArmorSlotSpecificModSocketDisplayName,
} from 'app/dim-ui/SpecialtyModSlotIcon';
import { getWeaponSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { getWeaponArchetype, getWeaponArchetypeSocket } from 'app/dim-ui/WeaponArchetype';
import { allItemsSelector } from 'app/inventory/selectors';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { RootState } from 'app/store/types';
import { getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import styles from './ItemTriage.m.scss';
import { getValueColors, KeepJunkDial } from './ValueDial';

/** a factor of interest */
interface Factor {
  id: string;
  /** bother checking this factor, if the seed item returns truthy */
  runIf(item: DimItem): any;
  render(item: DimItem): React.ReactElement;
  value(item: DimItem): string | number;
}

// factors someone might value in an item, like its mod slot or its element
const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.classTypeNameLocalized}>
        <ClassIcon classType={item.classType} className={styles.classIcon} />
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
    render: (item) => {
      const weaponIcon = getWeaponSvgIcon(item);
      return weaponIcon ? (
        <PressTip elementType="span" tooltip={item.typeName}>
          <img
            className={clsx(styles.inlineIcon, styles.smaller, styles.weaponSvg)}
            src={getWeaponSvgIcon(item)}
          />
        </PressTip>
      ) : (
        <>{item.typeName}</>
      );
    },
    value: (item) => item.typeName ?? '',
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: getSpecialtySocketMetadatas,
    render: (item) => (
      <SpecialtyModSlotIcon className={styles.inlineIcon} item={item} lowRes={true} />
    ),
    value: (item) =>
      getSpecialtySocketMetadatas(item)
        ?.map((m) => m.slotTag)
        .join() ?? '',
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
          {archetypeSocket?.plugged && (
            <PressTip
              elementType="span"
              tooltip={<PlugTooltip item={item} plug={archetypeSocket.plugged} />}
            >
              <BungieImage
                className={styles.inlineIcon}
                src={archetypeSocket.plugged.plugDef.displayProperties.icon}
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

export function ItemTriage({ item }: { item: DimItem }) {
  const [notableStats, setNotableStats] = useState<ReturnType<typeof getNotableStats>>();
  const [itemFactors, setItemFactors] = useState<ReturnType<typeof getSimilarItems>>();
  const allItems = useSelector(allItemsSelector);

  const customTotalStatsByClass = useSelector<RootState, StatHashListsKeyedByDestinyClass>(
    (state) => settingsSelector(state).customTotalStatsByClass
  );

  // because of the ability to swipe between item popup tabs,
  // all tabs in a popup are rendered when the item popup is up.
  // this actually processes items really fast, and the item popup appearance animation probably
  // takes longer than the calculation, but every millisecond counts, so,
  // to keep the UI snappy, expecially since this tab may not even be viewed,
  // we put calculations in a useEffect and fill in the numbers later
  useEffect(() => {
    if (item.bucket.inArmor) {
      setNotableStats(getNotableStats(item, customTotalStatsByClass, allItems));
    }
    setItemFactors(getSimilarItems(item, allItems));
  }, [item, customTotalStatsByClass, allItems]);

  // this lets us lay out the factor categories before we have their calculated numbers
  // useEffect fills those in later for us
  // we rely on factorCombosLabels and itemFactors having the same number of elements,
  // because they are check the same factors
  const factorCombosLabels = getItemFactorComboDisplays(item);

  return (
    <div className={styles.itemTriagePane}>
      <div className={styles.triageTable}>
        <div className={`${styles.factorCombo} ${styles.header}`}>This item</div>
        <div className={`${styles.comboCount} ${styles.header}`}>Similar items</div>
        <div className={`${styles.keepMeter} ${styles.header}`} />
        <div className={styles.headerDivider} />
        {factorCombosLabels.length > 0 &&
          factorCombosLabels.map((comboDisplay, i) => (
            <React.Fragment key={i}>
              {comboDisplay}
              <div className={styles.comboCount}>{itemFactors?.[i]?.count}</div>
              <div className={styles.keepMeter}>
                {itemFactors && <KeepJunkDial value={itemFactors[i]?.quality} />}
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

          {notableStats.notableStats?.map(({ best, quality, percent, stat }) => (
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
          {item.bucket.inArmor && (
            <>
              <div className={styles.bestStat}>
                <span className={styles.statIconWrapper}> </span>
                <span className={styles.statValue}>{notableStats.customTotalMax.best}</span>{' '}
                <StatTotalToggle forClass={item.classType} className={styles.inlineBlock} />
              </div>
              <div className={styles.thisStat}>
                <span className={styles.statValue}>{notableStats.customTotalMax.stat}</span> (
                <span style={{ color: getValueColors(notableStats.customTotalMax.quality)[1] }}>
                  {notableStats.customTotalMax.percent}%
                </span>
                )
              </div>
              <div className={styles.keepMeter}>
                <KeepJunkDial value={notableStats.customTotalMax.quality} />
              </div>
            </>
          )}
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
function collectRelevantItemFactors(exampleItem: DimItem, allItems: DimItem[]) {
  const combinationCounts: { [key: string]: number } = {};
  allItems
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
    .forEach((item: DimItem) => {
      factorCombos[exampleItem.bucket.sort as factorComboCategory].forEach((factorCombo) => {
        const combination = applyFactorCombo(item, factorCombo);
        combinationCounts[combination] ??= 0;
        combinationCounts[combination]++;
      });
    });
  return combinationCounts;
}

function getSimilarItems(exampleItem: DimItem, allItems: DimItem[]) {
  if (!factorComboCategories.includes(exampleItem.bucket.sort ?? '')) {
    return [];
  }
  const relevantFactors = collectRelevantItemFactors(exampleItem, allItems);
  return factorCombos[exampleItem.bucket.sort as factorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => {
      const count = relevantFactors[applyFactorCombo(exampleItem, factorCombo)] - 1;
      return {
        /** how many similar items you have including this one */
        count,
        /** quality is a number from 0 to 100 representing keepworthiness */
        quality: Math.max(0, 100 - count * (100 / 3)),
      };
    });
}
function getItemFactorComboDisplays(exampleItem: DimItem) {
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
function collectRelevantStatMaxes(
  exampleItem: DimItem,
  customStatTotalHashes: number[],
  allItems: DimItem[]
) {
  // highest values found in relevant items, keyed by stat hash
  const statMaxes: Record<number | string, number> = { custom: 0 };
  allItems
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
        let thisItemCustomStatTotal = 0;
        item.stats.forEach((stat) => {
          const bestStatSoFar: number =
            statMaxes[stat.statHash] ?? (stat.smallerIsBetter ? 9999999 : -9999999);
          const newBestStat = (stat.smallerIsBetter ? Math.min : Math.max)(
            bestStatSoFar,
            stat.base
          );
          statMaxes[stat.statHash] = newBestStat;

          if (customStatTotalHashes.includes(stat.statHash)) {
            thisItemCustomStatTotal += stat.base;
          }
        });
        statMaxes['custom'] = Math.max(statMaxes['custom'], thisItemCustomStatTotal);
      }
    });
  return statMaxes;
}

// a stat is notable on seed item when it's at least this % of the best owned
const notabilityThreshold = 0.8;
/**
 * returns an entry for each notable stat found on the seed item
 */
function getNotableStats(
  exampleItem: DimItem,
  customTotalStatsByClass: StatHashListsKeyedByDestinyClass,
  allItems: DimItem[]
) {
  const customStatTotalHashes = customTotalStatsByClass[exampleItem.classType] ?? [];
  const statMaxes = collectRelevantStatMaxes(exampleItem, customStatTotalHashes, allItems);

  const customTotal =
    exampleItem.stats?.reduce(
      (total, stat) => (customStatTotalHashes.includes(stat.statHash) ? total + stat.base : total),
      0
    ) ?? 0;
  const customRatio = customTotal / statMaxes.custom || 0;
  return {
    notableStats: exampleItem.stats
      ?.filter((stat) => stat.base / statMaxes[stat.statHash] >= notabilityThreshold)
      .map((stat) => {
        const best = statMaxes[stat.statHash];
        const rawRatio = stat.base / best || 0;

        return {
          /** quality is a number from 0 to 100 representing keepworthiness */
          quality: 100 - (10 - Math.floor(rawRatio * 10)) * (100 / 3),
          /** seed item's copy of this stat */
          stat,
          /** best of this stat */
          best,
          /** whole # percentage of seed item's stat compared to the best of that stat */
          percent: Math.floor(rawRatio * 100),
        };
      }),
    customTotalMax: {
      quality: 100 - (10 - Math.floor(customRatio * 10)) * (100 / 3),
      stat: customTotal,
      best: statMaxes.custom,
      percent: Math.floor(customRatio * 100),
    },
  };
}

/**
 * turns an array of factors into a string
 * i.e. "class2,elementVoid"
 * for factorCombo [class, element]
 * and an item that's a warlock void armor
 */
function applyFactorCombo(item: DimItem, factorCombo: Factor[]) {
  return factorCombo.map((factor) => factor.id + factor.value(item)).join();
}

/**
 * turns an array of factors into UI to represent this combination of factors
 * i.e. a warlock icon and a purple swirl,
 * for factorCombo [class, element]
 * and an exampleItem that's a warlock void armor
 */
function renderFactorCombo(exampleItem: DimItem, factorCombo: Factor[]) {
  return (
    <div className={styles.factorCombo}>
      {factorCombo.map((factor) => (
        <React.Fragment key={factor.id}>{factor.render(exampleItem)}</React.Fragment>
      ))}
    </div>
  );
}
