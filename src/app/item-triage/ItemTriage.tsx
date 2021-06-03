import { settingsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { StatHashListsKeyedByDestinyClass, StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import { ArmorSlotSpecificModSocketIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { filterFactorySelector } from 'app/search/search-filter';
import { setSearchQuery } from 'app/shell/actions';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { wishListSelector } from 'app/wishlists/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
// eslint-disable-next-line css-modules/no-unused-class
import popupStyles from '../item-popup/ItemDescription.m.scss';
import {
  factorComboCategories,
  FactorComboCategory,
  factorCombos,
  getItemFactorComboDisplays,
} from './factors';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './ItemTriage.m.scss';
import { getValueColors } from './ValueDial';

export function ItemTriage({ item }: { item: DimItem }) {
  const dispatch = useDispatch();
  const filterFactory = useSelector(filterFactorySelector);
  const [notableStats, setNotableStats] = useState<ReturnType<typeof getNotableStats>>();
  const [itemFactors, setItemFactors] = useState<ReturnType<typeof getSimilarItems>>();
  const allItems = useSelector(allItemsSelector);
  const wishlistItem = useSelector(wishListSelector(item));
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
    setItemFactors(getSimilarItems(item, allItems, filterFactory));
  }, [item, customTotalStatsByClass, filterFactory, allItems]);

  // this lets us lay out the factor categories before we have their calculated numbers
  // useEffect fills those in later for us
  // we rely on factorCombosLabels and itemFactors having the same number of elements,
  // because they are check the same factors
  const factorCombosLabels = getItemFactorComboDisplays(item);

  return (
    <div className={styles.itemTriagePane}>
      {wishlistItem?.notes?.length && (
        <ExpandableTextBlock linesWhenClosed={3} className={popupStyles.description}>
          <span className={popupStyles.wishListLabel}>
            {t('WishListRoll.WishListNotes', { notes: '' })}
          </span>
          <span className={popupStyles.wishListTextContent}>{wishlistItem.notes}</span>
        </ExpandableTextBlock>
      )}
      <div className={styles.ownershipTable}>
        <div className={styles.header}>This item</div>
        <div className={styles.header}># Owned</div>
        <div className={styles.headerDivider} />
        {itemFactors &&
          factorCombosLabels.length > 0 &&
          factorCombosLabels.map((comboDisplay, i) => {
            const { count, query } = itemFactors[i];
            return (
              <React.Fragment key={i}>
                {comboDisplay}
                <div className={styles.comboCount}>
                  <span>{count}</span>
                  <a
                    onClick={() => {
                      dispatch(setSearchQuery(query));
                    }}
                    title={query}
                    className={styles.searchBarIcon}
                  >
                    <AppIcon icon={searchIcon} />
                  </a>
                </div>
              </React.Fragment>
            );
          })}
      </div>
      {notableStats && (
        <div className={styles.statTable}>
          <div className={`${styles.bestStat} ${styles.header}`}>
            Best item (
            <ArmorSlotSpecificModSocketIcon
              className={clsx(styles.inlineIcon, styles.headerImage)}
              item={item}
              lowRes={true}
            />
            )
          </div>
          <div className={`${styles.thisStat} ${styles.header}`}>This item</div>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getSimilarItems(
  exampleItem: DimItem,
  allItems: DimItem[],
  filterFactory: (query: string) => ItemFilter
) {
  if (!factorComboCategories.includes(exampleItem.bucket.sort ?? '')) {
    return [];
  }
  return factorCombos[exampleItem.bucket.sort as FactorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => {
      const query = factorCombo.map((f) => f.filter(exampleItem)).join(' ');
      return { count: allItems.filter(filterFactory(query)).length, query };
    });
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
