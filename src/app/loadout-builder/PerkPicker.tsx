import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition, DestinyClass, TierType } from 'bungie-api-ts/destiny2';
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
import copy from 'fast-copy';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import { escapeRegExp } from 'app/search/search-filters';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { settingsSelector } from 'app/settings/reducer';
import { chainComparator, compareBy } from 'app/utils/comparators';
import PickerHeader from './PickerHeader';
import PerkPickerFooter from './PerkPickerFooter';
import { isArmor2Mod } from 'app/utils/item-utils';

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<DestinyInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

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
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  perks: Readonly<{
    [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
  }>;
  mods: Readonly<{
    [bucketHash: number]: readonly {
      item: DestinyInventoryItemDefinition;
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
          item.sockets.sockets
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
            item: defs.InventoryItem.get(parseInt(i, 10)),
            plugSetHash
          }))
          .filter(
            (i) =>
              i.item.inventory.tierType !== TierType.Common &&
              (!i.item.itemCategoryHashes || !i.item.itemCategoryHashes.includes(56)) &&
              i.item.collectibleHash &&
              !isArmor2Mod(i.item)
          )
          .sort((a, b) => sortMods(a.item, b.item));
      });
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: state.inventory.buckets!,
    language: settingsSelector(state).language,
    perks: perksSelector(state, props),
    mods: unlockedPlugsSelector(state, props),
    defs: state.manifest.d2Manifest!
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
    const {
      defs,
      perks,
      mods,
      buckets,
      items,
      language,
      onClose,
      isPhonePortrait,
      lockedMap
    } = this.props;
    const { query, height, selectedPerks } = this.state;

    const order = Object.values(LockableBuckets);

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

    const footer = Object.values(selectedPerks).some((f) => Boolean(f?.length))
      ? ({ onClose }) => (
          <PerkPickerFooter
            defs={defs}
            bucketOrder={order}
            buckets={buckets}
            isPhonePortrait={isPhonePortrait}
            selectedPerks={lockedMap}
            onSubmit={(e) => this.onSubmit(e, onClose)}
            onPerkSelected={this.onPerkSelected}
          />
        )
      : undefined;

    return (
      <Sheet
        onClose={onClose}
        header={
          <PickerHeader
            buckets={this.props.buckets}
            bucketOrder={order}
            query={query}
            scrollToBucket={this.scrollToBucket}
            onSearchChange={(e) => this.setState({ query: e.currentTarget.value })}
            isPhonePortrait={this.props.isPhonePortrait}
          />
        }
        footer={footer}
        sheetClassName="item-picker"
      >
        <div ref={this.itemContainer} style={{ height }}>
          {order.map(
            (bucketId) =>
              ((queryFilteredPerks[bucketId] && queryFilteredPerks[bucketId].length > 0) ||
                (queryFilteredMods[bucketId] && queryFilteredMods[bucketId].length > 0)) && (
                <PerksForBucket
                  key={bucketId}
                  defs={defs}
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
    if (perksForBucket?.some((li) => lockedItemsEqual(li, item))) {
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

  private onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    this.props.onPerksSelected(this.state.selectedPerks);
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
