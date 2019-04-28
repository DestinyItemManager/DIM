import { t } from 'app/i18next-t';
import React, { ChangeEventHandler } from 'react';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { DimStore } from '../../inventory/store-types';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { AppIcon, refreshIcon } from '../../shell/icons';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import TierSelect from './TierSelect';
import { getBestSets, toggleLockedItem } from './utils';
import memoizeOne from 'memoize-one';
import { WindowScroller, AutoSizer, List } from 'react-virtualized';
import GeneratedSet from './GeneratedSet';

interface Props {
  processRunning: number;
  processError?: Error;
  selectedStore?: DimStore;
  processedSets: ArmorSet[];
  useBaseStats: boolean;
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  setUseBaseStats(event: React.ChangeEvent): void;
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  stats: { [statType in StatTypes]: MinMax };
  minimumPower: number;
  shownSets: number;
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
    minimumPower: 0,
    shownSets: 10
  };
  private windowScroller = React.createRef<WindowScroller>();

  private uniquePowerLevels = memoizeOne((_sets: ArmorSet[]) => {
    const uniquePowerLevels = new Set<number>();

    /*
    sets.forEach((set) => {
      const power = set.power / 5;
      uniquePowerLevels.add(Math.floor(power));
    });
    */
    const powerLevelOptions = Array.from(uniquePowerLevels).sort((a, b) => b - a);
    powerLevelOptions.splice(0, 0, 0);
    return powerLevelOptions;
  });

  componentWillReceiveProps(props: Props) {
    if (props.processedSets !== this.props.processedSets) {
      this.setState({ minimumPower: 0, shownSets: 10 });
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

    const powerLevelOptions = this.uniquePowerLevels(this.props.processedSets);
    let matchedSets = this.props.processedSets;
    // Filter before set tiers are generated
    if (minimumPower > 0) {
      // const minimum = minimumPower * 5;
      // matchedSets = this.props.processedSets.filter((set) => set.power >= minimum);
    }

    // TODO: cutoff sets under highest Tier?

    matchedSets = getBestSets(matchedSets, lockedMap, stats);

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
            <TierSelect stats={stats} onTierChange={this.onTierChange} />
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
          {matchedSets.length === 0 && <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>}
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
    this.setState({ shownSets: 10, minimumPower: parseInt(element.target.value, 10) });
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
