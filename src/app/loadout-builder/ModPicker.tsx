import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition, DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { LockableBuckets, LockedItemType, LockedMap, LockedModBase } from './types';
import _ from 'lodash';
import {
  removeLockedItem,
  lockedItemsEqual,
  addLockedItem,
  isLoadoutBuilderItem
} from './generated-sets/utils';
import copy from 'fast-copy';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import { itemsForPlugSet } from 'app/collections/PresentationNodeRoot';
import { escapeRegExp } from 'app/search/search-filters';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { settingsSelector } from 'app/settings/reducer';
import { specialtyModSocketHashes } from 'app/utils/item-utils';
import SeasonalModPicker from './SeasonalModPicker';
import { chainComparator, compareBy } from 'app/utils/comparators';
import PickerHeader from './PickerHeader';
import PickerFooter from './PickerFooter';

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<DestinyInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

interface ProvidedProps {
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  classType: DestinyClass;
  onPerksSelected(perks: LockedMap): void;
  onSeasonalModsChanged(mods: LockedModBase[]): void;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
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
              i.item.collectibleHash
          )
          .sort((a, b) => sortMods(a.item, b.item));
      });
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: state.inventory.buckets!,
    language: settingsSelector(state).language,
    mods: unlockedPlugsSelector(state, props),
    defs: state.manifest.d2Manifest!
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
class ModPicker extends React.Component<Props, State> {
  state: State = {
    query: '',
    selectedPerks: copy(this.props.lockedMap),
    selectedSeasonalMods: copy(this.props.lockedSeasonalMods)
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
    const { defs, mods, buckets, language, onClose, isPhonePortrait, lockedMap } = this.props;
    const { query, height, selectedPerks, selectedSeasonalMods } = this.state;

    const order = Object.values(LockableBuckets);

    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');

    const queryFilteredMods = query.length
      ? _.mapValues(mods, (bucketMods) =>
          bucketMods.filter(
            (mod) =>
              regexp.test(mod.item.displayProperties.name) ||
              regexp.test(mod.item.displayProperties.description)
          )
        )
      : mods;

    const queryFilteredSeasonalMods = _.uniqBy(
      Object.values(queryFilteredMods).flatMap((bucktedMods) =>
        bucktedMods
          .filter(({ item }) => specialtyModSocketHashes.includes(item.plug.plugCategoryHash))
          .map(({ item, plugSetHash }) => ({ mod: item, plugSetHash }))
      ),
      ({ mod }) => mod.hash
    );

    const footer = Object.values(selectedPerks).some((f) => Boolean(f?.length))
      ? ({ onClose }) => (
          <PickerFooter
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
          <SeasonalModPicker
            mods={queryFilteredSeasonalMods}
            defs={defs}
            locked={selectedSeasonalMods}
            onSeasonalModSelected={this.onSeasonalModSelected}
          />
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

  private onSeasonalModSelected = (item: LockedModBase) => {
    const { selectedSeasonalMods } = this.state;

    if (selectedSeasonalMods.some((li) => li.mod.hash === item.mod.hash)) {
      this.setState({
        selectedSeasonalMods: selectedSeasonalMods.filter(
          (existing) => existing.mod.hash !== item.mod.hash
        )
      });
    } else {
      this.setState({
        selectedSeasonalMods: [...selectedSeasonalMods, item]
      });
    }
  };

  private onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    this.props.onPerksSelected(this.state.selectedPerks);
    this.props.onSeasonalModsChanged(this.state.selectedSeasonalMods);
    onClose();
  };

  private scrollToBucket = (bucketIdOrSeasonal: number | string) => {
    const elementId =
      bucketIdOrSeasonal === 'seasonal' ? bucketIdOrSeasonal : `perk-bucket-${bucketIdOrSeasonal}`;
    const elem = document.getElementById(elementId)!;
    elem?.scrollIntoView();
  };
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
