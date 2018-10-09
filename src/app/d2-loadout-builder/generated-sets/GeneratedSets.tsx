import { t } from 'i18next';
import { $rootScope } from 'ngimport';
import * as React from 'react';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { DimStore } from '../../inventory/store-types';
import { Loadout } from '../../loadout/loadout.service';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { ArmorSet, LockedItemType } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { getSetsForTier, getSetTiers, toggleLockedItem, isD2Item } from './utils';

interface Props {
  processRunning: number;
  selectedStore?: DimStore;
  processedSets: ArmorSet[];
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  minimumPower: number;
  selectedTier: string;
  shownSets: number;
}

let matchedSets: ArmorSet[] = [];

/**
 * Renders the generated sets (processedSets)
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = {
    selectedTier: '7/7/7',
    minimumPower: 0,
    shownSets: 10
  };

  // Set the loadout property to show/hide the loadout menu
  setCreateLoadout = (loadout?: Loadout) => {
    $rootScope.$broadcast('dim-edit-loadout', {
      loadout,
      showClass: false
    });
  };

  componentWillReceiveProps(props: Props) {
    if (props.processedSets !== this.props.processedSets) {
      this.setState({ minimumPower: 0, shownSets: 10 });
    }
  }

  showMore = () => {
    this.setState({ shownSets: this.state.shownSets + 10 });
  };

  setSelectedTier = (element) => {
    this.setState({ shownSets: 10, selectedTier: element.target.value });
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
    const { selectedTier, minimumPower, shownSets } = this.state;

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

    // build tier dropdown options
    const setTiers = getSetTiers(matchedSets);
    let currentTier = selectedTier;
    if (!setTiers.includes(currentTier)) {
      currentTier = setTiers[1];
    }

    // Only render sets for the selected tier
    matchedSets = getSetsForTier(matchedSets, lockedMap, currentTier);

    if (matchedSets.length === 0) {
      return <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>;
    }

    return (
      <>
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

        <h3>{t('LoadoutBuilder.SelectTier')}</h3>
        <select value={currentTier} onChange={this.setSelectedTier}>
          {setTiers.map((tier) => (
            <option key={tier} disabled={tier.charAt(0) === '-'}>
              {tier}
            </option>
          ))}
        </select>

        <h3>{t('LoadoutBuilder.GeneratedBuilds')}</h3>
        {matchedSets.slice(0, shownSets).map((set, index) => (
          <div className="generated-build" key={index}>
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
