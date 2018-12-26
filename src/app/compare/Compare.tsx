import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import { DimItem, DimStat } from '../inventory/item-types';
import { router } from '../../router';
import * as _ from 'lodash';
import { CompareService } from './compare.service';
import { toaster } from '../ngimport-more';
import { chainComparator, reverseComparator, compareBy } from '../comparators';
import { createSelector } from 'reselect';
import CompareItem from './CompareItem';
import './compare.scss';
import { Subscriptions } from '../rx-utils';
import { connect } from 'react-redux';
import { ReviewsState, getRating } from '../item-review/reducer';
import { RootState } from '../store/reducers';
import Sheet from '../dim-ui/Sheet';

interface StoreProps {
  ratings: ReviewsState['ratings'];
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    ratings: state.reviews.ratings
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
  name: string;
  min: number;
  max: number;
  enabled: boolean;
  getStat(item: DimItem): { value?: number; statHash: number } | undefined;
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
      CompareService.compareItem$.subscribe((args) => {
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
            const stat =
              item.primStat && sortedHash === item.primStat.statHash
                ? item.primStat
                : sortedHash === 'Rating'
                ? { value: (item.dtrRating && item.dtrRating.overallScore) || '0' }
                : (item.stats || []).find((s) => s.statHash === sortedHash);
            return (stat && stat.value) || -1;
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
                {t(firstComparison.bucket.inWeapons ? 'Compare.Archetype' : 'Compare.Splits', {
                  quantity: archetypes.length
                })}
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
                  className={classNames('compare-stat-label', {
                    highlight: stat.id === highlight,
                    sorted: stat.id === sortedHash
                  })}
                  onMouseOver={() => this.setHighlight(stat.id)}
                  onClick={() => this.sort(stat.id)}
                >
                  {stat.name}
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
    this.setState({
      comparisons: type === 'archetype' ? this.state.archetypes : this.state.similarTypes
    });
  };

  private sort = (sortedHash?: string | number) => {
    this.setState({ sortedHash });
  };

  private add = ({ item, dupes }: { item: DimItem; dupes: boolean }) => {
    if (!item.comparable) {
      return;
    }

    const { comparisons } = this.state;

    if (
      comparisons.length &&
      comparisons[0].typeName &&
      item.typeName !== comparisons[0].typeName
    ) {
      toaster.pop(
        'warning',
        item.name,
        comparisons[0].classType && item.classType !== comparisons[0].classType
          ? t('Compare.Error.Class', { class: comparisons[0].classTypeNameLocalized })
          : t('Compare.Error.Archetype', { type: comparisons[0].typeName })
      );
      return;
    }

    if (dupes) {
      const allItems = item.getStoresService().getAllItems();
      const similarTypes = this.findSimilarTypes(allItems, item);
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
    let element = document.getElementById(item.index)!;
    if (!element) {
      throw new Error(`No element with id ${item.index}`);
    }
    element = element.parentNode!.parentNode! as HTMLElement;
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    window.scrollTo(0, absoluteElementTop - 150);
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
    if (!compare) {
      return [];
    }

    let armorSplit = 0;
    if (compare.bucket.inArmor) {
      armorSplit = _.sumBy(compare.stats!, (stat) => (stat.base === 0 ? 0 : stat.statHash));
    }

    const isArchetypeStat = (s: DimStat) =>
      s.statHash === (compare.isDestiny1 ? compare.stats![0].statHash : 4284893193);

    // TODO: in D2 the first perk is actually what determines the archetype!
    // 4284893193 is RPM in D2
    const archetypeStat = compare.stats!.find(isArchetypeStat);

    if (archetypeStat) {
      return similarTypes.filter((item: DimItem) => {
        if (item.bucket.inWeapons) {
          const archetypeMatch = item.stats!.find(isArchetypeStat);
          if (!archetypeMatch) {
            return false;
          }
          return archetypeMatch.base === archetypeStat.base;
        }
        return _.sumBy(item.stats!, (stat) => (stat.base === 0 ? 0 : stat.statHash)) === armorSplit;
      });
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
      name: t('Compare.Rating'),
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      enabled: false,
      getStat(item: DimItem) {
        const dtrRating = getRating(item, ratings);
        return { statHash: 0, value: (dtrRating && dtrRating.overallScore) || 0 };
      }
    });
  }
  if (firstComparison.primStat) {
    stats.push({
      id: firstComparison.primStat.statHash,
      name: firstComparison.primStat.stat.statName,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      enabled: false,
      getStat(item: DimItem) {
        return item.primStat!;
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
            name: stat.name,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            enabled: false,
            getStat(item: DimItem) {
              return item.stats!.find((s) => s.statHash === stat.statHash)!;
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
      }
    }
  });

  return stats;
}

export default connect<StoreProps>(mapStateToProps)(Compare);
