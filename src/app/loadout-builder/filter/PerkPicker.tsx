import React, { Dispatch } from 'react';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import {
  LockableBuckets,
  LockedItemType,
  BurnItem,
  LockedMap,
  ItemsByBucket,
  LockedModBase,
} from '../types';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import PerksForBucket from './PerksForBucket';
import {
  removeLockedItem,
  lockedItemsEqual,
  addLockedItem,
  isLoadoutBuilderItem,
  filterPlugs,
} from '../utils';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import styles from './PerkPicker.m.scss';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { AppIcon, searchIcon } from 'app/shell/icons';
import copy from 'fast-copy';
import ArmorBucketIcon from '../ArmorBucketIcon';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector, bucketsSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import { escapeRegExp } from 'app/search/search-filter';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { SocketDetailsMod, plugIsInsertable } from 'app/item-popup/SocketDetails';
import { settingsSelector } from 'app/settings/reducer';
import { getSpecialtySocketMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import SeasonalModPicker from './SeasonalModPicker';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { SearchFilterRef } from 'app/search/SearchFilterInput';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

const burns: BurnItem[] = [
  {
    dmg: 'arc',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeArc'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/arc.png',
    },
  },
  {
    dmg: 'solar',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeSolar'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/thermal.png',
    },
  },
  {
    dmg: 'void',
    displayProperties: {
      name: t('LoadoutBuilder.BurnTypeVoid'),
      icon: 'https://www.bungie.net/img/destiny_content/damage_types/destiny2/void.png',
    },
  },
];

interface ProvidedProps {
  items: ItemsByBucket;
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  classType: DestinyClass;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  perks: Readonly<{
    [bucketHash: number]: readonly PluggableInventoryItemDefinition[];
  }>;
  mods: Readonly<{
    [bucketHash: number]: readonly {
      item: PluggableInventoryItemDefinition;
      // plugSet this mod appears in
      plugSetHash: number;
    }[];
  }>;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  // Get a list of lockable perks by bucket.
  const perksSelector = createSelector(
    storesSelector,
    (_: RootState, props: ProvidedProps) => props.classType,
    (stores, classType) => {
      const perks: { [bucketHash: number]: PluggableInventoryItemDefinition[] } = {};
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
          item.sockets.allSockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              perks[item.bucket.hash].push(option.plugDef);
            });
          });
        }
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((bucket) => {
        const bucketPerks = _.uniq<PluggableInventoryItemDefinition>(perks[bucket]);
        bucketPerks.sort((a, b) => b.index - a.index);
        bucketPerks.sort((a, b) => b.inventory!.tierType - a.inventory!.tierType);
        perks[bucket] = bucketPerks;
      });

      return perks;
    }
  );

  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedPlugsSelector = createSelector(
    profileResponseSelector,
    storesSelector,
    (state: RootState) => state.manifest.d2Manifest!,
    (_: RootState, props: ProvidedProps) => props.classType,
    (profileResponse, stores, defs, classType): StoreProps['mods'] => {
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
          item.sockets.allSockets
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
        const unlockedPlugs: { [itemHash: number]: number } = {};
        for (const plugSetHash of sets) {
          const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
          for (const plugSetItem of plugSetItems) {
            if (plugIsInsertable(plugSetItem)) {
              unlockedPlugs[plugSetItem.plugItemHash] = plugSetHash;
            }
          }
        }
        return Object.entries(unlockedPlugs)
          .map(([i, plugSetHash]) => ({
            item: defs.InventoryItem.get(parseInt(i, 10)) as PluggableInventoryItemDefinition,
            plugSetHash,
          }))
          .filter(
            (i) =>
              i.item.inventory!.tierType !== TierType.Common &&
              !i.item.itemCategoryHashes?.includes(ItemCategoryHashes.Mods_Ornament) &&
              i.item.plug.insertionMaterialRequirementHash !== 0 // not the empty mod sockets
          )
          .sort((a, b) => sortMods(a.item, b.item));
      });
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: bucketsSelector(state)!,
    language: settingsSelector(state).language,
    perks: perksSelector(state, props),
    mods: (!$featureFlags.armor2ModPicker && unlockedPlugsSelector(state, props)) || [],
    defs: state.manifest.d2Manifest!,
  });
}

interface State {
  query: string;
  height?: number;
  selectedPerks: LockedMap;
  selectedSeasonalMods: LockedModBase[];
}

/**
 * A sheet that allows picking a perk.
 */
class PerkPicker extends React.Component<Props, State> {
  state: State = {
    query: '',
    selectedPerks: copy(this.props.lockedMap),
    selectedSeasonalMods: copy(this.props.lockedSeasonalMods),
  };
  private itemContainer = React.createRef<HTMLDivElement>();
  private filterInput = React.createRef<SearchFilterRef>();

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
    const { defs, perks, mods, buckets, items, language, onClose, isPhonePortrait } = this.props;
    const { query, height, selectedPerks, selectedSeasonalMods } = this.state;

    const order = Object.values(LockableBuckets);

    // On iOS at least, focusing the keyboard pushes the content off the screen
    const autoFocus =
      !this.props.isPhonePortrait &&
      !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    const header = (
      <div>
        <h1>{t('LB.ChooseAPerk')}</h1>
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
          <div className={styles.tab} onClick={() => this.scrollToBucket('seasonal')}>
            {t('LB.Season')}
          </div>
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
              regexp.test(mod.item.displayProperties.name) ||
              regexp.test(mod.item.displayProperties.description)
          )
        )
      : mods;

    const queryFilteredBurns = query.length
      ? burns.filter((burn) => regexp.test(burn.displayProperties.name))
      : burns;

    const queryFilteredSeasonalMods = _.uniqBy(
      Object.values(queryFilteredMods).flatMap((bucktedMods) =>
        bucktedMods
          .filter(({ item }) =>
            getSpecialtySocketMetadataByPlugCategoryHash(item.plug.plugCategoryHash)
          )
          .map(({ item, plugSetHash }) => ({ mod: item, plugSetHash }))
      ),
      ({ mod }) => mod.hash
    );

    const footer =
      Object.values(selectedPerks).some((f) => Boolean(f?.length)) || selectedSeasonalMods.length
        ? ({ onClose }) => (
            <div className={styles.footer}>
              <div>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={(e) => this.onSubmit(e, onClose)}
                >
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
                            defs={defs}
                            lockedItem={lockedItem}
                            onClick={() => {
                              if (lockedItem.bucket) {
                                this.onPerkSelected(lockedItem, lockedItem.bucket);
                              }
                            }}
                          />
                        ))}
                      </React.Fragment>
                    )
                )}
                <span className={styles.seasonalFooterIndicator}>{t('LB.Season')}</span>
                {selectedSeasonalMods.map((item) => (
                  <SocketDetailsMod
                    key={item.mod.hash}
                    itemDef={item.mod}
                    defs={defs}
                    className={styles.selectedPerk}
                  />
                ))}
                <GlobalHotkeys
                  hotkeys={[
                    {
                      combo: 'enter',
                      description: t('LoadoutBuilder.SelectPerks'),
                      callback: (event) => {
                        this.onSubmit(event, onClose);
                      },
                    },
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
              ((queryFilteredPerks[bucketId] && queryFilteredPerks[bucketId].length > 0) ||
                (queryFilteredMods[bucketId] && queryFilteredMods[bucketId].length > 0)) && (
                <PerksForBucket
                  key={bucketId}
                  defs={defs}
                  bucket={buckets.byHash[bucketId]}
                  mods={queryFilteredMods[bucketId] || []}
                  perks={queryFilteredPerks[bucketId]}
                  burns={bucketId !== 4023194814 ? queryFilteredBurns : []}
                  locked={selectedPerks[bucketId] || []}
                  items={items[bucketId]}
                  onPerkSelected={(perk) => this.onPerkSelected(perk, buckets.byHash[bucketId])}
                />
              )
          )}
          {!$featureFlags.armor2ModPicker && (
            <SeasonalModPicker
              mods={queryFilteredSeasonalMods}
              defs={defs}
              locked={selectedSeasonalMods}
              onSeasonalModSelected={this.onSeasonalModSelected}
            />
          )}
        </div>
      </Sheet>
    );
  }

  private onPerkSelected = (item: LockedItemType, bucket: InventoryBucket) => {
    const { selectedPerks } = this.state;

    const perksForBucket = selectedPerks[bucket.hash];
    if (perksForBucket?.some((li) => lockedItemsEqual(li, item))) {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: removeLockedItem(item, selectedPerks[bucket.hash]),
        },
      });
    } else {
      this.setState({
        selectedPerks: {
          ...selectedPerks,
          [bucket.hash]: addLockedItem(item, selectedPerks[bucket.hash]),
        },
      });
    }
  };

  private onSeasonalModSelected = (item: LockedModBase): void => {
    const { selectedSeasonalMods } = this.state;

    if (selectedSeasonalMods.some((li) => li.mod.hash === item.mod.hash)) {
      this.setState({
        selectedSeasonalMods: selectedSeasonalMods.filter(
          (existing) => existing.mod.hash !== item.mod.hash
        ),
      });
    } else {
      this.setState({
        selectedSeasonalMods: [...selectedSeasonalMods, item],
      });
    }
  };

  private onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    this.props.lbDispatch({
      type: 'lockedMapAndSeasonalModsChanged',
      lockedMap: this.state.selectedPerks,
      lockedSeasonalMods: this.state.selectedSeasonalMods,
    });
    onClose();
  };

  private scrollToBucket = (bucketIdOrSeasonal: number | string) => {
    const elementId =
      bucketIdOrSeasonal === 'seasonal' ? bucketIdOrSeasonal : `perk-bucket-${bucketIdOrSeasonal}`;
    const elem = document.getElementById(elementId)!;
    elem?.scrollIntoView();
  };
}

export default connect<StoreProps>(mapStateToProps)(PerkPicker);

function LockedItemIcon({
  lockedItem,
  defs,
  onClick,
}: {
  lockedItem: LockedItemType;
  defs: D2ManifestDefinitions;
  onClick(e: React.MouseEvent): void;
}) {
  switch (lockedItem.type) {
    case 'mod':
      return (
        <SocketDetailsMod itemDef={lockedItem.mod} defs={defs} className={styles.selectedPerk} />
      );
    case 'perk':
      return (
        <span onClick={onClick}>
          <BungieImageAndAmmo
            className={styles.selectedPerk}
            hash={lockedItem.perk.hash}
            title={lockedItem.perk.displayProperties.name}
            src={lockedItem.perk.displayProperties.icon}
          />
        </span>
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
