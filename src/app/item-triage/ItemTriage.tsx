// THIS FILE IS A MESS in order to effectively exclude its content from the bundle

import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { StatHashListsKeyedByDestinyClass, StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { ExpandableTextBlock } from 'app/dim-ui/ExpandableTextBlock';
import PressTip from 'app/dim-ui/PressTip';
import {
  ArmorSlotSpecificModSocketIcon,
  SpecialtyModSlotIcon,
} from 'app/dim-ui/SpecialtyModSlotIcon';
import { getArmorSlotSvgIcon, getWeaponTypeSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { filterFactorySelector } from 'app/search/search-filter';
import { nameFilter, quoteFilterString } from 'app/search/search-filters/freeform';
import {
  classFilter,
  damageFilter,
  itemCategoryFilter,
  itemTypeFilter,
} from 'app/search/search-filters/known-values';
import { modslotFilter } from 'app/search/search-filters/sockets';
import { setSearchQuery } from 'app/shell/actions';
import { AppIcon, editIcon, searchIcon, thumbsUpIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { getInterestingSocketMetadatas } from 'app/utils/item-utils';
import { getWeaponArchetype, getWeaponArchetypeSocket } from 'app/utils/socket-utils';
import { wishListSelector } from 'app/wishlists/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
// eslint-disable-next-line css-modules/no-unused-class
import popupStyles from '../item-popup/ItemDescription.m.scss';
import styles from './ItemTriage.m.scss';

/** whether an item's popup should contain the triage tab */
export function doShowTriage(item: DimItem) {
  return (
    item.destinyVersion === 2 &&
    (item.bucket.inArmor ||
      (item.bucket.sort === 'Weapons' &&
        item.bucket.hash !== BucketHashes.SeasonalArtifact &&
        item.bucket.hash !== BucketHashes.Subclass))
  );
}

export function ItemTriage({ item }: { item: DimItem }) {
  const dispatch = useDispatch();
  const filterFactory = useSelector(filterFactorySelector);
  const [notableStats, setNotableStats] = useState<ReturnType<typeof getNotableStats>>();
  const [itemFactors, setItemFactors] = useState<ReturnType<typeof getSimilarItems>>();
  const allItems = useSelector(allItemsSelector);
  const wishlistItem = useSelector(wishListSelector(item));
  const loadouts = useSelector(loadoutsSelector);
  const customTotalStatsByClass = useSelector<RootState, StatHashListsKeyedByDestinyClass>(
    settingSelector('customTotalStatsByClass')
  );
  // because of the ability to swipe between item popup tabs,
  // all tabs in a popup are rendered when the item popup is up.
  // this actually processes items really fast, and the item popup appearance animation probably
  // takes longer than the calculation, but every millisecond counts, so,
  // to keep the UI snappy, especially since this tab may not even be viewed,
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
  const inLoadouts = loadouts.filter((l) => l.items.some((i) => i.id === item.id));

  return (
    <div className={styles.itemTriagePane}>
      {item.bucket.inWeapons && (
        <CollapsibleTitle
          title="Wishlists"
          sectionId="triage-wishlist"
          defaultCollapsed={false}
          extra={
            wishlistItem?.isDesirable() || wishlistItem?.isUndesirable() ? (
              <AppIcon className="thumbs-up" icon={thumbsUpIcon} />
            ) : (
              '–'
            )
          }
          disabled={!wishlistItem}
        >
          {wishlistItem?.notes?.length && (
            <ExpandableTextBlock linesWhenClosed={3} className={popupStyles.description}>
              <span className={popupStyles.wishListLabel}>
                {t('WishListRoll.WishListNotes', { notes: '' })}
              </span>
              <span className={popupStyles.wishListTextContent}>{wishlistItem.notes}</span>
            </ExpandableTextBlock>
          )}
        </CollapsibleTitle>
      )}
      <CollapsibleTitle
        title="In Loadouts"
        sectionId="triage-loadout"
        defaultCollapsed={true}
        extra={inLoadouts.length}
        extraOnlyCollapsed
        disabled={!inLoadouts.length}
      >
        <ul>
          {inLoadouts.map((l) => (
            <li className={styles.loadoutRow} key={l.id}>
              {l.name}{' '}
              <a
                className={styles.lowKeyButton}
                title={t('Loadouts.Edit')}
                onClick={() =>
                  editLoadout(l, item.owner, {
                    isNew: false,
                  })
                }
              >
                <AppIcon icon={editIcon} />
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleTitle>
      <CollapsibleTitle
        title="Item Count"
        sectionId="triage-itemcount"
        defaultCollapsed={false}
        extra={itemFactors?.length ? Math.min(...itemFactors.map((f) => f.count)) : undefined}
        extraOnlyCollapsed
      >
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
                      className={styles.lowKeyButton}
                    >
                      <AppIcon icon={searchIcon} />
                    </a>
                  </div>
                </React.Fragment>
              );
            })}
        </div>
      </CollapsibleTitle>
      {item.bucket.inArmor && (
        <CollapsibleTitle
          title="High Stats"
          sectionId="triage-highstat"
          defaultCollapsed={false}
          extraOnlyCollapsed
        >
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
                    <span className={styles.statValue}>
                      {notableStats.customTotalMax.best}
                    </span>{' '}
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
        </CollapsibleTitle>
      )}
    </div>
  );
}

/** a factor of interest */
interface Factor {
  id: string;
  /** bother checking this factor, if the seed item returns truthy */
  runIf(item: DimItem): unknown;
  render(item: DimItem): React.ReactElement | null;
  filter(item: DimItem): string;
}
// factors someone might value in an item, like its mod slot or its element
const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: () => null,
    // render: (item) => (
    //   <PressTip elementType="span" tooltip={item.classTypeNameLocalized}>
    //     <ClassIcon classType={item.classType} className={styles.classIcon} />
    //   </PressTip>
    // ),
    filter: classFilter.fromItem!,
  },
  name: {
    id: 'name',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => (
      <>
        <BungieImage className={styles.inlineIcon} src={item.icon} /> {item.name}
      </>
    ),
    filter: nameFilter.fromItem!,
  },
  element: {
    id: 'element',
    runIf: (item) => item.element,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.element?.displayProperties.name}>
        <ElementIcon className={clsx(styles.inlineIcon, styles.smaller)} element={item.element} />
      </PressTip>
    ),
    filter: damageFilter.fromItem!,
  },
  weaponType: {
    id: 'weaponType',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => {
      const weaponIcon = getWeaponTypeSvgIcon(item);
      return weaponIcon ? (
        <PressTip elementType="span" tooltip={item.typeName}>
          <img
            className={clsx(styles.inlineIcon, styles.smaller, styles.weaponSvg)}
            src={weaponIcon}
          />
        </PressTip>
      ) : (
        <>{item.typeName}</>
      );
    },
    filter: itemCategoryFilter.fromItem!,
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: getInterestingSocketMetadatas,
    render: (item) => (
      <SpecialtyModSlotIcon
        className={styles.inlineIcon}
        item={item}
        lowRes
        excludeStandardD2ModSockets
      />
    ),
    filter: modslotFilter.fromItem!,
  },
  armorSlot: {
    id: 'armorSlot',
    runIf: (item) => item.bucket.inArmor,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.typeName}>
        <img
          src={getArmorSlotSvgIcon(item)}
          className={clsx(styles.inlineIcon, styles.weaponSvg)}
        />
      </PressTip>
    ),
    filter: itemTypeFilter.fromItem!,
  },
  archetype: {
    id: 'archetype',
    runIf: (item) => getWeaponArchetype(item),
    render: (item) => {
      const archetypeSocket = getWeaponArchetypeSocket(item);
      return archetypeSocket?.plugged ? (
        <PressTip
          elementType="span"
          tooltip={<DimPlugTooltip item={item} plug={archetypeSocket.plugged} />}
        >
          <BungieImage
            className={styles.inlineIcon}
            src={archetypeSocket.plugged.plugDef.displayProperties.icon}
          />
        </PressTip>
      ) : null;
    },
    filter: (item) =>
      `perkname:${quoteFilterString(getWeaponArchetype(item)!.displayProperties.name)}`,
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
type FactorComboCategory = keyof typeof factorCombos;
const factorComboCategories = Object.keys(factorCombos);

function getItemFactorComboDisplays(exampleItem: DimItem) {
  if (!exampleItem.bucket.sort || !factorComboCategories.includes(exampleItem.bucket.sort)) {
    return [];
  }
  return factorCombos[exampleItem.bucket.sort as FactorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => renderFactorCombo(exampleItem, factorCombo));
}

function renderFactorCombo(exampleItem: DimItem, factorCombo: Factor[]) {
  return (
    <div className={styles.factorCombo}>
      {factorCombo.map((factor) => (
        <React.Fragment key={factor.id}>{factor.render(exampleItem)}</React.Fragment>
      ))}
    </div>
  );
}

/** returns [dark, light] variations along a 1->100  red->yellow->green line */
function getValueColors(value: number): [string, string] {
  const hue = value * 1.25;
  const light = Math.floor(-(value ** 2 / 250) + (2 * value) / 5 + 30);
  return [`hsl(${hue}, 100%, 8%)`, `hsl(${hue}, 100%, ${light}%)`];
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
