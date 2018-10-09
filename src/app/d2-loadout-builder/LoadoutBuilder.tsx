import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs/Subscription';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import CharacterDropdown from '../character-select/CharacterDropdown';
import { Loading } from '../dim-ui/Loading';
import { D2StoresService } from '../inventory/d2-stores.service';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { D2Item } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterPlugs } from './generated-sets/utils';
import './loadoutbuilder.scss';
import LockedArmor from './locked-armor/LockedArmor';
import startNewProcess from './process';
import { ArmorSet, LockableBuckets, LockedItemType } from './types';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
}

type Props = ProvidedProps & StoreProps;

interface State {
  processRunning: number;
  requirePerks: boolean;
  requireBurn: 'none' | 'arc' | 'solar' | 'void';
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  processedSets: ArmorSet[];
  selectedStore?: DimStore;
  trackerService?: DestinyTrackerService;
}

const burnTypes = {
  none: 'BurnTypeNone',
  arc: 'BurnTypeArc',
  solar: 'BurnTypeSolar',
  void: 'BurnTypeVoid'
};

const perks: {
  [classType: number]: { [bucketHash: number]: any };
} = {};
const items: {
  [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
} = {};

function mapStateToProps(state: RootState): StoreProps {
  return {
    buckets: state.inventory.buckets!,
    storesLoaded: state.inventory.stores.length > 0,
    stores: state.inventory.stores
  };
}

/**
 * The Loadout Builder screen
 */
export class LoadoutBuilder extends React.Component<Props & UIViewInjectedProps, State> {
  private storesSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      requirePerks: true,
      requireBurn: 'none',
      processRunning: 0,
      lockedMap: {},
      processedSets: []
    };
  }

  componentDidMount() {
    this.storesSubscription = D2StoresService.getStoresStream(this.props.account).subscribe(
      (stores) => {
        if (!stores) {
          return;
        }

        this.setState({ selectedStore: stores.find((s) => s.current) });
        for (const store of stores) {
          for (const item of store.items) {
            if (
              !item ||
              !item.sockets ||
              !item.bucket.inArmor ||
              !['Exotic', 'Legendary'].includes(item.tier)
            ) {
              continue;
            }
            if (!perks[item.classType]) {
              perks[item.classType] = {};
              items[item.classType] = {};
            }
            if (!perks[item.classType][item.bucket.hash]) {
              perks[item.classType][item.bucket.hash] = new Set<DestinyInventoryItemDefinition>();
              items[item.classType][item.bucket.hash] = [];
            }

            if (!items[item.classType][item.bucket.hash][item.hash]) {
              items[item.classType][item.bucket.hash][item.hash] = [];
            }
            items[item.classType][item.bucket.hash][item.hash].push(item);

            // build the filtered unique perks item picker
            item.sockets.categories.length === 2 &&
              item.sockets.categories[0].sockets.filter(filterPlugs).forEach((socket) => {
                socket!.plugOptions.forEach((option) => {
                  perks[item.classType][item.bucket.hash].add(option.plugItem);
                });
              });
          }
        }

        // sort exotic perks first, then by index
        Object.keys(perks).forEach((classType) =>
          Object.keys(perks[classType]).forEach((bucket) =>
            (perks[classType][bucket] = [...perks[classType][bucket]].sort(
              (a, b) => b.index - a.index
            )).sort((a, b) => b.inventory.tierType - a.inventory.tierType)
          )
        );

        if (!this.state.selectedStore) {
          this.onCharacterChanged(stores.find((s) => s.current)!.id);
        } else {
          const selectedStore = stores.find((s) => s.id === this.state.selectedStore!.id)!;
          this.setState({ selectedStore });
          this.computeSets({ classType: selectedStore.classType });
        }
      }
    );
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  /**
   * This function should be fired any time that a configuration option changes
   *
   * The work done in this function is to filter down items to process based on what is locked
   */
  computeSets = ({
    classType = this.state.selectedStore!.classType,
    lockedMap = this.state.lockedMap,
    requirePerks = this.state.requirePerks,
    requireBurn = this.state.requireBurn
  }: {
    classType?: number;
    lockedMap?: { [bucketHash: number]: LockedItemType[] };
    requirePerks?: boolean;
    requireBurn?: string;
  }) => {
    const allItems = { ...items[classType] };
    const filteredItems: { [bucket: number]: D2Item[] } = {};

    Object.keys(allItems).forEach((bucketStr) => {
      const bucket = parseInt(bucketStr, 10);

      // if we are locking an item in that bucket, filter to only those items
      if (lockedMap[bucket] && lockedMap[bucket][0].type === 'item') {
        filteredItems[bucket] = [lockedMap[bucket][0].item as D2Item];
        return;
      }

      // otherwise flatten all item instances to each bucket
      filteredItems[bucket] = _.flatten(
        Object.values(allItems[bucket]).map((items) => {
          if (!lockedMap[bucket]) {
            return items.reduce((a, b) => (a.basePower > b.basePower ? a : b));
          }
          return items;
        })
      );

      // filter out items without extra perks on them
      if (requirePerks) {
        filteredItems[bucket] = filteredItems[bucket].filter((item) => {
          if (
            item &&
            item.sockets &&
            item.sockets.categories &&
            item.sockets.categories.length === 2
          ) {
            return item.sockets.categories[0].sockets.filter(filterPlugs).length;
          }
        });
      }

      // filter out items that do not match the burn type
      if (requireBurn !== 'none') {
        filteredItems[bucket] = filteredItems[bucket].filter((item: D2Item) => {
          return item && item.dmg === requireBurn;
        });
      }
    });

    // filter to only include items that are in the locked map
    Object.keys(lockedMap).forEach((bucketStr) => {
      const bucket = parseInt(bucketStr, 10);
      // if there are locked items for this bucket
      if (lockedMap[bucket] && lockedMap[bucket].length) {
        // loop over each locked item
        lockedMap[bucket].forEach((lockedItem: LockedItemType) => {
          // filter out excluded items
          if (lockedItem.type === 'exclude') {
            filteredItems[bucket] = filteredItems[bucket].filter(
              (item) =>
                !lockedMap[bucket].find((excludeItem) => excludeItem.item.index === item.index)
            );
          }
          if (lockedItem.type === 'perk') {
            // filter out items that do not have a locked perk
            filteredItems[bucket] = filteredItems[bucket].filter(
              (item) =>
                item.sockets &&
                item.sockets.sockets.find((slot) =>
                  Boolean(
                    slot.plugOptions.find((perk) =>
                      Boolean(
                        lockedMap[bucket].find(
                          (lockedPerk) => lockedPerk.item.hash === perk.plugItem.hash
                        )
                      )
                    )
                  )
                )
            );
          }
        });
      }
    });

    // re-process all sets
    startNewProcess.call(this, filteredItems);
    this.setState({ lockedMap });
  };

  /**
   * Reset all locked items and recompute for all sets
   * Recomputes matched sets
   */
  resetLocked = () => {
    this.setState({ lockedMap: {} });
    this.computeSets({ lockedMap: {} });
  };

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  lockEquipped = () => {
    const lockedMap: State['lockedMap'] = {};
    this.state.selectedStore!.items.forEach((item) => {
      if (item.isDestiny2() && item.equipped && item.bucket.inArmor) {
        lockedMap[item.bucket.hash] = [
          {
            type: 'item',
            item
          }
        ];
      }
    });

    this.computeSets({ lockedMap });
  };

  /**
   * Handle when selected character changes
   * Recomputes matched sets
   */
  onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, lockedMap: {} });
    this.computeSets({ classType: selectedStore.classType, lockedMap: {} });
  };

  /**
   * Adds an item to the locked map bucket
   * Recomputes matched sets
   */
  updateLockedArmor = (bucket: InventoryBucket, locked: LockedItemType[]) => {
    const lockedMap = this.state.lockedMap;
    lockedMap[bucket.hash] = locked;

    this.computeSets({ lockedMap });
  };

  /**
   * Handle then the required perks checkbox is toggled
   * Recomputes matched sets
   */
  setRequiredPerks = (element) => {
    this.setState({ requirePerks: element.target.checked });
    this.computeSets({ requirePerks: element.target.checked });
  };

  /**
   * Handle then the required perks checkbox is toggled
   * Recomputes matched sets
   */
  setRequiredBurn = (element) => {
    this.setState({ requireBurn: element.target.value });
    this.computeSets({ requireBurn: element.target.value });
  };

  render() {
    const { storesLoaded, stores, buckets } = this.props;
    const { processedSets, processRunning, lockedMap, selectedStore } = this.state;

    if (!storesLoaded) {
      return <Loading />;
    }

    let store = selectedStore;
    if (!store) {
      store = stores.find((s) => s.current)!;
    }

    if (!perks[store.classType]) {
      return <Loading />;
    }

    return (
      <div className="vendor d2-vendors dim-page">
        <h1>{t('LoadoutBuilder.Title')}</h1>
        <h3>{t('LoadoutBuilder.SelectCharacter')}</h3>
        <div className="flex">
          <CharacterDropdown
            selectedStore={store}
            stores={stores}
            onCharacterChanged={this.onCharacterChanged}
          />
          <div className="flex">
            {Object.values(LockableBuckets).map((armor) => (
              <LockedArmor
                key={armor}
                locked={lockedMap[armor]}
                bucket={buckets.byId[armor]}
                items={items[store!.classType][armor]}
                perks={perks[store!.classType][armor]}
                onLockChanged={this.updateLockedArmor}
              />
            ))}
          </div>
          <div className="flex column">
            <button className="dim-button" onClick={this.lockEquipped}>
              {t('LoadoutBuilder.LockEquipped')}
            </button>
            <button className="dim-button" onClick={this.resetLocked}>
              {t('LoadoutBuilder.ResetLocked')}
            </button>
          </div>
        </div>

        <h3>{t('LoadoutBuilder.Options')}</h3>
        <div>
          <p>
            <input
              id="required-perks"
              type="checkbox"
              checked={this.state.requirePerks}
              onChange={this.setRequiredPerks}
            />
            <label htmlFor="required-perks">{t('LoadoutBuilder.RequirePerks')}</label>
          </p>
          <p>
            <select id="required-burn" onChange={this.setRequiredBurn}>
              {Object.keys(burnTypes).map((burn) => (
                <option key={burn} value={burn}>
                  {t(`LoadoutBuilder.${burnTypes[burn]}`)}
                </option>
              ))}
            </select>
            <label htmlFor="required-burn">{t('LoadoutBuilder.RequireBurn')}</label>
          </p>
        </div>

        <GeneratedSets
          processRunning={processRunning}
          processedSets={processedSets}
          lockedMap={lockedMap}
          selectedStore={selectedStore}
          onLockChanged={this.updateLockedArmor}
        />
      </div>
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
