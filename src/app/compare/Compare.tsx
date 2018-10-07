import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import Sockets from '../move-popup/Sockets';
import { DimItem, DimStat, DimTalentGrid, D1Stat } from '../inventory/item-types';
import { router } from '../../router';
import { $rootScope } from 'ngimport';
import * as _ from 'underscore';
import { CompareService } from './compare.service';
import { toaster } from '../ngimport-more';
import { chainComparator, reverseComparator, compareBy } from '../comparators';
import { sum } from '../util';
import ItemTagSelector from '../move-popup/ItemTagSelector';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';
import { TalentGridComponent } from '../move-popup/talent-grid.component';

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

const TalentGrid = angular2react<{
  talentGrid: DimTalentGrid;
  perksOnly: boolean;
}>('dimTalentGrid', TalentGridComponent, lazyInjector.$injector as angular.auto.IInjectorService);

export default class Compare extends React.Component<{}, State> {
  state: State = {
    comparisons: [],
    similarTypes: [],
    archetypes: [],
    show: false
  };
  // tslint:disable-next-line:ban-types
  private $scope = $rootScope.$new(true);
  // tslint:disable-next-line:ban-types
  private listener: Function;

  componentDidMount() {
    this.listener = router.transitionService.onExit({}, () => {
      this.cancel();
    });

    this.$scope.$on('dim-store-item-compare', (_event, args) => {
      this.setState({ show: true });
      CompareService.dialogOpen = true;

      this.add(args);
    });
  }

  componentWillUnmount() {
    this.listener();
    this.$scope.$destroy();
  }

  render() {
    const { show, comparisons: unsortedComparisons, highlight, sortedHash } = this.state;

    if (!show || unsortedComparisons.length === 0) {
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

    // TODO: memoizeone? reselect?
    // TODO: CSS Grid? Subcomponents?
    // TODO: tags/ratings on items - do I need a connected item here?

    const firstComparison = comparisons[0];

    const allItems = firstComparison.getStoresService().getAllItems();
    const similarTypes = this.findSimilarTypes(allItems);
    const archeTypes = this.findArchetypes(similarTypes);

    const statBuckets = {};

    const bucketStat = (stat: { statHash: number; value?: number }) => {
      if (stat && stat.value) {
        (statBuckets[stat.statHash] = statBuckets[stat.statHash] || []).push(stat.value);
      }
    };

    comparisons.forEach((item: DimItem) => {
      if (item.stats && item.primStat) {
        item.stats.forEach(bucketStat);
        bucketStat(item.primStat);
        bucketStat({ statHash: 0, value: (item.dtrRating && item.dtrRating.overallScore) || 0 });
      }
    });

    const statRanges = {};
    _.each(statBuckets, (bucket: any, hash) => {
      const statRange = {
        min: Math.min(...bucket),
        max: Math.max(...bucket),
        enabled: false
      };
      statRange.enabled = statRange.min !== statRange.max;
      statRanges[hash] = statRange;
    });

    // TODO: handle missing stats by building a master stat list?

    return (
      <div id="loadout-drawer">
        <div className="compare-options">
          {archeTypes.length > 1 && (
            <button className="dim-button" onClick={() => this.compareSimilar('archetype')}>
              {t(firstComparison.bucket.inWeapons ? 'Compare.Archetype' : 'Compare.Splits', {
                quantity: archeTypes.length
              })}
            </button>
          )}
          {similarTypes.length > 1 && (
            <button className="dim-button" onClick={this.compareSimilar}>
              {t('Compare.All', { type: firstComparison.typeName, quantity: similarTypes.length })}
            </button>
          )}
          <button className="dim-button" onClick={this.cancel}>
            <span>{t('Compare.Close')}</span> <i className="fa fa-close" />
          </button>
        </div>
        <div className="compare-bucket" onMouseLeave={() => this.setHighlight(undefined)}>
          <div className="compare-item fixed-left">
            <div className="spacer" />
            <div
              className={classNames('compare-stat-label', {
                highlight: highlight === 'Rating',
                sorted: sortedHash === 'Rating'
              })}
              onMouseOver={() => this.setHighlight('Rating')}
              onClick={() => this.sort('Rating')}
            >
              {t('Compare.Rating')}
            </div>
            {firstComparison.isDestiny1() &&
              firstComparison.primStat && (
                <div
                  className={classNames('compare-stat-label', {
                    highlight: highlight === firstComparison.primStat.statHash,
                    sorted: sortedHash === firstComparison.primStat.statHash
                  })}
                  onMouseOver={() => this.setHighlight(firstComparison.primStat!.statHash)}
                  onClick={() => this.sort(firstComparison.primStat!.statHash)}
                >
                  {firstComparison.primStat.stat.statName ||
                    firstComparison.primStat.stat.displayProperties.name}
                </div>
              )}
            {firstComparison.stats &&
              firstComparison.stats.map((stat) => (
                <div
                  key={stat.statHash}
                  className={classNames('compare-stat-label', {
                    highlight: highlight === stat.statHash,
                    sorted: sortedHash === stat.statHash
                  })}
                  onMouseOver={() => this.setHighlight(stat.statHash)}
                  onClick={() => this.sort(stat.statHash)}
                >
                  {stat.name}
                </div>
              ))}
          </div>
          {comparisons.map((item) => (
            <div key={item.id} className="compare-item">
              <div className="close" onClick={() => this.remove(item)} />
              <ItemTagSelector
                tag={item.dimInfo.tag}
                onTagUpdated={() => console.error('NOT IMPLEMENTED')}
              />
              <div className="item-name" onClick={() => this.itemClick(item)}>
                {item.name}
              </div>
              <ConnectedInventoryItem item={item} />
              <div
                className={classNames({ highlight: highlight === 'Rating' })}
                onMouseOver={() => this.setHighlight('Rating')}
                ng-style="{value:item.dtrRating.overallScore, statHash:0} | statRange:statRanges | qualityColor:'color'"
              >
                <span>
                  {(item.dtrRating && item.dtrRating.overallScore) || t('Stats.NotApplicable')}
                </span>
              </div>
              {item.primStat && (
                <div
                  className={classNames({ highlight: highlight === item.primStat.statHash })}
                  onMouseOver={() => this.setHighlight(item.primStat!.statHash)}
                  ng-style="item.primStat | statRange:statRanges | qualityColor:'color'"
                >
                  <span>{item.primStat.value}</span>
                </div>
              )}
              {item.stats &&
                item.stats.map((stat) => (
                  <div
                    key={stat.statHash}
                    className={classNames({ highlight: highlight === stat.statHash })}
                    onMouseOver={() => this.setHighlight(stat.statHash)}
                    ng-style="stat | statRange:statRanges | qualityColor:'color'"
                  >
                    <span>
                      {stat.value || t('Stats.NotApplicable')}
                      {Boolean(stat.value) &&
                        (stat as D1Stat).qualityPercentage &&
                        Boolean((stat as D1Stat).qualityPercentage!.range) && (
                          <span className="range">
                            ({(stat as D1Stat).qualityPercentage!.range})
                          </span>
                        )}
                    </span>
                  </div>
                ))}
              {item.talentGrid && <TalentGrid talentGrid={item.talentGrid} perksOnly={true} />}
              {item.isDestiny2() && item.sockets && <Sockets item={item} $scope={this.$scope} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  private compareSimilar = (type) => {
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
      const archetypes = this.findArchetypes(similarTypes);
      this.setState({
        comparisons: allItems.filter((i) => i.hash === item.hash),
        // TODO: I'd rather not store these on state - they should just be a memoized selector
        similarTypes,
        archetypes
      });
    } else if (comparisons.some((i) => i.id === item.id)) {
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
    const element = document.getElementById(item.index)!;
    if (!element) {
      throw new Error(`No element with id ${item.index}`);
    }
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
    return allItems.filter(
      (i) =>
        compare.bucket.inArmor ? i.classType === compare.classType : i.typeName === compare.typeName
    );
  };

  private findArchetypes = (similarTypes: DimItem[]) => {
    const { comparisons } = this.state;
    const compare = comparisons[0];

    let armorSplit = 0;
    if (compare.bucket.inArmor) {
      armorSplit = sum(compare.stats!, (stat) => (stat.base === 0 ? 0 : stat.statHash));
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
        return sum(item.stats!, (stat) => (stat.base === 0 ? 0 : stat.statHash)) === armorSplit;
      });
    }
    return [];
  };
}
