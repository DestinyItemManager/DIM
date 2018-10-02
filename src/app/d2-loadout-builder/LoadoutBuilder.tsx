import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs/Subscription';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import CharacterDropdown from '../character-select/CharacterDropdown';
import BungieImage from '../dim-ui/BungieImage';
import { Loading } from '../dim-ui/Loading';
import PressTip from '../dim-ui/PressTip';
import { D2StoresService } from '../inventory/d2-stores.service';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { D2Item, DimSocket } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import StoreInventoryItem from '../inventory/StoreInventoryItem';
import LoadoutDrawer from '../loadout/loadout-drawer';
import { dimLoadoutService, Loadout } from '../loadout/loadout.service';
import { RootState } from '../store/reducers';
import { sum } from '../util';
import './loadoutbuilder.scss';
import LockedArmor from './LockedArmor';

import { getKiosks } from '../bungie-api/destiny2-api';
import { fetchRatingsForKiosks } from '../d2-vendors/vendor-ratings';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { loadingTracker } from '../ngimport-more';

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
}

interface State {
  processRunning: number;
  requirePerks: boolean;
  loadout?: Loadout;
  lockedMap: { [bucketHash: number]: LockType };
  processedSets?: {};
  matchedSets?: ArmorSet[];
  setTiers: string[];
  selectedTier: string;
  selectedStore?: DimStore;
  trackerService?: DestinyTrackerService;
}

const perks: {
  [classType: number]: { [bucketHash: number]: any };
} = {};
const items: {
  [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
} = {};

let killProcess = false;

type ArmorTypes = 'Helmet' | 'Gauntlets' | 'Chest' | 'Leg' | 'ClassItem';
type StatTypes = 'STAT_MOBILITY' | 'STAT_RESILIENCE' | 'STAT_RECOVERY';
export interface LockType {
  type: 'item' | 'perk' | 'exclude';
  items: D2Item[];
}

interface ArmorSet {
  armor: D2Item[];
  power: number;
  stats: { [statType in StatTypes]: number };
  setHash: string;
  includesVendorItems: boolean;
}

interface SetType {
  set: ArmorSet;
  tiers: {
    [tierString: string]: {
      stats: ArmorSet['stats'];
      configs: { [armorType in ArmorTypes]: string };
    };
  };
}

// bucket lookup, also used for ordering of the buckets.
const lockableBuckets = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  leg: 20886954,
  classitem: 1585787867
};

function mapStateToProps(state: RootState): Partial<Props> {
  return {
    buckets: state.inventory.buckets!,
    storesLoaded: state.inventory.stores.length > 0,
    stores: state.inventory.stores
  };
}

function getActiveHighestSets(
  setMap: { [setHash: string]: SetType },
  activeSets: string
): ArmorSet[] {
  let count = 0;
  const matchedSets: ArmorSet[] = [];
  // TODO: this lookup by tier is expensive
  Object.values(setMap).forEach((setType) => {
    // limit to render just 10 sets, for now.
    if (count >= 10) {
      return;
    }
    if (setType.tiers[activeSets]) {
      matchedSets.push(setType.set);
      count += 1;
    }
  });
  return matchedSets.sort((a, b) => b.power - a.power);
}

function process(filteredItems: { [bucket: number]: D2Item[] }) {
  const pstart = performance.now();
  const helms = filteredItems[lockableBuckets.helmet] || [];
  const gaunts = filteredItems[lockableBuckets.gauntlets] || [];
  const chests = filteredItems[lockableBuckets.chest] || [];
  const legs = filteredItems[lockableBuckets.leg] || [];
  const classitems = filteredItems[lockableBuckets.classitem] || [];
  const setMap: { [setHash: number]: SetType } = {};
  const tiersSet = new Set<string>();
  const setTiers: string[] = [];
  const combos = helms.length * gaunts.length * chests.length * legs.length * classitems.length;

  if (combos === 0) {
    // why should this ever happen?
    return;
  }

  function calcArmorStats(pieces, stats) {
    let i = pieces.length;
    while (i--) {
      if (pieces[i].stats.length) {
        stats.STAT_MOBILITY += pieces[i].stats[0].base;
        stats.STAT_RESILIENCE += pieces[i].stats[1].base;
        stats.STAT_RECOVERY += pieces[i].stats[2].base;
      }
    }
  }

  function step(h = 0, g = 0, c = 0, l = 0, ci = 0, processedCount = 0) {
    for (; h < helms.length; ++h) {
      for (; g < gaunts.length; ++g) {
        for (; c < chests.length; ++c) {
          for (; l < legs.length; ++l) {
            for (; ci < classitems.length; ++ci) {
              const validSet =
                Number(helms[h].isExotic) +
                  Number(gaunts[g].isExotic) +
                  Number(chests[c].isExotic) +
                  Number(legs[l].isExotic) <
                2;

              if (validSet) {
                const set: ArmorSet = {
                  armor: [helms[h], gaunts[g], chests[c], legs[l], classitems[ci]],
                  power:
                    helms[h].basePower +
                    gaunts[g].basePower +
                    chests[c].basePower +
                    legs[l].basePower +
                    classitems[ci].basePower,
                  stats: {
                    STAT_MOBILITY: 0,
                    STAT_RESILIENCE: 0,
                    STAT_RECOVERY: 0
                  },
                  setHash:
                    helms[h].id + gaunts[g].id + chests[c].id + legs[l].id + classitems[ci].id,
                  includesVendorItems: false
                };

                calcArmorStats(set.armor, set.stats);
                const tiersString = `${set.stats.STAT_MOBILITY}/${set.stats.STAT_RESILIENCE}/${
                  set.stats.STAT_RECOVERY
                }`;

                tiersSet.add(tiersString);

                // Build a map of all sets but only keep one copy of armor
                // so we reduce memory usage
                if (setMap[set.setHash]) {
                  if (setMap[set.setHash].tiers[tiersString]) {
                    // setMap[set.setHash].tiers[tiersString].configs.push(getBonusConfig(set.armor));
                  } else {
                    setMap[set.setHash].tiers[tiersString] = {
                      stats: set.stats
                      // configs: [getBonusConfig(set.armor)]
                    };
                  }
                } else {
                  setMap[set.setHash] = { set, tiers: {} };
                  setMap[set.setHash].tiers[tiersString] = {
                    stats: set.stats
                    // configs: [getBonusConfig(set.armor)]
                  };
                }
                // set.includesVendorItems = pieces.some((armor: any) => armor.isVendorItem);
              }

              processedCount++;
              if (processedCount % 50000 === 0) {
                if (killProcess) {
                  this.setState({ processRunning: 0 });
                  killProcess = false;
                  return;
                }
                this.setState({ processRunning: Math.floor((processedCount / combos) * 100) });
                return window.requestAnimationFrame(() => {
                  step.call(this, h, g, c, l, ci, processedCount);
                });
              }
            }
            ci = 0;
          }
          l = 0;
        }
        c = 0;
      }
      g = 0;
    }

    const tiers = _.each(
      _.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
        return sum(tierString.split('/'), (num) => parseInt(num, 10));
      }),
      (tier) => {
        tier.sort().reverse();
      }
    );

    const tierKeys = Object.keys(tiers);
    for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
      if (tierKeys[t]) {
        setTiers.push(`- Tier ${tierKeys[t]} -`);
        tiers[tierKeys[t]].forEach((set) => {
          setTiers.push(set);
        });
      }
    }

    let selectedTier = this.state.selectedTier;
    if (!setTiers.includes(selectedTier)) {
      selectedTier = setTiers[1];
    }

    this.setState({
      setTiers,
      selectedTier,
      processedSets: setMap,
      matchedSets: getActiveHighestSets(setMap, selectedTier),
      processRunning: 0
    });
    console.log('processed', combos, 'combinations in', performance.now() - pstart);
  }

  return step.call(this);
}

/**
 * The Loadout Builder screen
 */
class LoadoutBuilder extends React.Component<Props & UIViewInjectedProps, State> {
  private storesSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      requirePerks: true,
      processRunning: 0,
      setTiers: [],
      selectedTier: '7/7/7', // what is the defacto "best", akin to 5/5/2?
      lockedMap: {}
    };
  }

  async loadCollections() {
    const defs = await getDefinitions();

    // not currently using this
    const profileResponse = await getKiosks(this.props.account);

    // not currently using this... or this...
    const trackerService = await fetchRatingsForKiosks(defs, profileResponse);
    this.setState({ trackerService });
  }

  componentDidMount() {
    loadingTracker.addPromise(this.loadCollections());

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
      }
    );
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  computeSets = (classType: number, lockedMap: {}, requirePerks: boolean) => {
    const allItems = { ...items[classType] };
    const filteredItems: { [bucket: number]: D2Item[] } = {};

    Object.keys(allItems).forEach((bucket) => {
      // if we are locking an item in that bucket, filter to only those items
      if (lockedMap[bucket] && lockedMap[bucket].type === 'item') {
        filteredItems[bucket] = lockedMap[bucket].items;
        return;
      }

      // otherwise flatten all item instances to each bucket
      filteredItems[bucket] = _.flatten(
        Object.values(allItems[bucket]).map((items: D2Item[]) => {
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

      // if there is nothing locked for that instance, just pick good items
    });

    // filter to only include items that are in the locked map
    Object.keys(lockedMap).forEach((bucket) => {
      // if there are locked items for this bucket
      if (lockedMap[bucket] && lockedMap[bucket].items.length) {
        // if the locked bucket is a perk
        if (lockedMap[bucket].type === 'perk') {
          // filter out items that do not have a locked perk
          filteredItems[bucket] = filteredItems[bucket].filter((item) =>
            item.sockets.sockets.find((slot) =>
              slot.plugOptions.find((perk) =>
                lockedMap[bucket].items.find((lockedPerk) => lockedPerk.hash === perk.plugItem.hash)
              )
            )
          );
        }
      }
    });

    // re-process all sets
    this.startNewProcess(filteredItems);
    this.setState({ lockedMap });
  };

  startNewProcess = (filteredItems: { [bucket: number]: D2Item[] }) => {
    if (this.state.processRunning !== 0) {
      killProcess = true;
      return window.requestAnimationFrame(() => this.startNewProcess(filteredItems));
    }

    process.call(this, filteredItems);
  };

  resetLocked = () => {
    this.setState({ lockedMap: {}, setTiers: [], matchedSets: undefined });
    this.computeSets(this.state.selectedStore!.classType, {}, this.state.requirePerks);
  };

  lockEquipped = () => {
    const lockedMap = {};
    this.state.selectedStore!.items.forEach((item) => {
      if (item.equipped && item.bucket.inArmor) {
        lockedMap[item.bucket.hash] = {
          type: 'item',
          items: [item]
        };
      }
    });

    this.computeSets(this.state.selectedStore!.classType, lockedMap, this.state.requirePerks);
  };

  onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, lockedMap: {}, setTiers: [], matchedSets: undefined });
    this.computeSets(selectedStore.classType, {}, this.state.requirePerks);
  };

  updateLockedArmor = (bucket: InventoryBucket, locked: LockType) => {
    const lockedMap = this.state.lockedMap;
    lockedMap[bucket.hash] = locked;

    this.computeSets(this.state.selectedStore!.classType, lockedMap, this.state.requirePerks);
  };

  setSelectedTier = (element) => {
    if (!this.state.processedSets) {
      return;
    }
    this.setState({
      selectedTier: element.target.value,
      matchedSets: getActiveHighestSets(this.state.processedSets, element.target.value)
    });
  };

  setRequiredPerks = (element) => {
    this.setState({ requirePerks: element.target.checked });
    this.computeSets(
      this.state.selectedStore!.classType,
      this.state.lockedMap,
      element.target.checked
    );
  };

  createLoadout(hash): Loadout {
    const set = this.state.processedSets![hash].set;
    return {
      platform: this.props.account.platformLabel, // Playstation or Xbox
      destinyVersion: this.props.account.destinyVersion, // D1 or D2
      items: {
        helmet: [set.armor[0]],
        gauntlets: [set.armor[1]],
        chest: [set.armor[2]],
        leg: [set.armor[3]],
        classitem: [set.armor[4]]
      },
      name: t('Loadouts.AppliedAuto'),
      classType: { warlock: 0, titan: 1, hunter: 2 }[this.state.selectedStore!.class]
    };
  }

  resetActiveLoadout = () => {
    this.setState({ loadout: undefined });
  };

  newLoadout = (element) => {
    this.setState({ loadout: this.createLoadout(element.target.value) });
  };

  equipItems = (element) => {
    const loadout: Loadout = this.createLoadout(element.target.value);

    _.each(loadout.items, (val) => {
      val[0].equipped = true;
    });

    return dimLoadoutService.applyLoadout(this.state.selectedStore!, loadout, true);
  };

  render() {
    const { storesLoaded, stores, buckets } = this.props;
    const { lockedMap, setTiers, selectedStore, processRunning } = this.state;

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
        <h1>Loadout Builder</h1>
        <h3>Select Character</h3>
        <div className="flex">
          <CharacterDropdown
            selectedStore={store}
            stores={stores}
            onCharacterChanged={this.onCharacterChanged}
          />
          <div className="flex">
            {Object.values(lockableBuckets).map((armor) => (
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
              Lock Equipped
            </button>
            <button className="dim-button" onClick={this.resetLocked}>
              Reset Locked
            </button>
          </div>
        </div>

        <h3>Options</h3>
        <div>
          <input
            id="required-perks"
            type="checkbox"
            checked={this.state.requirePerks}
            onChange={this.setRequiredPerks}
          />
          <label htmlFor="required-perks">Require additional perks on all amor</label>
        </div>

        {processRunning > 0 && <h3>Generating builds... {this.state.processRunning}%</h3>}
        {processRunning === 0 &&
          setTiers.length !== 0 && (
            <>
              <h3>Select Build Tier</h3>
              <select onChange={this.setSelectedTier}>
                {setTiers.map((tier) => (
                  <option key={tier} value={tier} disabled={tier.charAt(0) === '-'}>
                    {tier}
                  </option>
                ))}
              </select>
            </>
          )}
        {processRunning === 0 &&
          this.state.matchedSets && (
            <>
              <h3>
                {this.state.matchedSets.length === 0 && 'Found 0 '}
                Generated Builds
              </h3>
              {this.state.matchedSets.map((set) => (
                <div className="generated-build" key={set.setHash}>
                  <div className="generated-build-buttons">
                    <button className="dim-button" value={set.setHash} onClick={this.newLoadout}>
                      Create Loadout
                    </button>
                    <button
                      className="dim-button equip-button"
                      value={set.setHash}
                      onClick={this.equipItems}
                    >
                      Equip on {this.state.selectedStore!.name}
                    </button>
                  </div>
                  <div className="sub-bucket">
                    {Object.values(set.armor).map((item) => (
                      <div className="generated-build-items" key={item.index}>
                        <StoreInventoryItem item={item} isNew={false} searchHidden={false} />
                        {item!.sockets!.categories.length === 2 &&
                          item!.sockets!.categories[0].sockets.filter(filterPlugs).map((socket) => (
                            <PressTip
                              key={socket!.plug!.plugItem.hash}
                              tooltip={<PlugTooltip item={item} socket={socket} />}
                            >
                              <div>
                                <BungieImage
                                  className="item-mod"
                                  src={socket!.plug!.plugItem.displayProperties.icon}
                                />
                              </div>
                            </PressTip>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        <LoadoutDrawer loadout={this.state.loadout} onClose={this.resetActiveLoadout} />
      </div>
    );
  }
}

// Filter out plugs that we don't want to show in the perk dropdown.
function filterPlugs(socket) {
  if (socket.plug && ![3530997750, 2032054360, 1633794450].includes(socket.plug.plugItem.hash)) {
    if (
      socket.plug.plugItem.inventory.tierType !== 6 &&
      socket.plug.plugItem.plug.plugCategoryHash === 1744546145
    ) {
      return false;
    }
    return true;
  }
}

function PlugTooltip({ item, socket }: { item: D2Item; socket: DimSocket }) {
  const plug = socket.plug;
  if (!plug) {
    return null;
  }
  return (
    <>
      <h2>
        {plug.plugItem.displayProperties.name}
        {item.masterworkInfo &&
          plug.plugItem.investmentStats &&
          plug.plugItem.investmentStats[0] &&
          item.masterworkInfo.statHash === plug.plugItem.investmentStats[0].statTypeHash &&
          ` (${item.masterworkInfo.statName})`}
      </h2>

      {plug.plugItem.displayProperties.description ? (
        <div>{plug.plugItem.displayProperties.description}</div>
      ) : (
        plug.perks.map((perk) => (
          <div key={perk.hash}>
            {plug.plugItem.displayProperties.name !== perk.displayProperties.name && (
              <div>{perk.displayProperties.name}</div>
            )}
            <div>{perk.displayProperties.description}</div>
          </div>
        ))
      )}
    </>
  );
}

export default connect(mapStateToProps)(LoadoutBuilder);
