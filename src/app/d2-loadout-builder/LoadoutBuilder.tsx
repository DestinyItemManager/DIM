import { DestinyProfileResponse, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { t } from 'i18next';
import { $rootScope } from 'ngimport';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import BungieImage from '../dim-ui/BungieImage';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getKiosks } from '../bungie-api/destiny2-api';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service';
import './loadoutbuilder.scss';
import { fetchRatingsForKiosks } from '../d2-vendors/vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { Loadout, dimLoadoutService } from '../loadout/loadout.service';
import { DimStore } from '../inventory/store-types';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { D2StoresService } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { loadingTracker } from '../ngimport-more';
import { Loading } from '../dim-ui/Loading';
import CharacterDropdown from '../character-select/dropdown';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import StoreInventoryItem from '../inventory/StoreInventoryItem';
import { D2Item, DimSocket } from '../inventory/item-types';
import LockedArmor from './LockedArmor';
import PressTip from '../dim-ui/PressTip';
import LoadoutDrawer from '../loadout/loadout-drawer';

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
}

interface State {
  processRunning: number;
  loadout?: Loadout;
  lockedMap: {};
  processedSets?: {};
  matchedSets?: ArmorSet[];
  setTiers: string[];
  selectedTier: string;
  selectedStore?: DimStore;
  profileResponse?: DestinyProfileResponse;
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

interface ArmorSet {
  armor: D2Item[]; // { [armorType in ArmorTypes]: D2Item };
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

// bucket lookup, also used for ordering ofcate the buckets.
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
  return matchedSets;
}

function process(armor) {
  const pstart = performance.now();
  const helms = armor[lockableBuckets.helmet] || [];
  const gaunts = armor[lockableBuckets.gauntlets] || [];
  const chests = armor[lockableBuckets.chest] || [];
  const legs = armor[lockableBuckets.leg] || [];
  const classitems = armor[lockableBuckets.classitem] || [];
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
      // switch (armor.bonusType) {
      //   case 'int':
      //     stats.STAT_MOBILITY.value += mob.bonus;
      //     break;
      //   case 'dis':
      //     stats.STAT_RESILIENCE.value += res.bonus;
      //     break;
      //   case 'str':
      //     stats.STAT_RECOVERY.value += rec.bonus;
      //     break;
      // }
    }
  }

  // function getBonusConfig(armor: ArmorSet['armor']): { [armorType in ArmorTypes]: string } {
  //   return {
  //     Helmet: '', // armor.Helmet.bonusType,
  //     Gauntlets: '', // armor.Gauntlets.bonusType,
  //     Chest: '', // armor.Chest.bonusType,
  //     Leg: '', // armor.Leg.bonusType,
  //     ClassItem: '' // armor.ClassItem.bonusType
  //   };
  // }

  // vm.hasSets = false;
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

                // setMap[set.setHash] = {
                //   set,
                //   stats:
                // };

                // setMap[set.setHash] = set;
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
        return tierString.split('/').reduce((a, b) => a + parseInt(b, 10), 0);
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
  private $scope = $rootScope.$new(true);

  constructor(props: Props) {
    super(props);
    this.state = {
      processRunning: 0,
      setTiers: [],
      selectedTier: '7/7/7', // what is the defacto "best", akin to 5/5/2?
      lockedMap: {}
    };
  }

  async loadCollections() {
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    // not currently using this
    const profileResponse = await getKiosks(this.props.account);
    this.setState({ profileResponse });

    // not currently using this... or this...
    const trackerService = await fetchRatingsForKiosks(defs, profileResponse);
    this.setState({ trackerService });
  }

  componentDidMount() {
    loadingTracker.addPromise(this.loadCollections());

    // We need to make a scope
    this.$scope.$on('dim-refresh', () => {
      loadingTracker.addPromise(this.loadCollections());
    });

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
                perks[item.classType][item.bucket.hash].add(socket!.plug!.plugItem);
              });
          }
        }

        // sort exotic perks first
        Object.keys(perks).forEach((classType) =>
          Object.keys(perks[classType]).forEach(
            (bucket) =>
              (perks[classType][bucket] = [...perks[classType][bucket]].sort(
                (a, b) => b.inventory.tierType - a.inventory.tierType
              ))
          )
        );
      }
    );
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
    this.$scope.$destroy();
  }

  computeSets = (classType: number, lockedMap: {}) => {
    const allItems = { ...items[classType] };
    const filteredItems: { [bucket: number]: D2Item[] } = {};

    Object.keys(allItems).forEach((bucket) => {
      filteredItems[bucket] = _.flatten(
        Object.values(allItems[bucket]).map((items: D2Item[]) => {
          // if there is no locked item for that instance, just pick any
          if (!lockedMap[bucket]) {
            return items[0];
          }
          return items;
        })
      );
    });

    Object.keys(lockedMap).forEach((bucket) => {
      // if there are locked items for this bucket
      if (lockedMap[bucket].length) {
        // if the locked bucket is an item
        if (lockedMap[bucket][0].equipment) {
          filteredItems[bucket] = lockedMap[bucket];
        } else {
          // otherwise it is a list of perks (oh my... the complexity)
          filteredItems[bucket] = filteredItems[bucket].filter((item) => {
            // filter out items that do not have a locked perk
            return item.sockets.sockets.find((perk) => {
              return lockedMap[bucket].find((lockedPerk) => {
                return lockedPerk.hash === perk.plug.plugItem.hash;
              });
            });
          });
        }
      }
    });

    // re-process all sets
    this.startNewProcess(filteredItems);
    this.setState({ lockedMap });
  };

  startNewProcess = (filteredItems) => {
    if (this.state.processRunning !== 0) {
      killProcess = true;
      return window.requestAnimationFrame(() => this.startNewProcess(filteredItems));
    }

    process.call(this, filteredItems);
  };

  resetLocked = () => {
    this.setState({ lockedMap: {}, setTiers: [], matchedSets: undefined });
    this.computeSets(this.state.selectedStore!.classType, {});
  };

  lockEquipped = () => {
    const lockedMap = {};
    this.state.selectedStore!.items.forEach((item) => {
      if (item.equipped && item.bucket.inArmor) {
        lockedMap[item.bucket.hash] = [item];
      }
    });

    this.computeSets(this.state.selectedStore!.classType, lockedMap);
  };

  onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, lockedMap: {}, setTiers: [], matchedSets: undefined });
    this.computeSets(selectedStore.classType, {});
  };

  updateLockedArmor = (bucket: InventoryBucket, locked: D2Item[]) => {
    console.log('locked things updated!!');
    const lockedMap = this.state.lockedMap;
    lockedMap[bucket.hash] = locked;

    this.computeSets(this.state.selectedStore!.classType, lockedMap);
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

  createLoadout(element): Loadout {
    const set = this.state.processedSets![element.target.value].set;
    const loadout: Loadout = {
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

    return loadout;
  }

  resetActiveLoadout = () => {
    this.setState({ loadout: undefined });
  };

  newLoadout = (element) => {
    this.setState({ loadout: this.createLoadout(element) });
  };

  equipItems = (element) => {
    const loadout: Loadout = this.createLoadout(element);

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
      store = this.props.stores.find((s) => s.current)!;
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
            {Object.values(lockableBuckets).map((armor) => {
              return (
                <LockedArmor
                  key={armor}
                  locked={lockedMap[armor] || []}
                  bucket={buckets.byId[armor]}
                  items={items[store!.classType][armor]}
                  perks={perks[store!.classType][armor]}
                  onLockChanged={this.updateLockedArmor}
                />
              );
            })}
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

        {processRunning > 0 && <h3>Generating builds... {this.state.processRunning}%</h3>}

        {processRunning === 0 &&
          this.state.setTiers.length !== 0 && (
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
              <h3>Generated Builds</h3>
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
                    {Object.values(set.armor).map((item) => {
                      return (
                        <div className="generated-build-items" key={item.index}>
                          <StoreInventoryItem
                            item={item}
                            isNew={false}
                            // tag={getTag(item, itemInfos)}
                            // rating={dtrRating ? dtrRating.overallScore : undefined}
                            // hideRating={!showRating}
                            searchHidden={false}
                          />
                          {item!.sockets!.categories.length === 2 &&
                            item!
                              .sockets!.categories[0].sockets.filter(filterPlugs)
                              .map((socket) => (
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
                      );
                    })}
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

function filterPlugs(socket) {
  if (
    socket.plug &&
    ![3530997750, 2032054360, 1633794450, 702981643].includes(socket.plug.plugItem.hash)
  ) {
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
  return (
    <>
      <h2>
        {socket!.plug!.plugItem.displayProperties.name}
        {item.masterworkInfo &&
          socket!.plug!.plugItem.investmentStats &&
          socket!.plug!.plugItem.investmentStats[0] &&
          item.masterworkInfo.statHash === socket!.plug!.plugItem.investmentStats[0].statTypeHash &&
          ` (${item.masterworkInfo.statName})`}
      </h2>

      {socket!.plug!.plugItem.displayProperties.description ? (
        <div>{socket!.plug!.plugItem.displayProperties.description}</div>
      ) : (
        socket!.plug!.perks.map((perk) => (
          <div key={perk.hash}>
            {socket!.plug!.plugItem.displayProperties.name !== perk.displayProperties.name && (
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
