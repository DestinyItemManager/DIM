import { t } from 'app/i18next-t';
import React from 'react';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { AppIcon, refreshIcon } from '../../shell/icons';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import TierSelect from './TierSelect';
import { getBestSets, toggleLockedItem } from './utils';
import memoizeOne from 'memoize-one';

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

  render() {
    const {
      processRunning,
      processError,
      lockedMap,
      selectedStore,
      setUseBaseStats,
      useBaseStats
    } = this.props;
    const { minimumPower, shownSets, stats } = this.state;

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
          {/* TODO: make a component */}
          {matchedSets.slice(0, shownSets).map((set) => (
            <div className="generated-build" key={set.id}>
              <div className="generated-build-header">
                <div>
                  {/* TODO: use stat icons */}
                  <span>
                    {`T${set.stats.Mobility + set.stats.Resilience + set.stats.Recovery} | ${t(
                      'LoadoutBuilder.Mobility'
                    )} ${set.stats.Mobility} | ${t('LoadoutBuilder.Resilience')} ${
                      set.stats.Resilience
                    } | ${t('LoadoutBuilder.Recovery')} ${set.stats.Recovery}`}
                  </span>
                  <span className="light">
                    {/*<AppIcon icon={powerIndicatorIcon} /> {set.power / set.armor.length}*/}
                  </span>
                </div>

                <GeneratedSetButtons
                  set={set}
                  store={selectedStore!}
                  onLoadoutSet={this.setCreateLoadout}
                />
              </div>
              <div className="sub-bucket">
                {set.armor.map((item) => (
                  <GeneratedSetItem
                    key={item[0].index}
                    item={item[0]}
                    locked={lockedMap[item[0].bucket.hash]}
                    onExclude={this.toggleLockedItem}
                  />
                ))}
              </div>
            </div>
          ))}
          {matchedSets.length > shownSets && (
            <button className="dim-button" onClick={this.showMore}>
              {t('LoadoutBuilder.ShowMore')}
            </button>
          )}
        </CollapsibleTitle>

        <LoadoutDrawer />
      </>
    );
  }

  private onTierChange = (stats) => this.setState({ stats });

  // Set the loadout property to show/hide the loadout menu
  private setCreateLoadout = (loadout: Loadout) => {
    dimLoadoutService.editLoadout(loadout, { showClass: false });
  };

  private showMore = () => {
    this.setState({ shownSets: this.state.shownSets + 10 });
  };

  private setMinimumPower = (element) => {
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
