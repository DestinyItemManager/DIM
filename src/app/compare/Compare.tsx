import { settingsSelector } from 'app/dim-api/selectors';
import { itemPop } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { powerCapPlugSetHash } from 'app/search/d2-known-values';
import { setSetting } from 'app/settings/actions';
import Checkbox from 'app/settings/Checkbox';
import { RootState } from 'app/store/types';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import { isEmpty } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { createSelector } from 'reselect';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimPlug, DimSocket, DimStat } from '../inventory/item-types';
import { showNotification } from '../notifications/notifications';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { Subscriptions } from '../utils/rx-utils';
import { CompareButton, findSimilarArmors, findSimilarWeapons } from './compare-buttons';
import './compare.scss';
import { CompareService } from './compare.service';
import CompareItem from './CompareItem';
import { DimAdjustedItemStat, DimAdjustedPlugs, DimAdjustedStats } from './types';

interface StoreProps {
  allItems: DimItem[];
  defs?: D2ManifestDefinitions;
  compareBaseStats: boolean;
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & RouteComponentProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    allItems: allItemsSelector(state),
    defs: state.manifest.d2Manifest,
    compareBaseStats: settingsSelector(state).compareBaseStats,
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
  comparisonSets: CompareButton[];
  adjustedPlugs?: DimAdjustedPlugs;
  adjustedStats?: DimAdjustedStats;
}

export interface StatInfo {
  id: string | number;
  displayProperties: DestinyDisplayPropertiesDefinition;
  min: number;
  max: number;
  enabled: boolean;
  lowerBetter: boolean;
  getStat: StatGetter;
}

/** a DimStat with, at minimum, a statHash */
export type MinimalStat = Partial<DimStat> & Pick<DimStat, 'statHash'>;
type StatGetter = (item: DimItem) => undefined | MinimalStat;

class Compare extends React.Component<Props, State> {
  state: State = {
    comparisonItems: [],
    comparisonSets: [],
    show: false,
    sortBetterFirst: true,
  };
  private subscriptions = new Subscriptions();

  // Memoize computing the list of stats
  private getAllStatsSelector = createSelector(
    (state: State) => state.comparisonItems,
    (_state: State, props: Props) => props.compareBaseStats,
    (state: State) => state.adjustedStats,
    getAllStats
  );

  componentDidMount() {
    this.subscriptions.add(
      CompareService.compareItems$.subscribe((args) => {
        this.setState({ show: true });
        if (CompareService.dialogOpen == false) {
          CompareService.dialogOpen = true;
          ga('send', 'pageview', '/profileMembershipId/compare');
        }

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
    const { compareBaseStats, setSetting } = this.props;
    const {
      show,
      comparisonItems: unsortedComparisonItems,
      sortedHash,
      highlight,
      comparisonSets,
      adjustedPlugs,
      adjustedStats,
    } = this.state;

    if (!show || unsortedComparisonItems.length === 0) {
      CompareService.dialogOpen = false;
      return null;
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setSetting(e.target.name as any, e.target.checked);
    };

    const comparisonItems = !sortedHash
      ? unsortedComparisonItems
      : Array.from(unsortedComparisonItems).sort(
          reverseComparator(
            chainComparator(
              compareBy((item: DimItem) => {
                const stat =
                  item.primStat && sortedHash === item.primStat.statHash
                    ? (item.primStat as MinimalStat)
                    : sortedHash === 'EnergyCapacity'
                    ? {
                        value: item.energy?.energyCapacity || 0,
                        base: undefined,
                      }
                    : sortedHash === 'PowerCap'
                    ? {
                        value: item.powerCap || 99999999,
                        base: undefined,
                      }
                    : (item.stats || []).find((s) => s.statHash === sortedHash);

                if (!stat) {
                  return -1;
                }

                const shouldReverse =
                  isDimStat(stat) && stat.smallerIsBetter
                    ? this.state.sortBetterFirst
                    : !this.state.sortBetterFirst;

                const statValue = (compareBaseStats ? stat.base ?? stat.value : stat.value) || 0;
                return shouldReverse ? -statValue : statValue;
              }),
              compareBy((i) => i.index),
              compareBy((i) => i.name)
            )
          )
        );

    const stats = this.getAllStatsSelector(this.state, this.props);

    const updateSocketComparePlug = ({
      item,
      socket,
      plug: clickedPlug,
    }: {
      item: DimItem;
      socket: DimSocket;
      plug: DimPlug;
    }) => {
      const { socketIndex } = socket;
      const currentAdjustedPlug = adjustedPlugs?.[item.id]?.[socketIndex];
      const pluggedPlug = item.sockets?.allSockets[socketIndex]?.plugged;

      /**
       * Exit early if this plug / socket isn't a clickable target
       * TODO: check the socket index detail
       * */
      if (
        item.destinyVersion === 1 ||
        !item.sockets ||
        !item.stats ||
        socketIndex > 2 ||
        !pluggedPlug ||
        (clickedPlug.plugDef.hash === pluggedPlug?.plugDef.hash &&
          currentAdjustedPlug === undefined)
      ) {
        return;
      }

      /**
       * Determine the next plug
       * If the clicked plug is the currently adjusted plug,
       * the next should be the original plug in the socket
       */
      const nextPlug =
        clickedPlug.plugDef.hash === currentAdjustedPlug?.plugDef.hash ? pluggedPlug : clickedPlug;

      /**
       * Determine the previous plug
       * If the clicked plug is the currently adjusted plug,
       * the previous should be the clicked plug
       */
      const prevPlug =
        clickedPlug.plugDef.hash === currentAdjustedPlug?.plugDef?.hash
          ? clickedPlug
          : currentAdjustedPlug ?? pluggedPlug;

      /**
       * Update the adjustedPlugs object
       * If the next plug is the original plug, delete the adjustedPlug entry
       * Else add the next plug to the item socket entry
       */
      const updatedPlugs =
        nextPlug.plugDef.hash === pluggedPlug.plugDef.hash
          ? produce(adjustedPlugs, (draft) => {
              delete draft?.[item.id]?.[socketIndex];
            })
          : adjustedPlugs?.[item.id] !== undefined
          ? produce(adjustedPlugs, (draft) => {
              draft[item.id][socketIndex] = nextPlug;
            })
          : produce(adjustedPlugs ?? {}, (draft) => {
              draft[item.id] = { [socketIndex]: nextPlug };
            });

      /**
       * If there are no more adjustedPlugs for the item
       * delete the associated adjustedPlugs and adjustedStats entries and exit
       */
      if (isEmpty(updatedPlugs?.[item.id])) {
        const emptiedPlugs = produce(updatedPlugs, (draft) => {
          delete draft?.[item.id];
        });
        const emptiedStats = produce(adjustedStats, (draft) => {
          delete draft?.[item.id];
        });
        this.setState({
          adjustedPlugs: emptiedPlugs,
          adjustedStats: emptiedStats,
        });
        return;
      }

      // Remove the stats listed on the previous plug from adjustedStats
      const itemStatsAfterRemoval: DimAdjustedItemStat | undefined = this.calculateUpdatedStats({
        itemStats: item.stats,
        adjustedStats: adjustedStats?.[item.id] ?? {},
        plugStats: prevPlug.stats,
        mode: 'remove',
      });

      // Add the stats listed on the next plug to adjustedStats
      const itemStatsAfterAddition: DimAdjustedItemStat | undefined = this.calculateUpdatedStats({
        itemStats: item.stats,
        adjustedStats: itemStatsAfterRemoval ?? adjustedStats?.[item.id] ?? {},
        plugStats: nextPlug.stats,
        mode: 'add',
      });

      // Update the adjustedStats object
      const updatedStats = produce(adjustedStats ?? {}, (draft) => {
        if (itemStatsAfterAddition) {
          draft[item.id] = itemStatsAfterAddition;
        }
      });

      this.setState({
        adjustedPlugs: updatedPlugs,
        adjustedStats: updatedStats,
      });
    };

    return (
      <Sheet
        onClose={this.cancel}
        header={
          <div className="compare-options">
            <Checkbox
              label={t('Compare.CompareBaseStats')}
              name="compareBaseStats"
              value={compareBaseStats}
              onChange={onChange}
            />
            {comparisonSets.map(({ buttonLabel, items }, index) => (
              <button
                type="button"
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
                    sorted: stat.id === sortedHash,
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
                  itemClick={itemPop}
                  remove={this.remove}
                  setHighlight={this.setHighlight}
                  highlight={highlight}
                  updateSocketComparePlug={updateSocketComparePlug}
                  adjustedItemPlugs={adjustedPlugs?.[item.id]}
                  adjustedItemStats={adjustedStats?.[item.id]}
                  compareBaseStats={compareBaseStats}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    );
  }

  private calculateUpdatedStats = ({
    itemStats,
    adjustedStats,
    plugStats,
    mode,
  }: {
    itemStats: DimStat[];
    adjustedStats: DimAdjustedItemStat;
    plugStats: DimPlug['stats'];
    mode: string;
  }): DimAdjustedItemStat | undefined => {
    if (!plugStats) {
      return adjustedStats;
    }

    const updatedStats = produce(adjustedStats ?? {}, (draft) => {
      for (const statHash in plugStats) {
        const itemStatIndex = itemStats.findIndex((stat) => stat.statHash === parseInt(statHash));
        const calcStat: number = draft?.[statHash] ?? itemStats[itemStatIndex]?.value;

        if (calcStat) {
          draft[statHash] =
            mode === 'add' ? calcStat + plugStats[statHash] : calcStat - plugStats[statHash];
        }
      }
    });

    return updatedStats;
  };

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
      sortedHash: undefined,
      adjustedPlugs: undefined,
      adjustedStats: undefined,
    });
    CompareService.dialogOpen = false;
  };

  private compareSimilar = (e: React.MouseEvent, comparisonSetItems: DimItem[]) => {
    e.preventDefault();
    this.setState({
      comparisonItems: comparisonSetItems,
    });
  };

  private sort = (sortedHash?: string | number) => {
    this.setState((prevState) => ({
      sortedHash,
      sortBetterFirst: prevState.sortedHash === sortedHash ? !prevState.sortBetterFirst : true,
    }));
  };
  private add = ({
    additionalItems,
    showSomeDupes,
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
            : t('Compare.Error.Archetype', { type: comparisonItems[0].typeName }),
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
      // comparisonSets is an array so that it has order, filled with {label, setOfItems} objects
      const comparisonSets = exampleItem.bucket.inArmor
        ? this.findSimilarArmors(additionalItems)
        : exampleItem.bucket.inWeapons
        ? this.findSimilarWeapons(additionalItems)
        : [];

      // if this was spawned from an item, and not from a search,
      // DIM tries to be helpful by including a starter comparison of dupes
      if (additionalItems.length === 1 && showSomeDupes) {
        const comparisonItems = comparisonSets[0]?.items ?? additionalItems;
        this.setState({
          comparisonSets,
          comparisonItems,
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

  private findSimilarArmors = (comparisonItems: DimItem[]) => {
    const exampleItem = comparisonItems[0];
    return findSimilarArmors(this.props.allItems, exampleItem);
  };

  private findSimilarWeapons = (comparisonItems: DimItem[]) => {
    const exampleItem = comparisonItems[0];
    return findSimilarWeapons(this.props.allItems, exampleItem);
  };
}

function getAllStats(
  comparisonItems: DimItem[],
  compareBaseStats: boolean,
  adjustedStats?: { [itemId: string]: { [statHash: number]: number } }
) {
  const firstComparison = comparisonItems[0];
  compareBaseStats = Boolean(compareBaseStats && firstComparison.bucket.inArmor);
  const stats: StatInfo[] = [];

  if (firstComparison.primStat) {
    stats.push(
      makeFakeStat(
        firstComparison.primStat.statHash,
        firstComparison.primStat.stat.displayProperties,
        (item: DimItem) => item.primStat || undefined
      )
    );
  }
  if (
    firstComparison.destinyVersion === 2 &&
    (firstComparison.bucket.inArmor || firstComparison.bucket.inWeapons)
  ) {
    stats.push(
      makeFakeStat('PowerCap', t('Stats.PowerCap'), (item: DimItem) => ({
        statHash: powerCapPlugSetHash,
        value: item.powerCap ?? undefined,
        base: undefined,
      }))
    );
  }

  if (firstComparison.destinyVersion === 2 && firstComparison.bucket.inArmor) {
    stats.push(
      makeFakeStat(
        'EnergyCapacity',
        t('EnergyMeter.Energy'),
        (item: DimItem) =>
          (item.energy && {
            statHash: item.energy.energyType,
            value: item.energy.energyCapacity,
            base: undefined,
          }) ||
          undefined
      )
    );
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
            },
          };
          statsByHash[stat.statHash] = statInfo;
          stats.push(statInfo);
        }
      }
    }
  }

  for (const stat of stats) {
    for (const item of comparisonItems) {
      const itemStat = stat.getStat(item);
      const adjustedStatValue = adjustedStats?.[item.id]?.[stat.id];
      if (itemStat) {
        stat.min = Math.min(
          stat.min,
          (compareBaseStats
            ? itemStat.base ?? adjustedStatValue ?? itemStat.value
            : adjustedStatValue ?? itemStat.value) || 0
        );
        stat.max = Math.max(
          stat.max,
          (compareBaseStats
            ? itemStat.base ?? adjustedStatValue ?? itemStat.value
            : adjustedStatValue ?? itemStat.value) || 0
        );
        stat.enabled = stat.min !== stat.max;
        stat.lowerBetter = isDimStat(itemStat) ? itemStat.smallerIsBetter : false;
      }
    }
  }

  return stats;
}

function isDimStat(stat: DimStat | any): stat is DimStat {
  return Object.prototype.hasOwnProperty.call(stat as DimStat, 'smallerIsBetter');
}

function makeFakeStat(
  id: string | number,
  displayProperties: DestinyDisplayPropertiesDefinition | string,
  getStat: StatGetter,
  lowerBetter = false
) {
  if (typeof displayProperties === 'string') {
    displayProperties = { name: displayProperties } as DestinyDisplayPropertiesDefinition;
  }
  return {
    id,
    displayProperties,
    min: Number.MAX_SAFE_INTEGER,
    max: 0,
    enabled: false,
    lowerBetter,
    getStat,
  };
}

export default withRouter(
  connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(Compare)
);
