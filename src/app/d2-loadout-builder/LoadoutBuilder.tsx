import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account.service';
import CharacterSelect from '../character-select/CharacterSelect';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { Loading } from '../dim-ui/Loading';
import { D2StoresService } from '../inventory/d2-stores.service';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { D2Item } from '../inventory/item-types';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterPlugs, toggleLockedItem, filterGeneratedSets } from './generated-sets/utils';
import './loadoutbuilder.scss';
import LockedArmor from './locked-armor/LockedArmor';
import { ArmorSet, LockableBuckets, LockedItemType, StatTypes, MinMax } from './types';
import PerkAutoComplete from './PerkAutoComplete';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/reducer';
import { Subscription } from 'rxjs';
import process from './process';
import { createSelector } from 'reselect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './generated-sets/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  perks: {
    [classType: number]: { [bucketHash: number]: DestinyInventoryItemDefinition[] };
  };
  items: {
    [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
  };
  defs?: D2ManifestDefinitions;
}

type Props = ProvidedProps & StoreProps;

interface State {
  processError?: Error;
  requirePerks: boolean;
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  selectedPerks: Set<number>;
  filteredPerks: { [bucketHash: number]: Set<DestinyInventoryItemDefinition> };
  processedSets: ArmorSet[];
  selectedStore?: DimStore;
  statFilters: { [statType in StatTypes]: MinMax };
  minimumPower: number;
}

function mapStateToProps() {
  const perksSelector = createSelector(
    storesSelector,
    (stores) => {
      const perks: {
        [classType: number]: { [bucketHash: number]: DestinyInventoryItemDefinition[] };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!perks[item.classType]) {
            perks[item.classType] = {};
          }
          if (!perks[item.classType][item.bucket.hash]) {
            perks[item.classType][item.bucket.hash] = [];
          }

          // build the filtered unique perks item picker
          item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              perks[item.classType][item.bucket.hash].push(option.plugItem);
            });
          });
        }
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((classType) =>
        Object.keys(perks[classType]).forEach((bucket) => {
          const bucketPerks = _.uniq<DestinyInventoryItemDefinition>(perks[classType][bucket]);
          bucketPerks.sort((a, b) => b.index - a.index);
          bucketPerks.sort((a, b) => b.inventory.tierType - a.inventory.tierType);
          perks[classType][bucket] = bucketPerks;
        })
      );

      return perks;
    }
  );

  const itemsSelector = createSelector(
    storesSelector,
    (stores) => {
      const items: {
        [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!items[item.classType]) {
            items[item.classType] = {};
          }
          if (!items[item.classType][item.bucket.hash]) {
            items[item.classType][item.bucket.hash] = [];
          }
          if (!items[item.classType][item.bucket.hash][item.hash]) {
            items[item.classType][item.bucket.hash][item.hash] = [];
          }
          items[item.classType][item.bucket.hash][item.hash].push(item);
        }
      }

      return items;
    }
  );

  return (state: RootState): StoreProps => {
    return {
      buckets: state.inventory.buckets!,
      storesLoaded: storesLoadedSelector(state),
      stores: sortedStoresSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait,
      perks: perksSelector(state),
      items: itemsSelector(state),
      defs: state.manifest.d2Manifest
    };
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
      lockedMap: {},
      selectedPerks: new Set<number>(),
      filteredPerks: {},
      processedSets: [],
      statFilters: {
        Mobility: { min: 0, max: 10 },
        Resilience: { min: 0, max: 10 },
        Recovery: { min: 0, max: 10 }
      },
      minimumPower: 0
    };
  }

  componentDidMount() {
    this.storesSubscription = D2StoresService.getStoresStream(this.props.account).subscribe(
      (stores) => {
        if (!stores) {
          return;
        }

        this.setState({ selectedStore: stores.find((s) => s.current) });

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

  render() {
    const { storesLoaded, stores, buckets, isPhonePortrait, perks, items, defs } = this.props;
    const {
      processedSets,
      processError,
      lockedMap,
      selectedPerks,
      selectedStore,
      statFilters,
      minimumPower
    } = this.state;

    if (!storesLoaded || !defs) {
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
      <PageWithMenu className="loadout-builder">
        <PageWithMenu.Menu>
          <CharacterSelect
            selectedStore={store}
            stores={stores}
            vertical={!isPhonePortrait}
            isPhonePortrait={isPhonePortrait}
            onCharacterChanged={this.onCharacterChanged}
          />

          <CollapsibleTitle
            title={t('LoadoutBuilder.SelectLockedItems')}
            sectionId="loadoutbuilder-locked"
          >
            <div className="loadout-builder-row mr4 flex space-between">
              <div className="locked-items">
                {Object.values(LockableBuckets).map((armor) => (
                  <LockedArmor
                    key={armor}
                    locked={lockedMap[armor]}
                    bucket={buckets.byId[armor]}
                    items={items[store!.classType][armor]}
                    perks={perks[store!.classType][armor]}
                    filteredPerks={this.state.filteredPerks}
                    onLockChanged={this.updateLockedArmor}
                  />
                ))}
              </div>
              <div className="flex column mb4">
                <button className="dim-button" onClick={this.lockEquipped}>
                  {t('LoadoutBuilder.LockEquipped')}
                </button>
                <button className="dim-button" onClick={this.resetLocked}>
                  {t('LoadoutBuilder.ResetLocked')}
                </button>
                <PerkAutoComplete
                  perks={perks[store.classType]}
                  selectedPerks={selectedPerks}
                  bucketsById={buckets.byId}
                  onSelect={(bucket, item) =>
                    toggleLockedItem(
                      { type: 'perk', item },
                      bucket,
                      this.updateLockedArmor,
                      this.state.lockedMap[bucket.hash]
                    )
                  }
                />
              </div>
            </div>
          </CollapsibleTitle>

          <FilterBuilds
            sets={processedSets}
            selectedStore={store as D2Store}
            minimumPower={minimumPower}
            stats={statFilters}
            onMinimumPowerChanged={this.onMinimumPowerChanged}
            onStatFiltersChanged={this.onStatFiltersChanged}
            defs={defs}
          />
        </PageWithMenu.Menu>

        <PageWithMenu.Contents>
          {processError ? (
            <div className="dim-error">
              <h2>{t('ErrorBoundary.Title')}</h2>
              <div>{processError.message}</div>
            </div>
          ) : processedSets.length === 0 && this.state.requirePerks ? (
            <>
              <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>
              <button className="dim-button" onClick={this.setRequiredPerks}>
                {t('LoadoutBuilder.RequirePerks')}
              </button>
            </>
          ) : (
            <GeneratedSets
              sets={filterGeneratedSets(processedSets, minimumPower, lockedMap, statFilters)}
              lockedMap={lockedMap}
              selectedStore={store}
              onLockChanged={this.updateLockedArmor}
              defs={defs}
            />
          )}
        </PageWithMenu.Contents>

        <LoadoutDrawer />
      </PageWithMenu>
    );
  }

  /**
   * This function should be fired any time that a configuration option changes
   *
   * The work done in this function is to filter down items to process based on what is locked
   */
  private computeSets = ({
    classType = this.state.selectedStore!.classType,
    requirePerks = this.state.requirePerks,
    lockedMap = this.state.lockedMap
  }: {
    classType?: number;
    requirePerks?: boolean;
    lockedMap?: { [bucketHash: number]: LockedItemType[] };
  }) => {
    const allItems = { ...this.props.items[classType] };
    const filteredItems: { [bucket: number]: D2Item[] } = {};

    Object.keys(allItems).forEach((bucketStr) => {
      const bucket = parseInt(bucketStr, 10);

      // if we are locking an item in that bucket, filter to only include that single item
      if (lockedMap[bucket] && lockedMap[bucket][0].type === 'item') {
        filteredItems[bucket] = [lockedMap[bucket][0].item as D2Item];
        return;
      }

      // otherwise flatten all item instances to each bucket
      filteredItems[bucket] = _.flatten(
        Object.values(allItems[bucket]).map((items) => {
          // if nothing is locked in the current bucket
          if (!lockedMap[bucket]) {
            // pick the item instance with the highest power
            return items.reduce((a, b) => (a.basePower > b.basePower ? a : b));
          }
          // otherwise, return all item instances (and then filter down later by perks)
          return items;
        })
      );

      // filter out items without extra perks on them
      if (requirePerks) {
        filteredItems[bucket] = filteredItems[bucket].filter((item) => {
          return ['Exotic', 'Legendary'].includes(item.tier);
        });
        filteredItems[bucket] = filteredItems[bucket].filter((item) => {
          if (
            item &&
            item.sockets &&
            item.sockets.categories &&
            item.sockets.categories.length === 2
          ) {
            return (
              item.sockets.sockets
                .filter(filterPlugs)
                // this will exclude the deprecated pre-forsaken mods
                .filter(
                  (socket) =>
                    socket.plug && !socket.plug.plugItem.itemCategoryHashes.includes(4104513227)
                ).length
            );
          }
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
          // filter out items that don't match the burn type
          if (lockedItem.type === 'burn') {
            filteredItems[bucket] = filteredItems[bucket].filter((item) =>
              lockedMap[bucket].find((burnItem) => burnItem.item.index === item.dmg)
            );
          }
        });
        // filter out items that do not match ALL perks
        filteredItems[bucket] = filteredItems[bucket].filter((item) => {
          return lockedMap[bucket]
            .filter((item) => item.type === 'perk')
            .every((perk) => {
              return Boolean(
                item.sockets &&
                  item.sockets.sockets.find((slot) =>
                    Boolean(
                      slot.plugOptions.find((plug) =>
                        Boolean(perk.item.index === plug.plugItem.index)
                      )
                    )
                  )
              );
            });
        });
      }
    });

    // re-process all sets
    try {
      const processedSets = process(filteredItems);
      this.setState({ lockedMap, processedSets, minimumPower: 0 });
    } catch (e) {
      console.error(e);
      this.setState({ processError: e, minimumPower: 0 });
    }
  };

  /**
   * Reset all locked items and recompute for all sets
   * Recomputes matched sets
   */
  private resetLocked = () => {
    this.setState({ lockedMap: {}, selectedPerks: new Set<number>(), filteredPerks: {} });
    this.computeSets({ lockedMap: {} });
  };

  /**
   * Recomputes matched sets and includes items without additional perks
   */
  setRequiredPerks = () => {
    this.setState({ requirePerks: false });
    this.computeSets({ requirePerks: false });
  };

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  private lockEquipped = () => {
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
  private onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, lockedMap: {}, requirePerks: true });
    this.computeSets({ classType: selectedStore.classType, lockedMap: {}, requirePerks: true });
  };

  private onStatFiltersChanged = (statFilters: State['statFilters']) =>
    this.setState({ statFilters });

  private onMinimumPowerChanged = (minimumPower: number) => this.setState({ minimumPower });

  /**
   * Adds an item to the locked map bucket
   * Recomputes matched sets
   */
  private updateLockedArmor = (bucket: InventoryBucket, locked: LockedItemType[]) => {
    const lockedMap = this.state.lockedMap;
    lockedMap[bucket.hash] = locked;

    // filter down perks to only what is selectable
    const storeClass = this.state.selectedStore!.classType;
    const filteredPerks: { [bucketHash: number]: Set<DestinyInventoryItemDefinition> } = {};

    // loop all buckets
    Object.keys(this.props.items[storeClass]).forEach((bucket) => {
      if (!lockedMap[bucket]) {
        return;
      }
      filteredPerks[bucket] = new Set<DestinyInventoryItemDefinition>();
      const lockedPlugs = lockedMap[bucket].filter(
        (locked: LockedItemType) => locked.type === 'perk'
      );

      // save a flat copy of all selected perks
      lockedPlugs.forEach((lockedItem) => {
        this.state.selectedPerks.add((lockedItem.item as DestinyInventoryItemDefinition).index);
      });
      // loop all items by hash
      Object.keys(this.props.items[storeClass][bucket]).forEach((itemHash) => {
        const itemInstances = this.props.items[storeClass][bucket][itemHash];

        // loop all items by instance
        itemInstances.forEach((item) => {
          // flat list of plugs per item
          const itemPlugs: DestinyInventoryItemDefinition[] = [];
          item.sockets &&
            item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
              socket.plugOptions.forEach((option) => {
                itemPlugs.push(option.plugItem);
              });
            });
          // for each item, look to see if all perks match locked
          const matched = lockedPlugs.every((locked: LockedItemType) =>
            itemPlugs.find((plug) => plug.index === locked.item.index)
          );
          if (item.sockets && matched) {
            itemPlugs.forEach((plug) => {
              filteredPerks[bucket].add(plug);
            });
          }
        });
      });
    });

    this.setState({ filteredPerks });
    this.computeSets({ lockedMap });
  };
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
