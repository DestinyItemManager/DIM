import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockableBuckets, LockedItemType, BurnItem, LockedMap, ItemsByBucket } from './types';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import PerksForBucket from './PerksForBucket';
import {
  removeLockedItem,
  lockedItemsEqual,
  addLockedItem,
  isLoadoutBuilderItem,
  filterPlugs
} from './generated-sets/utils';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import styles from './PerkPicker.m.scss';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { AppIcon, searchIcon } from 'app/shell/icons';
import copy from 'fast-copy';
import ArmorBucketIcon from './ArmorBucketIcon';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector } from 'app/inventory/reducer';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import { itemsForPlugSet } from 'app/collections/PresentationNodeRoot';
import { sortMods } from 'app/collections/Mods';
import { escapeRegExp } from 'app/search/search-filters';

const burns: BurnItem[] = [
  {
    dmg: 'arc',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeArc'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png'
    }
  },
  {
    dmg: 'solar',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeSolar'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png'
    }
  },
  {
    dmg: 'void',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeVoid'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/void.png'
    }
  }
];

interface ProvidedProps {
  items: ItemsByBucket;
  lockedMap: LockedMap;
  classType: DestinyClass;
  onPerksSelected(perks: LockedMap): void;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
  perks: Readonly<{
    [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
  }>;
  mods: Readonly<{
    [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
  }>;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  // Get a list of lockable perks by bucket.
  const perksSelector = createSelector(
    storesSelector,
    (_: RootState, props: ProvidedProps) => props.classType,
    (stores, classType) => {
      const perks: { [bucketHash: number]: DestinyInventoryItemDefinition[] } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (
            !item ||
            !item.isDestiny2() ||
            !item.sockets ||
            !isLoadoutBuilderItem(item) ||
            !(item.classType === DestinyClass.Unknown || item.classType === classType)
          ) {
            continue;
          }
          if (!perks[item.bucket.hash]) {
            perks[item.bucket.hash] = [];
          }
          // build the filtered unique perks item picker
          item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              perks[item.bucket.hash].push(option.plugItem);
            });
          });
        }
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((bucket) => {
        const bucketPerks = _.uniq<DestinyInventoryItemDefinition>(perks[bucket]);
        bucketPerks.sort((a, b) => b.index - a.index);
        bucketPerks.sort((a, b) => b.inventory.tierType - a.inventory.tierType);
        perks[bucket] = bucketPerks;
      });

      return perks;
    }
  );

  // Get a list of unlocked mods by bucket. TODO consolidate with SocketDetails
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedPlugsSelector = createSelector(
    profileResponseSelector,
    storesSelector,
    (state: RootState) => state.manifest.d2Manifest!,
    (_: RootState, props: ProvidedProps) => props.classType,
    (profileResponse, stores, defs, classType) => {
      const plugSets: { [bucketHash: number]: Set<number> } = {};
      if (!profileResponse) {
        return {};
      }

      // 1. loop through all items, build up a map of mod sockets by bucket
      for (const store of stores) {
        for (const item of store.items) {
          if (
            !item ||
            !item.isDestiny2() ||
            !item.sockets ||
            !isLoadoutBuilderItem(item) ||
            !(item.classType === DestinyClass.Unknown || item.classType === classType)
          ) {
            continue;
          }
          if (!plugSets[item.bucket.hash]) {
            plugSets[item.bucket.hash] = new Set<number>();
          }
          // build the filtered unique perks item picker
          item.sockets.sockets
            // TODO: more filtering for sure, get rid of cosmetics??
            .filter((s) => !s.isPerk)
            .forEach((socket) => {
              if (socket.socketDefinition.reusablePlugSetHash) {
                plugSets[item.bucket.hash].add(socket.socketDefinition.reusablePlugSetHash);
              } else if (socket.socketDefinition.randomizedPlugSetHash) {
                plugSets[item.bucket.hash].add(socket.socketDefinition.randomizedPlugSetHash);
              }
              // TODO: potentially also add inventory-based mods
            });
        }
      }

      // 2. for each unique socket (type?) get a list of unlocked mods
      return _.mapValues(plugSets, (sets) => {
        const unlockedPlugs = new Set<number>();
        for (const plugSetHash of sets) {
          const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
          for (const plugSetItem of plugSetItems) {
            if (plugSetItem.enabled) {
              unlockedPlugs.add(plugSetItem.plugItemHash);
            }
          }
        }
        return Array.from(unlockedPlugs)
          .map((i) => defs.InventoryItem.get(i))
          .sort(sortMods);
      });
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: state.inventory.buckets!,
    language: state.settings.language,
    perks: perksSelector(state, props),
    mods: unlockedPlugsSelector(state, props)
  });
}

interface State {
  query: string;
  height?: number;
  selectedPerks: LockedMap;
}

/**
 * A sheet that allows picking a perk.
 */
class PerkPicker extends React.Component<Props, State> {
  state: State = {
    query: '',
    selectedPerks: copy(this.props.lockedMap)
  };
  private itemContainer = React.createRef<HTMLDivElement>();
  private filterInput = React.createRef<SearchFilterInput>();

  componentDidMount() {
    if (this.itemContainer.current) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
    if (!this.props.isPhonePortrait && this.filterInput.current) {
      this.filterInput.current.focusFilterInput();
    }
  }

  componentDidUpdate() {
    if (this.itemContainer.current && !this.state.height) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
  }

  render() {
    const { perks, mods, buckets, items, language, onClose, isPhonePortrait } = this.props;
    const { query, height, selectedPerks } = this.state;

    const order = Object.values(LockableBuckets);

    // On iOS at least, focusing the keyboard pushes the content off the screen
    const autoFocus =
      !this.props.isPhonePortrait &&
      !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    const header = (
      <div>
        <h1>Choose a perk</h1>
        <div className="item-picker-search">
          <div className="search-filter" role="search">
            <AppIcon icon={searchIcon} />
            <input
              className="filter-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              autoFocus={autoFocus}
              placeholder="Search perk name and description"
              type="text"
              name="filter"
              value={query}
              onChange={(e) => this.setState({ query: e.currentTarget.value })}
            />
          </div>
        </div>
        <div className={styles.tabs}>
          {order.map((bucketId) => (
            <div
              key={bucketId}
              className={styles.tab}
              onClick={() => this.scrollToBucket(bucketId)}
            >
              <ArmorBucketIcon bucket={buckets.byHash[bucketId]} />
              {buckets.byHash[bucketId].name}
            </div>
          ))}
        </div>
      </div>
    );

    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');

    const queryFilteredPerks = query.length
      ? _.mapValues(perks, (bucketPerks) =>
          bucketPerks.filter(
            (perk) =>
              regexp.test(perk.displayProperties.name) ||
              regexp.test(perk.displayProperties.description)
          )
        )
      : perks;

    const queryFilteredMods = query.length
      ? _.mapValues(mods, (bucketMods) =>
          bucketMods.filter(
            (mod) =>
              regexp.test(mod.displayProperties.name) ||
              regexp.test(mod.displayProperties.description)
          )
        )
      : perks;

    const queryFilteredBurns = query.length
      ? burns.filter((burn) => regexp.test(burn.displayProperties.name))
      : burns;

    console.log({ queryFilteredMods, queryFilteredPerks });

    const footer = Object.values(selectedPerks).some((f) => Boolean(f && f.length))
      ? ({ onClose }) => (
          <div className={styles.footer}>
            <div>
              <button className={styles.submitButton} onClick={(e) => this.onSubmit(e, onClose)}>
                {!isPhonePortrait && '⏎ '}
                {t('LoadoutBuilder.SelectPerks')}
              </button>
            </div>
            <div className={styles.selectedPerks}>
              {order.map(
                (bucketHash) =>
                  selectedPerks[bucketHash] && (
                    <React.Fragment key={bucketHash}>
                      <ArmorBucketIcon
                        bucket={buckets.byHash[bucketHash]}
                        className={styles.armorIcon}
                      />
                      {selectedPerks[bucketHash]!.map((lockedItem) => (
                        <LockedItemIcon
                          key={
                            (lockedItem.type === 'mod' && lockedItem.mod.hash) ||
                            (lockedItem.type === 'perk' && lockedItem.perk.hash) ||
                            (lockedItem.type === 'burn' && lockedItem.burn.dmg) ||
                            'unknown'
                          }
                          lockedItem={lockedItem}
                          onClick={() => this.onPerkSelected(lockedItem, lockedItem.bucket)}
                        />
                      ))}
                    </React.Fragment>
                  )
              )}
              <GlobalHotkeys
                hotkeys={[
                  {
                    combo: 'enter',
                    description: t('LoadoutBuilder.SelectPerks'),
                    callback: (event) => {
                      this.onSubmit(event, onClose);
                    }
                  }
                ]}
              />
            </div>
          </div>
        )
      : undefined;

    return (
      <Sheet onClose={onClose} header={header} footer={footer} sheetClassName="item-picker">
        <div ref={this.itemContainer} style={{ height }}>
          {order.map(
            (bucketId) =>
              queryFilteredPerks[bucketId] &&
              queryFilteredPerks[bucketId].length > 0 && (
                <PerksForBucket
                  key={bucketId}
                  bucket={buckets.byHash[bucketId]}
                  mods={queryFilteredMods[bucketId]}
                  perks={queryFilteredPerks[bucketId]}
                  burns={bucketId !== 4023194814 ? queryFilteredBurns : []}
                  locked={selectedPerks[bucketId] || []}
                  items={items[bucketId]}
                  onPerkSelected={(perk) => this.onPerkSelected(perk, buckets.byHash[bucketId])}
                />
              )
          )}
        </div>
      </Sheet>
    );
  }

  private onPerkSelected = (item: LockedItemType, bucket: InventoryBucket) => {
    const { selectedPerks } = this.state;

    const perksForBucket = selectedPerks[bucket.hash];
    if (perksForBucket && perksForBucket.some((li) => lockedItemsEqual(li, item))) {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: removeLockedItem(item, selectedPerks[bucket.hash])
        }
      });
    } else {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: addLockedItem(item, selectedPerks[bucket.hash])
        }
      });
    }
  };

  private onSubmit = (e, onClose: () => void) => {
    e.preventDefault();
    this.props.onPerksSelected(this.state.selectedPerks);
    onClose();
  };

  private scrollToBucket = (bucketId) => {
    const elem = document.getElementById(`perk-bucket-${bucketId}`)!;
    elem.scrollIntoView();
  };
}

export default connect<StoreProps>(mapStateToProps)(PerkPicker);

function LockedItemIcon({ lockedItem, onClick }: { lockedItem: LockedItemType; onClick(e): void }) {
  switch (lockedItem.type) {
    case 'perk':
      return (
        <BungieImageAndAmmo
          onClick={onClick}
          className={styles.selectedPerk}
          hash={lockedItem.perk.hash}
          title={lockedItem.perk.displayProperties.name}
          src={lockedItem.perk.displayProperties.icon}
        />
      );
    case 'burn':
      return (
        <div
          className={styles.selectedPerk}
          title={lockedItem.burn.displayProperties.name}
          onClick={onClick}
        >
          <img src={lockedItem.burn.displayProperties.icon} />
        </div>
      );
  }

  return null;
}
