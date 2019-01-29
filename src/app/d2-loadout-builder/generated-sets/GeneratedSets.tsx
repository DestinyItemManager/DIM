import { t } from 'i18next';
import * as React from 'react';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { AppIcon, powerIndicatorIcon } from '../../shell/icons';
import { ArmorSet, LockedItemType, MinMax, StatTypes } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import TierSelect from './TierSelect';
import { getBestSets, toggleLockedItem } from './utils';

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
      Mobility: { min: 0, max: 10 },
      Resilience: { min: 0, max: 10 },
      Recovery: { min: 0, max: 10 }
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

  setMinimumPower = (element) => {
    this.setState({ shownSets: 10, minimumPower: parseInt(element.target.value, 10) });
  };

  toggleLockedItem = (lockedItem: LockedItemType) => {
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
      return set.power / 5 >= minimumPower;
    });
    const powerLevelOptions = Array.from(uniquePowerLevels).sort((a, b) => b - a);
    powerLevelOptions.splice(0, 0, 0);

    matchedSets = getBestSets(matchedSets, lockedMap, stats);

    return (
      <>
        <CollapsibleTitle
          title={t('LoadoutBuilder.SelectFilters')}
          sectionId="loadoutbuilder-options"
        >
          <div className="flex loadout-builder-row space-between">
            <TierSelect stats={stats} onTierChange={(stats) => this.setState({ stats })} />
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
          {matchedSets.slice(0, shownSets).map((set) => (
            <div className="generated-build" key={set.id}>
              <div className="generated-build-header">
                <span className="light">
                  <AppIcon icon={powerIndicatorIcon} /> {set.power / set.armor.length}
                </span>
                <span>
                  {`T${set.tiers[0].Mobility +
                    set.tiers[0].Resilience +
                    set.tiers[0].Recovery} | ${t('LoadoutBuilder.Mobility')} ${
                    set.tiers[0].Mobility
                  } | ${t('LoadoutBuilder.Resilience')} ${set.tiers[0].Resilience} | ${t(
                    'LoadoutBuilder.Recovery'
                  )} ${set.tiers[0].Recovery}`}
                </span>

                <GeneratedSetButtons
                  set={set}
                  store={selectedStore!}
                  onLoadoutSet={this.setCreateLoadout}
                />
              </div>
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
        </CollapsibleTitle>

        <LoadoutDrawer />
      </>
    );
  }
}
