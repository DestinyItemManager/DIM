import React from 'react';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { DimItem, DimStat } from '../inventory/item-types';
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
import { INTRINSIC_PLUG_CATEGORY } from 'app/inventory/store/sockets';

interface StoreProps {
  ratings: ReviewsState['ratings'];
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    ratings: ratingsSelector(state)
  };
}

// TODO: There's far too much state here.
// TODO: maybe have a holder/state component and a connected display component
interface State {
  show: boolean;
  comparisons: DimItem[];
  highlight?: string | number;
  sortedHash?: string | number;
  similarTypes: DimItem[];
  archetypes: DimItem[];
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
    similarTypes: [],
    archetypes: [],
    show: false
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
      similarTypes,
      archetypes
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
            return (
              (stat && (isDimStat(stat) && stat.smallerIsBetter ? -stat.value : stat.value)) || -1
            );
          }),
          compareBy((i) => i.index),
          compareBy((i) => i.name)
        )
      )
    );

    const firstComparison = comparisons[0];
    const stats = this.getAllStatsSelector(this.state, this.props);

    return (
      <Sheet onClose={this.cancel}>
        <div id="loadout-drawer" className="compare">
          <div className="compare-options">
            {archetypes.length > 1 && (
              <button className="dim-button" onClick={(e) => this.compareSimilar(e, 'archetype')}>
                {firstComparison.bucket.inWeapons
                  ? t('Compare.Archetype', { quantity: archetypes.length })
                  : t('Compare.Splits', { quantity: archetypes.length })}
              </button>
            )}{' '}
            {similarTypes.length > 1 && (
              <button className="dim-button" onClick={this.compareSimilar}>
                {t('Compare.All', {
                  type: firstComparison.typeName,
                  quantity: similarTypes.length
                })}
              </button>
            )}
          </div>
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

  private compareSimilar = (e, type?: string) => {
    e.preventDefault();
    this.setState(({ archetypes, similarTypes }) => ({
      comparisons: type === 'archetype' ? archetypes : similarTypes
    }));
  };

  private sort = (sortedHash?: string | number) => {
    this.setState({ sortedHash });
  };

  private add = ({ items, dupes }: { items: DimItem[]; dupes: boolean }) => {
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

    const allItems = item.getStoresService().getAllItems();
    const similarTypes = this.findSimilarTypes(allItems, item);

    if (items.length > 1) {
      this.setState({ similarTypes, archetypes: [], comparisons: [...comparisons, ...items] });
    } else if (dupes) {
      const archetypes = this.findArchetypes(similarTypes, item);
      this.setState({
        comparisons: allItems.filter((i) => i.hash === item.hash),
        // TODO: I'd rather not store these on state - they should just be a memoized selector
        similarTypes,
        archetypes
      });
    } else if (comparisons.every((i) => i.id !== item.id)) {
      this.setState({ comparisons: [...comparisons, item] });
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

  private findSimilarTypes = (allItems: DimItem[], compare = this.state.comparisons[0]) => {
    return compare
      ? allItems.filter(
          (i) =>
            i.typeName === compare.typeName &&
            // If it's armor, make sure it's all for the same class
            (!compare.bucket.inArmor || i.classType === compare.classType)
        )
      : [];
  };

  private findArchetypes = (similarTypes: DimItem[], compare = this.state.comparisons[0]) => {
    if (!compare || !compare.stats) {
      return [];
    }

    let armorSplit = 0;
    if (compare.bucket.inArmor) {
      armorSplit = _.sumBy(compare.stats, (stat) => (stat.value === 0 ? 0 : stat.statHash));
    }

    const isArchetypeStat = (s: DimStat) =>
      // 4284893193 is RPM in D2
      s.statHash === (compare.isDestiny1() ? compare.stats![0].statHash : 4284893193);

    const archetypeStat = compare.stats.find(isArchetypeStat);

    const byStat = (item: DimItem) => {
      if (item.bucket.inWeapons) {
        const archetypeMatch = item.stats && item.stats.find(isArchetypeStat);
        if (!archetypeMatch) {
          return false;
        }
        return archetypeStat && archetypeMatch.value === archetypeStat.value;
      }
      return _.sumBy(item.stats, (stat) => (stat.value === 0 ? 0 : stat.statHash)) === armorSplit;
    };

    if (compare.isDestiny2() && !compare.isExotic && compare.sockets) {
      const intrinsic = compare.sockets.sockets.find((s) =>
        Boolean(s.plug && s.plug.plugItem.itemCategoryHashes.includes(INTRINSIC_PLUG_CATEGORY))
      );

      if (intrinsic) {
        return similarTypes.filter((item: DimItem) => {
          return (
            item.isDestiny2() &&
            ((item.sockets &&
              item.sockets.sockets.find((s) =>
                Boolean(s.plug && s.plug.plugItem.hash === intrinsic.plug!.plugItem.hash)
              )) ||
              (item.isExotic && archetypeStat && byStat(item)))
          );
        });
      }
    }

    if (archetypeStat) {
      return similarTypes.filter(byStat);
    }
    return [];
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
