import { t } from 'app/i18next-t';
import React, { ChangeEventHandler } from 'react';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { DimStore, D2Store } from '../../inventory/store-types';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { AppIcon, refreshIcon } from '../../shell/icons';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import TierSelect from './TierSelect';
import { getBestSets, toggleLockedItem, getPower } from './utils';
import memoizeOne from 'memoize-one';
import { WindowScroller, AutoSizer, List } from 'react-virtualized';
import GeneratedSet from './GeneratedSet';
import _ from 'lodash';

interface Props {
  processRunning: number;
  processError?: Error;
  selectedStore: DimStore;
  processedSets: ArmorSet[];
  useBaseStats: boolean;
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  setUseBaseStats(event: React.ChangeEvent): void;
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  stats: { [statType in StatTypes]: MinMax };
  minimumPower: number;
}

/**
 * Renders the generated sets (processedSets)
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = {
    stats: {
      Mobility: { min: 0, max: 10 },
      Resilience: { min: 0, max: 10 },
      Recovery: { min: 0, max: 10 }
    },
    minimumPower: 0
  };
  private windowScroller = React.createRef<WindowScroller>();

  private uniquePowerLevels = memoizeOne((store: D2Store) => {
    return _.range(store.stats.maxBasePower!.tierMax || 0, -1, -1);
  });

  componentWillReceiveProps(props: Props) {
    if (props.processedSets !== this.props.processedSets) {
      this.setState({ minimumPower: 0 });
    }
  }

  componentDidUpdate() {
    this.windowScroller.current && this.windowScroller.current.updatePosition();
  }

  render() {
    const {
      processRunning,
      processError,
      lockedMap,
      selectedStore,
      setUseBaseStats,
      useBaseStats
    } = this.props;
    const { minimumPower, stats } = this.state;

    if (processError) {
      console.error(processError);
      return (
        <div className="dim-error">
          <h2>{t('ErrorBoundary.Title')}</h2>
          <div>{processError.message}</div>
        </div>
      );
    }

    if (processRunning > 0) {
      return (
        <h3>
          {t('LoadoutBuilder.Loading', { loading: processRunning })}{' '}
          <AppIcon spinning={true} icon={refreshIcon} />
        </h3>
      );
    }

    const powerLevelOptions = this.uniquePowerLevels(this.props.selectedStore as D2Store);

    // TODO: memoize
    console.time('Filter sets');
    let matchedSets = this.props.processedSets;
    // Filter before set tiers are generated
    if (minimumPower > 0) {
      matchedSets = matchedSets.filter((set) => getPower(set) >= minimumPower);
    }

    // TODO: cutoff sets under highest Tier?
    // TODO: disable options for impossible sets

    matchedSets = getBestSets(matchedSets, lockedMap, stats);
    console.timeEnd('Filter sets');

    // TODO: memoize?
    const statRanges = {
      Mobility: { min: 10, max: 0 },
      Resilience: { min: 10, max: 0 },
      Recovery: { min: 10, max: 0 }
    };
    for (const set of matchedSets) {
      for (const prop of ['Mobility', 'Resilience', 'Recovery']) {
        statRanges[prop].min = Math.min(set.stats[prop], statRanges[prop].min);
        statRanges[prop].max = Math.max(set.stats[prop], statRanges[prop].max);
      }
    }

    return (
      <>
        <CollapsibleTitle
          title={t('LoadoutBuilder.SelectFilters')}
          sectionId="loadoutbuilder-options"
        >
          <div className="flex loadout-builder-row space-between">
            <div className="mr4">
              <input
                id="useBaseStats"
                type="checkbox"
                onChange={setUseBaseStats}
                checked={useBaseStats}
              />
              <label htmlFor="useBaseStats">{t('LoadoutBuilder.UseBaseStats')}</label>
            </div>
            <TierSelect stats={stats} statRanges={statRanges} onTierChange={this.onTierChange} />
            <div className="mr4">
              <span>{t('LoadoutBuilder.SelectPower')}</span>
              <select value={minimumPower} onChange={this.setMinimumPower}>
                {powerLevelOptions.map((power) => {
                  if (power === 0) {
                    return (
                      <option value={0} key={power}>
                        {t('LoadoutBuilder.SelectPowerMinimum')}
                      </option>
                    );
                  }
                  return <option key={power}>{power}</option>;
                })}
              </select>
            </div>
          </div>
        </CollapsibleTitle>

        <CollapsibleTitle
          title={t('LoadoutBuilder.GeneratedBuilds')}
          sectionId="loadoutbuilder-generated"
        >
          {matchedSets.length > 0 && <p>{matchedSets.length} stat mixes</p>}
          <WindowScroller ref={this.windowScroller}>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              <AutoSizer disableHeight={true}>
                {({ width }) => (
                  <List
                    autoHeight={true}
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    overscanRowCount={2}
                    rowCount={matchedSets.length}
                    rowHeight={140}
                    rowRenderer={({ index, key, style }) => (
                      <GeneratedSet
                        key={key}
                        style={style}
                        set={matchedSets[index]}
                        selectedStore={selectedStore}
                        lockedMap={lockedMap}
                        toggleLockedItem={this.toggleLockedItem}
                      />
                    )}
                    noRowsRenderer={() => <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>}
                    scrollTop={scrollTop}
                    width={width}
                  />
                )}
              </AutoSizer>
            )}
          </WindowScroller>
        </CollapsibleTitle>

        <LoadoutDrawer />
      </>
    );
  }

  private onTierChange = (stats) => this.setState({ stats });

  private setMinimumPower: ChangeEventHandler<HTMLSelectElement> = (element) => {
    this.setState({ minimumPower: parseInt(element.target.value, 10) });
  };

  private toggleLockedItem = (lockedItem: LockedItemType) => {
    if (lockedItem.type !== 'exclude') {
      return;
    }
    const bucket = (lockedItem.item as D2Item).bucket;
    toggleLockedItem(
      lockedItem,
      bucket,
      this.props.onLockChanged,
      this.props.lockedMap[bucket.hash]
    );
  };
}
