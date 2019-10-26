import React from 'react';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { DimItem, DimStat, D2Item } from '../inventory/item-types';
import { router } from '../router';
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
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import idx from 'idx';
import { makeDupeID } from 'app/search/search-filters';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { getItemDamageType } from 'app/utils/item-utils';
import intrinsicLookupTable from 'data/d2/intrinsic-perk-lookup.json';
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';

interface StoreProps {
  ratings: ReviewsState['ratings'];
  defs?: D2ManifestDefinitions;
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    ratings: ratingsSelector(state),
    defs: state.manifest.d2Manifest
  };
}

// TODO: There's far too much state here.
// TODO: maybe have a holder/state component and a connected display component
interface State {
  show: boolean;
  comparisons: DimItem[];
  highlight?: string | number;
  sortedHash?: string | number;
  sortBetterFirst: boolean;
  comparisonSets: Map<string, DimItem[]>;
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
    comparisons: [],
    comparisonSets: new Map(),
    show: false,
    sortBetterFirst: true
  };
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private listener: Function;

  // Memoize computing the list of stats
  private getAllStatsSelector = createSelector(
    (state: State) => state.comparisons,
    (_state: State, props: Props) => props.ratings,
    getAllStats
  );

  componentDidMount() {
    this.listener = router.transitionService.onExit({}, () => {
      this.cancel();
    });

    this.subscriptions.add(
      CompareService.compareItems$.subscribe((args) => {
        this.setState({ show: true });
        CompareService.dialogOpen = true;

        this.add(args);
      })
    );
  }

  componentWillUnmount() {
    this.listener();
    this.subscriptions.unsubscribe();
    CompareService.dialogOpen = false;
  }

  render() {
    const { ratings } = this.props;
    const {
      show,
      comparisons: unsortedComparisons,
      sortedHash,
      highlight,
      comparisonSets
    } = this.state;

    if (!show || unsortedComparisons.length === 0) {
      CompareService.dialogOpen = false;
      return null;
    }

    const comparisons = Array.from(unsortedComparisons).sort(
      reverseComparator(
        chainComparator(
          compareBy((item: DimItem) => {
            const dtrRating = getRating(item, ratings);
            const showRating = dtrRating && shouldShowRating(dtrRating) && dtrRating.overallScore;

            const stat =
              item.primStat && sortedHash === item.primStat.statHash
                ? item.primStat
                : sortedHash === 'Rating'
                ? { value: showRating || 0 }
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
            {[...comparisonSets.entries()].map(([setName, set]) => (
              <button
                key={setName}
                className="dim-button"
                onClick={(e) => this.compareSimilar(e, setName)}
              >
                {`${setName} (${set.length})`}
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
              {comparisons.map((item) => (
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
  private stopTouches = (e) => {
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
      comparisons: [],
      highlight: undefined,
      sortedHash: undefined
    });
    CompareService.dialogOpen = false;
  };

  private compareSimilar = (e, comparisonSetName: string) => {
    e.preventDefault();
    this.setState(({ comparisonSets }) => ({
      comparisons: comparisonSets.get(comparisonSetName) || []
    }));
  };

  private sort = (sortedHash?: string | number) => {
    this.setState((prevState) => ({
      sortedHash,
      sortBetterFirst: prevState.sortedHash === sortedHash ? !prevState.sortBetterFirst : true
    }));
  };

  private add = ({ items }: { items: DimItem[] }) => {
    // use the first item and assume all others are of the same 'type'
    const item = items[0];

    if (!item.comparable) {
      return;
    }

    const { comparisons } = this.state;

    if (
      comparisons.length &&
      comparisons[0].typeName &&
      item.typeName !== comparisons[0].typeName
    ) {
      showNotification({
        type: 'warning',
        title: item.name,
        body:
          comparisons[0].classType && item.classType !== comparisons[0].classType
            ? t('Compare.Error.Class', { class: comparisons[0].classTypeNameLocalized })
            : t('Compare.Error.Archetype', { type: comparisons[0].typeName })
      });
      return;
    }

    // if there are existing comparisons, make sure it's not a dupe item, then add it
    if (comparisons.length && comparisons.every((i) => i.id !== item.id)) {
      this.setState({ comparisons: [...comparisons, ...items] });
    } else {
      // this is a new comparison, so let's generate comparisonSets

      const allItems = item.getStoresService().getAllItems();
      const comparisonSets = item.bucket.inArmor
        ? this.findSimilarArmors(allItems, items)
        : item.bucket.inWeapons
        ? this.findSimilarWeapons(allItems, items)
        : new Map();

      this.setState({ comparisonSets, comparisons: [...comparisons, ...items] });
    }
  };

  private remove = (item: DimItem) => {
    const { comparisons } = this.state;

    if (comparisons.length <= 1) {
      this.cancel();
    } else {
      this.setState({ comparisons: comparisons.filter((compare) => compare.id !== item.id) });
    }
  };

  private itemClick = (item: DimItem) => {
    // TODO: this is tough to do with an ID since we'll have multiple
    const element = idx(document.getElementById(item.index), (e) => e.parentNode) as HTMLElement;
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

  private findSimilarArmors = (allItems: DimItem[], itemsBeingAdded = this.state.comparisons) => {
    const compare = itemsBeingAdded[0];
    const compareDamageType = this.props.defs && getItemDamageType(compare, this.props.defs);
    const compareElementName = compareDamageType && compareDamageType.displayProperties.name;
    /** button names/storage keys for comparison sets */
    const n = {
      sameElementDupes: [compareElementName, compare.name].join(' + '),
      dupes: compare.name,
      sameClassPieceAndElement: [compareElementName, compare.typeName].join(' + '),
      sameClassAndPiece: [compare.typeName].join(' + ')
    };
    const filteredSets: { [key: string]: DimItem[] } = {};
    const comparisonSets = new Map<string, DimItem[]>();

    filteredSets[n.sameClassAndPiece] = allItems.filter(
      (i) =>
        i.bucket.inArmor && i.typeName === compare.typeName && i.classType === compare.classType
    );
    filteredSets[n.sameClassPieceAndElement] = filteredSets[n.sameClassAndPiece].filter(
      (i) => i.dmg === compare.dmg
    );
    filteredSets[n.dupes] = allItems.filter((i) => makeDupeID(i) === makeDupeID(compare));
    filteredSets[n.sameElementDupes] = filteredSets[n.dupes].filter((i) => i.dmg === compare.dmg);

    // don't bother making more-specific categories, if they all match a more-general category
    const buttonList = [
      n.sameElementDupes,
      n.dupes,
      n.sameClassPieceAndElement,
      n.sameClassAndPiece
    ];
    buttonList.forEach((setName, index) => {
      // points to the next set
      const moreGeneralSetName = buttonList[index + 1];
      if (
        // make sure this set has items to add beyond those already being added
        filteredSets[setName].length > itemsBeingAdded.length &&
        // make sure there's no next set, or this set is different from the next, more general set
        (!filteredSets[moreGeneralSetName] ||
          filteredSets[setName].length !== filteredSets[moreGeneralSetName].length)
      ) {
        comparisonSets.set(setName, filteredSets[setName]);
      }
    });

    return comparisonSets;
  };

  private findSimilarWeapons = (allItems: DimItem[], itemsBeingAdded = this.state.comparisons) => {
    const compare = itemsBeingAdded[0];
    const compareDamageType = this.props.defs && getItemDamageType(compare, this.props.defs);
    const compareElementName = compareDamageType && compareDamageType.displayProperties.name;

    // stuff for looking up weapon archetypes
    const getRpm = (i: DimItem) => {
      const itemRpmStat =
        i.stats &&
        i.stats.find(
          (s) => s.statHash === (compare.isDestiny1() ? compare.stats![0].statHash : 4284893193)
        );
      return (itemRpmStat && itemRpmStat.value) || 99999999;
    };

    const weaponTypes = Object.keys(intrinsicLookupTable).map(Number);
    const weaponType = weaponTypes.find((h) => compare.itemCategoryHashes.includes(h)) || 99999999;
    const rpm = getRpm(compare);
    /** d2ai-generated list of intrinsic hashes that count as matching our example item */
    const matchingIntrisics = intrinsicLookupTable[weaponType][rpm];
    const intrinsicPerk =
      matchingIntrisics &&
      this.props.defs &&
      this.props.defs.InventoryItem.get(matchingIntrisics[0]);
    const intrinsicName =
      (intrinsicPerk && intrinsicPerk.displayProperties.name) || t('Compare.Archetype');

    const getIntrinsicPerk: (item: D2Item) => number = (item) => {
      const intrinsic =
        item.sockets &&
        item.sockets.sockets.find(
          (s) => s.plug && s.plug.plugItem.itemCategoryHashes.includes(INTRINSIC_PLUG_CATEGORY)
        );
      return (intrinsic && intrinsic.plug && intrinsic.plug.plugItem.hash) || 99999999;
    };

    /** button names/storage keys for comparison sets */
    const n = {
      sameWeaponType: [compare.typeName].join(' + '),
      sameWeaponTypeAndSlot: [compare.bucket.name, compare.typeName].join(' + '),
      sameWeaponTypeAndArchetype: [intrinsicName, compare.typeName].join(' + '),
      sameWeaponTypeAndElement: [compareElementName, compare.typeName].join(' + '),
      sameWeapon: compare.name
    };
    const filteredSets: { [key: string]: DimItem[] } = {};
    const comparisonSets = new Map<string, DimItem[]>();

    if (!compare || !compare.stats) {
      return comparisonSets;
    }
    filteredSets[n.sameWeaponType] = allItems.filter(
      (i) =>
        i.bucket.inWeapons &&
        i.typeName === compare.typeName &&
        (!compare.isDestiny2() || !i.isDestiny2() || compare.ammoType === i.ammoType)
    );
    filteredSets[n.sameWeaponTypeAndSlot] = filteredSets[n.sameWeaponType].filter(
      (i) => i.bucket.name === compare.bucket.name
    );

    // filter by RPM in D1 or by d2ai in D2
    filteredSets[n.sameWeaponTypeAndArchetype] = compare.isDestiny2()
      ? filteredSets[n.sameWeaponType].filter(
          (i) =>
            i.isDestiny2() &&
            i.sockets &&
            matchingIntrisics &&
            matchingIntrisics.includes(getIntrinsicPerk(i))
        )
      : filteredSets[n.sameWeaponType].filter((i) => {
          return rpm === getRpm(i);
        });

    filteredSets[n.sameWeaponTypeAndElement] = filteredSets[n.sameWeaponTypeAndSlot].filter(
      (i) => i.dmg === compare.dmg
    );
    filteredSets[n.sameWeapon] = filteredSets[n.sameWeaponTypeAndElement].filter(
      (i) => i.name === compare.name
    );

    // don't bother making more-specific categories, if they all match a more-general category
    const buttonList = [
      n.sameWeapon,
      n.sameWeaponTypeAndArchetype,
      n.sameWeaponTypeAndElement,
      n.sameWeaponTypeAndSlot,
      n.sameWeaponType
    ];
    buttonList.forEach((setName, index) => {
      // points to the next set
      const moreGeneralSetName = buttonList[index + 1];
      if (
        // make sure this has any new items to add
        filteredSets[setName].length > itemsBeingAdded.length &&
        // make sure there's no next set, or this set is different from the next, more general set
        (!filteredSets[moreGeneralSetName] ||
          filteredSets[setName].length !== filteredSets[moreGeneralSetName].length)
      ) {
        comparisonSets.set(setName, filteredSets[setName]);
      }
    });
    return comparisonSets;
  };
}

function getAllStats(comparisons: DimItem[], ratings: ReviewsState['ratings']) {
  const firstComparison = comparisons[0];

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

  // Todo: map of stat id => stat object
  // add 'em up
  const statsByHash: { [statHash: string]: StatInfo } = {};
  for (const item of comparisons) {
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
    for (const item of comparisons) {
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

export default connect<StoreProps>(mapStateToProps)(Compare);
