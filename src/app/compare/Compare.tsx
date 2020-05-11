import React from 'react';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { DimItem, DimStat, D2Item } from '../inventory/item-types';
import _ from 'lodash';
import { CompareService } from './compare.service';
import { chainComparator, reverseComparator, compareBy } from '../utils/comparators';
import { createSelector } from 'reselect';
import CompareItem from './CompareItem';
import './compare.scss';
import { Subscriptions } from '../utils/rx-utils';
import { connect } from 'react-redux';
import { ReviewsState, getRating, ratingsSelector, shouldShowRating } from '../item-review/reducer';
import { RootState } from '../store/reducers';
import Sheet from '../dim-ui/Sheet';
import { showNotification } from '../notifications/notifications';
import { scrollToPosition } from 'app/dim-ui/scroll';
import {
  DestinyDisplayPropertiesDefinition,
  DestinyInventoryItemDefinition
} from 'bungie-api-ts/destiny2';
import { makeDupeID } from 'app/search/search-filters';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { getItemSpecialtyModSlotDisplayName } from 'app/utils/item-utils';
// import intrinsicLookupTable from 'data/d2/intrinsic-perk-lookup.json';
// we are falling back to using just an exactly matching intrinsic perk for now
// archetypes are difficult.
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';
import ElementIcon from 'app/inventory/ElementIcon';
import { DimStore } from 'app/inventory/store-types';
import { storesSelector } from 'app/inventory/selectors';
import { getAllItems } from 'app/inventory/stores-helpers';
import { RouteComponentProps, withRouter } from 'react-router';
interface StoreProps {
  ratings: ReviewsState['ratings'];
  stores: DimStore[];
  defs?: D2ManifestDefinitions;
}

type Props = StoreProps & RouteComponentProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    ratings: ratingsSelector(state),
    stores: storesSelector(state),
    defs: state.manifest.d2Manifest
  };
}

// TODO: There's far too much state here.
// TODO: maybe have a holder/state component and a connected display component
interface State {
  show: boolean;
  comparisonItems: DimItem[];
  highlight?: string | number;
  sortedHash?: string | number;
  sortBetterFirst: boolean;
  comparisonSets: { buttonLabel: React.ReactElement; items: DimItem[] }[];
}

export interface StatInfo {
  id: string | number;
  displayProperties: DestinyDisplayPropertiesDefinition;
  min: number;
  max: number;
  enabled: boolean;
  lowerBetter: boolean;
  getStat(item: DimItem): DimStat | { value?: number; statHash: number } | undefined;
}

class Compare extends React.Component<Props, State> {
  state: State = {
    comparisonItems: [],
    comparisonSets: [],
    show: false,
    sortBetterFirst: true
  };
  private subscriptions = new Subscriptions();

  // Memoize computing the list of stats
  private getAllStatsSelector = createSelector(
    (state: State) => state.comparisonItems,
    (_state: State, props: Props) => props.ratings,
    getAllStats
  );

  componentDidMount() {
    this.subscriptions.add(
      CompareService.compareItems$.subscribe((args) => {
        this.setState({ show: true });
        CompareService.dialogOpen = true;

        this.add(args);
      })
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.cancel();
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
    CompareService.dialogOpen = false;
  }

  render() {
    const { ratings } = this.props;
    const {
      show,
      comparisonItems: unsortedComparisonItems,
      sortedHash,
      highlight,
      comparisonSets
    } = this.state;

    if (!show || unsortedComparisonItems.length === 0) {
      CompareService.dialogOpen = false;
      return null;
    }

    const comparisonItems = Array.from(unsortedComparisonItems).sort(
      reverseComparator(
        chainComparator(
          compareBy((item: DimItem) => {
            const dtrRating = $featureFlags.reviewsEnabled && getRating(item, ratings);
            const showRating =
              $featureFlags.reviewsEnabled &&
              dtrRating &&
              shouldShowRating(dtrRating) &&
              dtrRating.overallScore;

            const stat =
              item.primStat && sortedHash === item.primStat.statHash
                ? item.primStat
                : sortedHash === 'Rating'
                ? { value: showRating || 0 }
                : sortedHash === 'EnergyCapacity'
                ? {
                    value: (item.isDestiny2() && item.energy?.energyCapacity) || 0
                  }
                : (item.stats || []).find((s) => s.statHash === sortedHash);

            if (!stat) {
              return -1;
            }

            const shouldReverse =
              isDimStat(stat) && stat.smallerIsBetter
                ? this.state.sortBetterFirst
                : !this.state.sortBetterFirst;
            return shouldReverse ? -stat.value : stat.value;
          }),
          compareBy((i) => i.index),
          compareBy((i) => i.name)
        )
      )
    );

    const stats = this.getAllStatsSelector(this.state, this.props);

    return (
      <Sheet
        onClose={this.cancel}
        header={
          <div className="compare-options">
            {comparisonSets.map(({ buttonLabel, items }, index) => (
              <button
                key={index}
                className="dim-button"
                onClick={(e) => this.compareSimilar(e, items)}
              >
                {buttonLabel} {`(${items.length})`}
              </button>
            ))}
          </div>
        }
      >
        <div id="loadout-drawer" className="compare">
          <div className="compare-bucket" onMouseLeave={() => this.setHighlight(undefined)}>
            <div className="compare-item fixed-left">
              <div className="spacer" />
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className={clsx('compare-stat-label', {
                    highlight: stat.id === highlight,
                    sorted: stat.id === sortedHash
                  })}
                  onMouseOver={() => this.setHighlight(stat.id)}
                  onClick={() => this.sort(stat.id)}
                >
                  {stat.displayProperties.name}
                </div>
              ))}
            </div>
            <div className="compare-items" onTouchStart={this.stopTouches}>
              {comparisonItems.map((item) => (
                <CompareItem
                  item={item}
                  key={item.id}
                  stats={stats}
                  itemClick={this.itemClick}
                  remove={this.remove}
                  setHighlight={this.setHighlight}
                  highlight={highlight}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    );
  }

  // prevent touches from bubbling which blocks scrolling
  private stopTouches = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  private setHighlight = (highlight?: string | number) => {
    this.setState({ highlight });
  };

  private cancel = () => {
    this.setState({
      show: false,
      comparisonItems: [],
      highlight: undefined,
      sortedHash: undefined
    });
    CompareService.dialogOpen = false;
  };

  private compareSimilar = (e: React.MouseEvent, comparisonSetItems: DimItem[]) => {
    e.preventDefault();
    this.setState({
      comparisonItems: comparisonSetItems
    });
  };

  private sort = (sortedHash?: string | number) => {
    this.setState((prevState) => ({
      sortedHash,
      sortBetterFirst: prevState.sortedHash === sortedHash ? !prevState.sortBetterFirst : true
    }));
  };
  private add = ({
    additionalItems,
    showSomeDupes
  }: {
    additionalItems: DimItem[];
    showSomeDupes: boolean;
  }) => {
    // use the first item and assume all others are of the same 'type'
    const exampleItem = additionalItems[0];
    if (!exampleItem.comparable) {
      return;
    }

    const { comparisonItems } = this.state;
    if (comparisonItems.length && exampleItem.typeName !== comparisonItems[0].typeName) {
      showNotification({
        type: 'warning',
        title: exampleItem.name,
        body:
          comparisonItems[0].classType && exampleItem.classType !== comparisonItems[0].classType
            ? t('Compare.Error.Class', { class: comparisonItems[0].classTypeNameLocalized })
            : t('Compare.Error.Archetype', { type: comparisonItems[0].typeName })
      });
      return;
    }

    // if there are existing comparisonItems, we're adding this one in
    if (comparisonItems.length) {
      // but not if it's already being compared
      if (comparisonItems.some((i) => i.id === exampleItem.id)) {
        return;
      }

      this.setState({ comparisonItems: [...comparisonItems, ...additionalItems] });
    }

    // else,this is a fresh comparison sheet spawn, so let's generate comparisonSets
    else {
      const allItems = getAllItems(this.props.stores);
      // comparisonSets is an array so that it has order, filled with {label, setOfItems} objects
      const comparisonSets = exampleItem.bucket.inArmor
        ? this.findSimilarArmors(allItems, additionalItems)
        : exampleItem.bucket.inWeapons
        ? this.findSimilarWeapons(allItems, additionalItems)
        : [];

      // if this was spawned from an item, and not from a search,
      // DIM tries to be helpful by including a starter comparison of dupes
      if (additionalItems.length === 1 && showSomeDupes) {
        const comparisonItems = comparisonSets[0]?.items ?? additionalItems;
        this.setState({
          comparisonSets,
          comparisonItems
        });
      }
      // otherwise, compare only the items we were asked to compare
      else {
        this.setState({ comparisonSets, comparisonItems: [...additionalItems] });
      }
    }
  };

  private remove = (item: DimItem) => {
    const { comparisonItems } = this.state;

    if (comparisonItems.length <= 1) {
      this.cancel();
    } else {
      this.setState({ comparisonItems: comparisonItems.filter((c) => c.id !== item.id) });
    }
  };

  private itemClick = (item: DimItem) => {
    // TODO: this is tough to do with an ID since we'll have multiple
    const element = document.getElementById(item.index)?.parentNode as HTMLElement;
    if (!element) {
      throw new Error(`No element with id ${item.index}`);
    }
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    scrollToPosition({ left: 0, top: absoluteElementTop - 150 });
    element.classList.add('item-pop');

    const removePop = () => {
      element.classList.remove('item-pop');
      for (const event of [
        'webkitAnimationEnd',
        'oanimationend',
        'msAnimationEnd',
        'animationend'
      ]) {
        element.removeEventListener(event, removePop);
      }
    };

    for (const event of ['webkitAnimationEnd', 'oanimationend', 'msAnimationEnd', 'animationend']) {
      element.addEventListener(event, removePop);
    }
  };

  private findSimilarArmors = (
    allArmors: DimItem[],
    comparisonItems = this.state.comparisonItems
  ) => {
    const exampleItem = comparisonItems[0];
    const exampleItemElementIcon = <ElementIcon element={exampleItem.element} />;
    const exampleItemModSlot = getItemSpecialtyModSlotDisplayName(exampleItem);

    // helper functions for filtering items
    const matchesExample = (key: keyof DimItem) => (item: DimItem) =>
      item[key] === exampleItem[key];
    const matchingModSlot = (item: DimItem) =>
      exampleItemModSlot === getItemSpecialtyModSlotDisplayName(item);
    const hasEnergy = (item: DimItem) => Boolean(item.isDestiny2() && item.energy);

    // minimum filter: make sure it's all armor, and can go in the same slot on the same class
    allArmors = allArmors
      .filter((i) => i.bucket.inArmor)
      .filter(matchesExample('typeName'))
      .filter(matchesExample('classType'));

    let comparisonSets = [
      // same slot on the same class
      {
        buttonLabel: <>{exampleItem.typeName}</>,
        items: allArmors
      },

      // above but also has to be armor 2.0
      {
        buttonLabel: <>{[t('Compare.Armor2'), exampleItem.typeName].join(' + ')}</>,
        items: hasEnergy(exampleItem) ? allArmors.filter(hasEnergy) : []
      },

      // above but also the same seasonal mod slot, if it has one
      {
        buttonLabel: <>{[exampleItemModSlot].join(' + ')}</>,
        items:
          hasEnergy(exampleItem) && exampleItemModSlot
            ? allArmors.filter(hasEnergy).filter(matchingModSlot)
            : []
      },

      // armor 2.0 and needs to match energy capacity element
      {
        buttonLabel: <>{[exampleItemElementIcon, exampleItem.typeName]}</>,
        items: hasEnergy(exampleItem)
          ? allArmors.filter(hasEnergy).filter(matchesExample('element'))
          : []
      },
      // above but also the same seasonal mod slot, if it has one
      {
        buttonLabel: <>{[exampleItemElementIcon, exampleItemModSlot]}</>,
        items:
          hasEnergy(exampleItem) && exampleItemModSlot
            ? allArmors.filter(hasEnergy).filter(matchingModSlot).filter(matchesExample('element'))
            : []
      },

      // basically stuff with the same name & categories
      {
        buttonLabel: <>{exampleItem.name}</>,
        items: allArmors.filter((i) => makeDupeID(i) === makeDupeID(exampleItem))
      },

      // above, but also needs to match energy capacity element
      {
        buttonLabel: <>{[exampleItemElementIcon, exampleItem.name]}</>,
        items: hasEnergy(exampleItem)
          ? allArmors
              .filter(hasEnergy)
              .filter(matchesExample('element'))
              .filter((i) => makeDupeID(i) === makeDupeID(exampleItem))
          : []
      }
    ];

    // here, we dump some buttons if they aren't worth displaying

    comparisonSets = comparisonSets.reverse();
    comparisonSets = comparisonSets.filter((comparisonSet, index) => {
      const nextComparisonSet = comparisonSets[index + 1];
      // always print the final button
      if (!nextComparisonSet) {
        return true;
      }
      // skip empty buttons
      if (!comparisonSet.items.length) {
        return false;
      }
      // skip if the next button has [all of, & only] the exact same items in it
      if (
        comparisonSet.items.length === nextComparisonSet.items.length &&
        comparisonSet.items.every((setItem) =>
          nextComparisonSet.items.some((nextSetItem) => nextSetItem === setItem)
        )
      ) {
        return false;
      }
      return true;
    });

    return comparisonSets;
  };

  private findSimilarWeapons = (
    allWeapons: DimItem[],
    comparisonItems = this.state.comparisonItems
  ) => {
    const exampleItem = comparisonItems[0];
    const exampleItemElementIcon = <ElementIcon element={exampleItem.element} />;

    const matchesExample = (key: keyof DimItem) => (item: DimItem) =>
      item[key] === exampleItem[key];
    // stuff for looking up weapon archetypes
    const getRpm = (i: DimItem) => {
      const itemRpmStat =
        i.stats &&
        i.stats.find(
          (s) =>
            s.statHash === (exampleItem.isDestiny1() ? exampleItem.stats![0].statHash : 4284893193)
        );
      return itemRpmStat?.value || -99999999;
    };

    /* disabled for now
    const weaponTypes = Object.keys(intrinsicLookupTable).map(Number);
    const thisWeaponsType =
      weaponTypes.find((h) => exampleItem.itemCategoryHashes.includes(h)) || -99999999;
      const matchingIntrisics = intrinsicLookupTable[thisWeaponsType]?.[exampleItemRpm];
      const intrinsicPerk =
        matchingIntrisics &&
        this.props.defs &&
        this.props.defs.InventoryItem.get(matchingIntrisics[0]);
      const intrinsicName = intrinsicPerk?.displayProperties.name || t('Compare.Archetype');
      const getIntrinsicPerk: (item: D2Item) => number = (item) => {
      const intrinsic =
        item.sockets &&
        item.sockets.sockets.find((s) =>
          s.plug?.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
        );
      return intrinsic?.plug?.plugItem.hash || -99999999;
    };
      */
    const getIntrinsicPerk = (item: D2Item): DestinyInventoryItemDefinition | undefined => {
      const intrinsic =
        item.sockets &&
        item.sockets.sockets.find((s) =>
          s.plug?.plugItem.itemCategoryHashes?.includes(INTRINSIC_PLUG_CATEGORY)
        );
      return intrinsic?.plug?.plugItem;
    };
    const exampleItemRpm = getRpm(exampleItem);
    const intrinsic = exampleItem.isDestiny2() ? getIntrinsicPerk(exampleItem) : undefined;
    const intrinsicName = intrinsic?.displayProperties.name || t('Compare.Archetype');
    const intrinsicHash = intrinsic?.hash;

    // minimum filter: make sure it's all weapons and the same weapon type
    allWeapons = allWeapons
      .filter((i) => i.bucket.inWeapons)
      .filter(matchesExample('typeName'))
      .filter(
        (i) =>
          // specifically for destiny 2 grenade launchers, let's not compare special with heavy.
          // all other weapon types with multiple ammos, are novelty exotic exceptions
          !exampleItem.isDestiny2() ||
          !i.isDestiny2() ||
          !exampleItem.itemCategoryHashes.includes(153950757) ||
          exampleItem.ammoType === i.ammoType
      );

    let comparisonSets = [
      // same weapon type
      {
        buttonLabel: <>{exampleItem.typeName}</>,
        items: allWeapons
      },

      // above, but also same (kinetic/energy/heavy) slot
      {
        buttonLabel: <>{[exampleItem.bucket.name, exampleItem.typeName].join(' + ')}</>,
        items: allWeapons.filter((i) => i.bucket.name === exampleItem.bucket.name)
      },

      // same weapon type plus matching intrinsic (rpm+impact..... ish)
      {
        buttonLabel: <>{[intrinsicName, exampleItem.typeName].join(' + ')}</>,
        items: exampleItem.isDestiny2()
          ? allWeapons.filter(
              (i) => i.isDestiny2() && i.sockets && getIntrinsicPerk(i)?.hash === intrinsicHash
            )
          : allWeapons.filter((i) => exampleItemRpm === getRpm(i))
      },

      // same weapon type and also matching element (& usually same-slot because same element)
      {
        buttonLabel: <>{[exampleItemElementIcon, exampleItem.typeName]}</>,
        items: allWeapons.filter(matchesExample('element'))
      },

      // exact same weapon, judging by name. might span multiple expansions.
      {
        buttonLabel: <>{exampleItem.name}</>,
        items: allWeapons.filter(matchesExample('name'))
      }
    ];
    comparisonSets = comparisonSets.reverse();
    comparisonSets = comparisonSets.filter((comparisonSet, index) => {
      const nextComparisonSet = comparisonSets[index + 1];
      // always print the final button
      if (!nextComparisonSet) {
        return true;
      }
      // skip empty buttons
      if (!comparisonSet.items.length) {
        return false;
      }
      // skip if the next button has [all of, & only] the exact same items in it
      if (
        comparisonSet.items.length === nextComparisonSet.items.length &&
        comparisonSet.items.every((setItem) =>
          nextComparisonSet.items.some((nextSetItem) => nextSetItem === setItem)
        )
      ) {
        return false;
      }
      return true;
    });

    return comparisonSets;
  };
}

function getAllStats(comparisonItems: DimItem[], ratings: ReviewsState['ratings']) {
  const firstComparison = comparisonItems[0];
  const stats: StatInfo[] = [];
  if ($featureFlags.reviewsEnabled) {
    stats.push({
      id: 'Rating',
      displayProperties: {
        name: t('Compare.Rating')
      } as DestinyDisplayPropertiesDefinition,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      enabled: false,
      lowerBetter: false,
      getStat(item: DimItem) {
        const dtrRating = getRating(item, ratings);
        const showRating = dtrRating && shouldShowRating(dtrRating) && dtrRating.overallScore;
        return { statHash: 0, value: showRating || undefined };
      }
    });
  }
  if (firstComparison.primStat) {
    stats.push({
      id: firstComparison.primStat.statHash,
      displayProperties: firstComparison.primStat.stat.displayProperties,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      enabled: false,
      lowerBetter: false,
      getStat(item: DimItem) {
        return item.primStat || undefined;
      }
    });
  }
  if (firstComparison.bucket.inArmor) {
    stats.push({
      id: 'EnergyCapacity',
      displayProperties: {
        name: t('EnergyMeter.Energy')
      } as DestinyDisplayPropertiesDefinition,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      enabled: false,
      lowerBetter: false,
      getStat(item: DimItem) {
        return (
          (item.isDestiny2() &&
            item.energy && {
              statHash: item.energy.energyType,
              value: item.energy.energyCapacity
            }) ||
          undefined
        );
      }
    });
  }
  // Todo: map of stat id => stat object
  // add 'em up
  const statsByHash: { [statHash: string]: StatInfo } = {};
  for (const item of comparisonItems) {
    if (item.stats) {
      for (const stat of item.stats) {
        let statInfo = statsByHash[stat.statHash];
        if (!statInfo) {
          statInfo = {
            id: stat.statHash,
            displayProperties: stat.displayProperties,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            enabled: false,
            lowerBetter: false,
            getStat(item: DimItem) {
              return item.stats ? item.stats.find((s) => s.statHash === stat.statHash) : undefined;
            }
          };
          statsByHash[stat.statHash] = statInfo;
          stats.push(statInfo);
        }
      }
    }
  }

  stats.forEach((stat) => {
    for (const item of comparisonItems) {
      const itemStat = stat.getStat(item);
      if (itemStat) {
        stat.min = Math.min(stat.min, itemStat.value || 0);
        stat.max = Math.max(stat.max, itemStat.value || 0);
        stat.enabled = stat.min !== stat.max;
        stat.lowerBetter = isDimStat(itemStat) ? itemStat.smallerIsBetter : false;
      }
    }
  });

  return stats;
}

function isDimStat(stat: DimStat | any): stat is DimStat {
  return Object.prototype.hasOwnProperty.call(stat as DimStat, 'smallerIsBetter');
}

export default withRouter(connect<StoreProps>(mapStateToProps)(Compare));
