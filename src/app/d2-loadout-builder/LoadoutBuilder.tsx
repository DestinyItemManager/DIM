import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getKiosks } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service';
import './loadoutbuilder.scss';
import { fetchRatingsForKiosks } from '../d2-vendors/vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { DimStore } from '../inventory/store-types';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { D2StoresService } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { loadingTracker } from '../ngimport-more';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import CharacterDropdown from '../character-select/dropdown';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import StoreInventoryItem from '../inventory/StoreInventoryItem';
import { D2Item } from '../inventory/item-types';
import LockedArmor from './LockedArmor';
import { sum } from '../util';

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
}

interface State {
  lockedMap: {};
  processedSets?: {};
  matchedSets?: ArmorSet[];
  setTiers: string[];
  selectedTier: string;
  showingItems: boolean;
  selectedStore?: DimStore;
  selectedBucketId?: string;
  defs?: D2ManifestDefinitions;
  profileResponse?: DestinyProfileResponse;
  trackerService?: DestinyTrackerService;
  stores?: DimStore[];
  perks: {};
  items: {};
}

type ArmorTypes = 'Helmet' | 'Gauntlets' | 'Chest' | 'Leg' | 'ClassItem';
type StatTypes = 'STAT_MOBILITY' | 'STAT_RESILIENCE' | 'STAT_RECOVERY';

interface ArmorSet {
  armor: { [armorType in ArmorTypes]: D2Item };
  stats: {
    [statType in StatTypes]: {
      value: number;
      tier: 0 | 1 | 2 | 3 | 4 | 5;
      name: string;
    }
  };
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

// bucket enum, also used for ordering ofcate the buckets.
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

function addPerks(perkHashes: Set<number>, item: D2Item) {
  if (!item || !item.sockets || !item.sockets.categories) {
    return;
  }

  // TODO: better filter for socket category so it works for class items.
  item.sockets.categories[0].sockets.forEach((socket) => {
    // TODO: filter out some perks
    if (socket.plug) {
      perkHashes.add(socket.plug.plugItem.hash);
    }
  });
}

function getActiveHighestSets(
  setMap: { [setHash: number]: SetType },
  activeSets: string
): ArmorSet[] {
  let count = 0;
  const matchedSets: ArmorSet[] = [];
  Object.values(setMap).forEach((setType) => {
    // limit to just 10 sets, for now.
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

function processdatshizz(armor) {
  const pstart = performance.now();
  const helms = armor[lockableBuckets.helmet] || [];
  const gaunts = armor[lockableBuckets.gauntlets] || [];
  const chests = armor[lockableBuckets.chest] || [];
  const legs = armor[lockableBuckets.leg] || [];
  const classItems = armor[lockableBuckets.classitem] || [];
  const setMap: { [setHash: number]: SetType } = {};
  const tiersSet = new Set<string>();
  const setTiers: string[] = [];
  const combos = helms.length * gaunts.length * chests.length * legs.length * classItems.length;

  if (combos === 0) {
    return null;
  }

  function genSetHash(armorPieces) {
    let hash = '';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < armorPieces.length; i++) {
      hash += armorPieces[i].id;
    }
    return hash;
  }

  function calcArmorStats(pieces, stats) {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < pieces.length; i++) {
      const armor = pieces[i];
      if (!armor.stats.length) {
        return;
      }
      const [mob, res, rec] = armor.stats;
      stats.STAT_MOBILITY.value += mob.base;
      stats.STAT_RESILIENCE.value += res.base;
      stats.STAT_RECOVERY.value += rec.base;
      switch (armor.bonusType) {
        case 'int':
          stats.STAT_MOBILITY.value += mob.bonus;
          break;
        case 'dis':
          stats.STAT_RESILIENCE.value += res.bonus;
          break;
        case 'str':
          stats.STAT_RECOVERY.value += rec.bonus;
          break;
      }
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
  const that = this;
  function step(h = 0, g = 0, c = 0, l = 0, ci = 0, processedCount = 0) {
    for (; h < helms.length; ++h) {
      for (; g < gaunts.length; ++g) {
        for (; c < chests.length; ++c) {
          for (; l < legs.length; ++l) {
            for (; ci < classItems.length; ++ci) {
              const validSet =
                Number(helms[h].isExotic) +
                  Number(gaunts[g].isExotic) +
                  Number(chests[c].isExotic) +
                  Number(legs[l].isExotic) <
                2;

              if (validSet) {
                const set: ArmorSet = {
                  armor: {
                    Helmet: helms[h],
                    Gauntlets: gaunts[g],
                    Chest: chests[c],
                    Leg: legs[l],
                    ClassItem: classItems[ci]
                  },
                  stats: {
                    STAT_MOBILITY: {
                      value: 0,
                      tier: 0,
                      name: 'Mobility'
                      // icon: intellectIcon
                    },
                    STAT_RESILIENCE: {
                      value: 0,
                      tier: 0,
                      name: 'Resilience'
                      // icon: disciplineIcon
                    },
                    STAT_RECOVERY: {
                      value: 0,
                      tier: 0,
                      name: 'Recovery'
                      // icon: strengthIcon
                    }
                  },
                  setHash: '',
                  includesVendorItems: false
                };

                // vm.hasSets = true;
                const pieces = Object.values(set.armor);
                set.setHash = genSetHash(pieces);
                calcArmorStats(pieces, set.stats);
                const tiersString = `${set.stats.STAT_MOBILITY.value}/${
                  set.stats.STAT_RESILIENCE.value
                }/${set.stats.STAT_RECOVERY.value}`;

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
                // do this so the page doesn't lock up
                // if (
                //   vm.active !== activeGuardian ||
                //   vm.lockedchanged ||
                //   vm.excludedchanged ||
                //   vm.perkschanged ||
                //   !vm.transition.router.stateService.is('destiny1.loadout-builder')
                // ) {
                //   // If active guardian or page is changed then stop processing combinations
                //   vm.lockedchanged = false;
                //   vm.excludedchanged = false;
                //   vm.perkschanged = false;
                //   return;
                // }
                // vm.progress = processedCount / combos;
                setTimeout(step, h, g, c, l, ci, processedCount);
                return;
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

    // console.log(tiers);

    const tierKeys = Object.keys(tiers);
    for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
      if (tierKeys[t]) {
        setTiers.push(`- Tier ${tierKeys[t]} -`);
        tiers[tierKeys[t]].forEach((set) => {
          setTiers.push(set);
        });
      }
    }
    that.setState({ setTiers });

    // // Finish progress
    // vm.progress = processedCount / combos;
    console.log(
      'processed',
      combos,
      'combinations in',
      (performance.now() - pstart) / 1000,
      'seconds.'
    );
  }

  step();

  return setMap;
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
      setTiers: [],
      selectedTier: '7/7/7', // what is the defacto "best", akin to 5/5/2?
      showingItems: false,
      perks: {},
      items: {},
      lockedMap: {}
    };
  }

  async loadCollections() {
    // TODO: don't really have to serialize these...

    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    const profileResponse = await getKiosks(this.props.account);
    this.setState({ profileResponse, defs });

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
        if (stores) {
          this.setState({ selectedStore: stores.find((s) => s.current) });
          for (const store of stores) {
            for (const item of store.items) {
              if (!item.bucket.inArmor || !['Exotic', 'Legendary'].includes(item.tier)) {
                continue;
              }
              if (!this.state.perks[item.classType]) {
                this.state.perks[item.classType] = {};
                this.state.items[item.classType] = {};
              }
              if (!this.state.perks[item.classType][item.bucket.hash]) {
                this.state.perks[item.classType][item.bucket.hash] = new Set<number>();
                this.state.items[item.classType][item.bucket.hash] = [];
              }
              this.state.items[item.classType][item.bucket.hash].push(item);
              addPerks(this.state.perks[item.classType][item.bucket.hash], item);
            }
          }
        }
      }
    );
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
    this.$scope.$destroy();
  }

  onCharacterChanged = (storeId: string) => {
    this.setState({ lockedMap: {} });

    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore });
  };

  toggleShowingItems = () => {
    this.setState({ showingItems: !this.state.showingItems });
  };

  handleBucketChange = (element) => {
    this.setState({ selectedBucketId: element.target.value });
  };

  setSelectedTier = (element) => {
    if (!this.state.processedSets) {
      return;
    }
    this.setState({ selectedTier: element.target.value });
    const matchedSets = getActiveHighestSets(this.state.processedSets, element.target.value);
    this.setState({ matchedSets });
  };

  updateLockedArmor = (bucket: InventoryBucket, locked: D2Item[]) => {
    console.log('locked things updated!!');
    const lockedMap = this.state.lockedMap;
    lockedMap[bucket.hash] = locked;

    const filteredItems = { ...this.state.items[this.state.selectedStore!.classType] };
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
    const processedSets = processdatshizz.call(this, filteredItems);
    // const processedSets = procesed.setMap;
    // const setTiers = procesed.setTiers;
    // const { processedSets, setTiers } = procesed;
    const setTiers = this.state.setTiers;
    let selectedTier = this.state.selectedTier;
    if (!setTiers.includes(selectedTier)) {
      selectedTier = setTiers[1];
    }

    // get the sets to render for the selected tier
    const matchedSets = getActiveHighestSets(processedSets, selectedTier);

    // finally... lets update that state... whew....
    this.setState({ lockedMap, setTiers, selectedTier, processedSets, matchedSets });
  };

  render() {
    const { storesLoaded, stores, buckets } = this.props;
    const { lockedMap, setTiers, selectedStore, selectedBucketId, showingItems, defs } = this.state;

    if (!storesLoaded) {
      return <Loading />;
    }

    let store = selectedStore;
    if (!store) {
      store = this.props.stores.find((s) => s.current)!;
    }

    const selectedBucket = selectedBucketId
      ? buckets.byId[selectedBucketId]
      : buckets.byType.Helmet;

    if (!this.state.perks[store.classType]) {
      return <Loading />;
    }

    const perks = this.state.perks[store.classType];
    // const vault = stores.find((s) => s.isVault) as DimVault;

    const items = this.state.items[store.classType][selectedBucket.hash];

    return (
      <div className="vendor d2-vendors dim-page">
        <h1>Loadout Builder</h1>
        <h3>Select Character</h3>
        <CharacterDropdown
          selectedStore={store}
          stores={stores}
          onCharacterChanged={this.onCharacterChanged}
        />
        <h3>
          <button onClick={this.toggleShowingItems}>{showingItems ? 'Hide' : 'Show'} items</button>
        </h3>
        {showingItems && (
          <div>
            <SelectBucket
              {...{
                defs,
                lockableBuckets: Object.values(lockableBuckets),
                handleBucketChange: this.handleBucketChange
              }}
            />
            <div className="sub-bucket">
              {items.map((item) => {
                return (
                  <StoreInventoryItem
                    key={item.index}
                    item={item}
                    isNew={false}
                    // tag={getTag(item, itemInfos)}
                    // rating={dtrRating ? dtrRating.overallScore : undefined}
                    // hideRating={!showRating}
                    searchHidden={false}
                  />
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="locked-equipment">
            {Object.values(lockableBuckets).map((armor) => {
              return (
                <LockedArmor
                  key={armor}
                  defs={defs!}
                  locked={lockedMap[armor] || []}
                  bucket={buckets.byId[armor]}
                  perks={perks[armor]}
                  onLockChanged={this.updateLockedArmor}
                />
              );
            })}
          </div>
        </div>
        {this.state.setTiers.length !== 0 && (
          <select onChange={this.setSelectedTier}>
            {setTiers.map((tier) => (
              <option key={tier} value={tier} disabled={tier.charAt(0) === '-'}>
                {tier}
              </option>
            ))}
          </select>
        )}
        {this.state.matchedSets &&
          this.state.matchedSets.map((set) => {
            // return <span key={set.setHash}>{set.setHash}</span>;
            return (
              <div key={set.setHash} className="sub-bucket">
                {Object.values(set.armor).map((item) => {
                  return (
                    <StoreInventoryItem
                      key={item.index}
                      item={item}
                      isNew={false}
                      // tag={getTag(item, itemInfos)}
                      // rating={dtrRating ? dtrRating.overallScore : undefined}
                      // hideRating={!showRating}
                      searchHidden={false}
                    />
                  );
                })}
              </div>
            );
          })}
      </div>
    );
  }
}

const SelectBucket = (props) => {
  const bucketDef = props.defs.InventoryBucket;

  return (
    <select onChange={props.handleBucketChange}>
      {props.lockableBuckets.map((armor) => {
        return (
          <option key={armor} value={armor}>
            {bucketDef[armor].displayProperties.name}
          </option>
        );
      })}
    </select>
  );
};

export default connect(mapStateToProps)(LoadoutBuilder);
