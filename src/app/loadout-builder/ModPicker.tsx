import React from 'react';
import Sheet from '../dim-ui/Sheet';
import SearchFilterInput from '../search/SearchFilterInput';
import '../item-picker/ItemPicker.scss';
import { DestinyInventoryItemDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  LockedArmor2Mod,
  LockedArmor2ModMap,
  ModPickerCategories,
  ModPickerCategory
} from './types';
import _ from 'lodash';
import { isLoadoutBuilderItem } from './generated-sets/utils';
import copy from 'fast-copy';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import { escapeRegExp } from 'app/search/search-filters';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { settingsSelector } from 'app/settings/reducer';
import { specialtyModSocketHashes, isArmor2Mod } from 'app/utils/item-utils';
import ModPickerSection from './ModPickerSection';
import { chainComparator, compareBy } from 'app/utils/comparators';
import ModPickerHeader from './ModPickerHeader';
import ModPickerFooter from './ModPickerFooter';
import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import { t } from 'app/i18next-t';

const Armor2ModPlugCategoriesTitles = {
  [ModPickerCategories.general]: t('LB.General'),
  [ModPickerCategories.helmet]: t('LB.Helmet'),
  [ModPickerCategories.gauntlets]: t('LB.Gauntlets'),
  [ModPickerCategories.chest]: t('LB.Chest'),
  [ModPickerCategories.leg]: t('LB.Legs'),
  [ModPickerCategories.classitem]: t('LB.ClassItem'),
  [ModPickerCategories.seasonal]: t('LB.Seasonal')
};

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<DestinyInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

interface ProvidedProps {
  lockedArmor2Mods: LockedArmor2ModMap;
  classType: DestinyClass;
  onArmor2ModsChanged(mods: LockedArmor2ModMap): void;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  mods: DestinyInventoryItemDefinition[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedModsSelector = createSelector(
    profileResponseSelector,
    storesSelector,
    (state: RootState) => state.manifest.d2Manifest!,
    (_: RootState, props: ProvidedProps) => props.classType,
    (profileResponse, stores, defs, classType): StoreProps['mods'] => {
      const plugSets: { [bucketHash: number]: Set<number> } = {};
      if (!profileResponse) {
        return [];
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
      const allMods = Object.values(plugSets).flatMap((sets) => {
        const unlockedPlugs: number[] = [];

        for (const plugSetHash of sets) {
          const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
          for (const plugSetItem of plugSetItems) {
            if (plugIsInsertable(plugSetItem)) {
              unlockedPlugs.push(plugSetItem.plugItemHash);
            }
          }
        }

        return unlockedPlugs
          .map((i) => defs.InventoryItem.get(i))
          .filter((item) => isArmor2Mod(item) && item.collectibleHash)
          .sort(sortMods);
      });

      return _.uniqBy(allMods, (mod) => mod.hash);
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: state.inventory.buckets!,
    language: settingsSelector(state).language,
    mods: unlockedModsSelector(state, props),
    defs: state.manifest.d2Manifest!
  });
}

interface State {
  query: string;
  height?: number;
  lockedArmor2Mods: LockedArmor2ModMap;
}

/**
 * A sheet that allows picking a perk.
 */
class ModPicker extends React.Component<Props, State> {
  state: State = {
    query: '',
    lockedArmor2Mods: copy(this.props.lockedArmor2Mods)
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
    const { defs, mods, language, onClose, isPhonePortrait } = this.props;
    const { query, height, lockedArmor2Mods } = this.state;

    const order = Object.values(ModPickerCategories).map((category) => ({
      category,
      translatedName: Armor2ModPlugCategoriesTitles[category]
    }));

    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');

    const queryFilteredMods = query.length
      ? mods.filter(
          (mod) =>
            regexp.test(mod.displayProperties.name) ||
            regexp.test(mod.displayProperties.description)
        )
      : mods;

    const getByModCategoryType = (category: ModPickerCategory) =>
      queryFilteredMods
        .filter((mod) =>
          category === ModPickerCategories.seasonal
            ? specialtyModSocketHashes.includes(mod.plug.plugCategoryHash)
            : mod.plug.plugCategoryHash === category
        )
        .map((mod) => ({ mod, category }));

    const isGeneralOrSeasonal = (category: ModPickerCategory) =>
      category === ModPickerCategories.general || category === ModPickerCategories.seasonal;

    const footer = Object.values(lockedArmor2Mods).some((f) => Boolean(f?.length))
      ? ({ onClose }) => (
          <ModPickerFooter
            defs={defs}
            categoryOrder={order}
            lockedArmor2Mods={lockedArmor2Mods}
            isPhonePortrait={isPhonePortrait}
            onSubmit={(e) => this.onSubmit(e, onClose)}
            onModSelected={this.onModSelected}
          />
        )
      : undefined;

    return (
      <Sheet
        onClose={onClose}
        header={
          <ModPickerHeader
            categoryOrder={order}
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
          {Object.values(ModPickerCategories).map((category) => (
            <ModPickerSection
              key={category}
              mods={getByModCategoryType(category)}
              defs={defs}
              locked={lockedArmor2Mods[category]}
              title={Armor2ModPlugCategoriesTitles[category]}
              category={category}
              maximumSelectable={isGeneralOrSeasonal(category) ? 5 : 2}
              energyMustMatch={!isGeneralOrSeasonal(category)}
              onModSelected={this.onModSelected}
            />
          ))}
        </div>
      </Sheet>
    );
  }

  private onModSelected = (item: LockedArmor2Mod) => {
    const { lockedArmor2Mods } = this.state;

    if (lockedArmor2Mods[item.category]?.some((li) => li.mod.hash === item.mod.hash)) {
      this.setState({
        lockedArmor2Mods: {
          ...lockedArmor2Mods,
          [item.category]: lockedArmor2Mods[item.category]?.filter(
            (li) => li.mod.hash !== item.mod.hash
          )
        }
      });
    } else {
      this.setState({
        lockedArmor2Mods: {
          ...lockedArmor2Mods,
          [item.category]: [...(lockedArmor2Mods[item.category] || []), item]
        }
      });
    }
  };

  private onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    this.props.onArmor2ModsChanged(this.state.lockedArmor2Mods);
    onClose();
  };

  private scrollToBucket = (categoryOrSeasonal: number | string) => {
    const elementId = `mod-picker-section-${categoryOrSeasonal}`;
    const elem = document.getElementById(elementId)!;
    elem?.scrollIntoView();
  };
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
