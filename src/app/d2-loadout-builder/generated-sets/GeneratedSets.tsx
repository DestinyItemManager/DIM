import { t } from 'i18next';
import * as React from 'react';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { ArmorSet, LockedItemType, StatTypes, MinMax } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { isD2Item, toggleLockedItem, getBestSets } from './utils';
import TierSelect from './TierSelect';

interface Props {
  processRunning: number;
  selectedStore?: DimStore;
  processedSets: ArmorSet[];
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  stats: { [statType in StatTypes]: MinMax };
  minimumPower: number;
  shownSets: number;
}

let matchedSets: ArmorSet[] = [];

/**
 * Renders the generated sets (processedSets)
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = {
    stats: {
      STAT_MOBILITY: { min: 0, max: 10 },
      STAT_RESILIENCE: { min: 0, max: 10 },
      STAT_RECOVERY: { min: 0, max: 10 }
    },
    minimumPower: 0,
    shownSets: 10
  };

  // Set the loadout property to show/hide the loadout menu
  setCreateLoadout = (loadout: Loadout) => {
    dimLoadoutService.editLoadout(loadout, { showClass: false });
  };

  componentWillReceiveProps(props: Props) {
    if (props.processedSets !== this.props.processedSets) {
      this.setState({ minimumPower: 0, shownSets: 10 });
    }
  }

  showMore = () => {
    this.setState({ shownSets: this.state.shownSets + 10 });
  };

  onTierChanged = (which: string, changed) => {
    const newTiers = this.state.stats;
    if (changed.min) {
      if (changed.min >= newTiers[which].max) {
        newTiers[which].max = changed.min;
      }
      newTiers[which].min = changed.min;
    }
    if (changed.max) {
      if (changed.max <= newTiers[which].min) {
        newTiers[which].min = changed.max;
      }
      newTiers[which].max = changed.max;
    }
    this.setState({ stats: newTiers });
  };

  setMinimumPower = (element) => {
    this.setState({ shownSets: 10, minimumPower: parseInt(element.target.value, 10) });
  };

  toggleLockedItem = (lockedItem: LockedItemType) => {
    if (!isD2Item(lockedItem.item)) {
      return;
    }
    const bucket = lockedItem.item.bucket;
    toggleLockedItem(
      lockedItem,
      bucket,
      this.props.onLockChanged,
      this.props.lockedMap[bucket.hash]
    );
  };

  render() {
    const { processRunning, lockedMap, selectedStore } = this.props;
    const { minimumPower, shownSets, stats } = this.state;

    if (processRunning > 0) {
      return <h3>{t('LoadoutBuilder.Loading', { loading: processRunning })}</h3>;
    }

    // Filter before set tiers are generated
    const uniquePowerLevels = new Set<number>();
    matchedSets = this.props.processedSets.filter((set) => {
      uniquePowerLevels.add(Math.floor(set.power / 5));
      return set.power / 5 > minimumPower;
    });
    const powerLevelOptions = Array.from(uniquePowerLevels).sort((a, b) => b - a);
    powerLevelOptions.splice(0, 0, 0);

    matchedSets = getBestSets(matchedSets, lockedMap, stats);

    return (
      <>
        <div className="flex mr4">
          <div>
            <h3>{t('LoadoutBuilder.SelectTier')}</h3>
            <div className="flex">
              <TierSelect
                name={t('LoadoutBuilder.Mobility')}
                stat={stats.STAT_MOBILITY}
                onTierChange={(stat) => this.onTierChanged('STAT_MOBILITY', stat)}
              />
              <TierSelect
                name={t('LoadoutBuilder.Resilience')}
                stat={stats.STAT_RESILIENCE}
                onTierChange={(stat) => this.onTierChanged('STAT_RESILIENCE', stat)}
              />
              <TierSelect
                name={t('LoadoutBuilder.Recovery')}
                stat={stats.STAT_RECOVERY}
                onTierChange={(stat) => this.onTierChanged('STAT_RECOVERY', stat)}
              />
            </div>
          </div>
          <div>
            <h3>{t('LoadoutBuilder.SelectPower')}</h3>
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

        <h3>{t('LoadoutBuilder.GeneratedBuilds')}</h3>
        {matchedSets.length === 0 && <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>}
        {matchedSets.slice(0, shownSets).map((set) => (
          <div className="generated-build" key={set.id}>
            <GeneratedSetButtons
              set={set}
              store={selectedStore!}
              onLoadoutSet={this.setCreateLoadout}
            />
            <div className="sub-bucket">
              {Object.values(set.armor).map((item) => (
                <GeneratedSetItem
                  key={item.index}
                  item={item}
                  locked={lockedMap[item.bucket.hash]}
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
        <LoadoutDrawer />
      </>
    );
  }
}
