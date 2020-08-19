import React, {
  Dispatch,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  LockedArmor2Mod,
  LockedArmor2ModMap,
  ModPickerCategories,
  ModPickerCategory,
  isModPickerCategory,
} from '../types';
import _ from 'lodash';
import { isLoadoutBuilderItem } from '../utils';
import copy from 'fast-copy';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector, bucketsSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { escapeRegExp } from 'app/search/search-filter';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { settingsSelector } from 'app/settings/reducer';
import { getSpecialtySocketMetadataByPlugCategoryHash, isArmor2Mod } from 'app/utils/item-utils';
import ModPickerSection from './ModPickerSection';
import { chainComparator, compareBy } from 'app/utils/comparators';
import ModPickerHeader from './ModPickerHeader';
import ModPickerFooter from './ModPickerFooter';
import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import { t } from 'app/i18next-t';
import { SearchFilterRef } from 'app/search/SearchFilterInput';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

const Armor2ModPlugCategoriesTitles = {
  [ModPickerCategories.general]: t('LB.General'),
  [ModPickerCategories.helmet]: t('LB.Helmet'),
  [ModPickerCategories.gauntlets]: t('LB.Gauntlets'),
  [ModPickerCategories.chest]: t('LB.Chest'),
  [ModPickerCategories.leg]: t('LB.Legs'),
  [ModPickerCategories.classitem]: t('LB.ClassItem'),
  [ModPickerCategories.seasonal]: t('LB.Seasonal'),
};

/** Used for generating the key attribute of the lockedArmor2Mods */
let modKey = 0;

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

interface ProvidedProps {
  lockedArmor2Mods: LockedArmor2ModMap;
  classType: DestinyClass;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  mods: PluggableInventoryItemDefinition[];
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
          .filter(isPluggableItem)
          .filter((item) => isArmor2Mod(item) && item.plug.insertionMaterialRequirementHash !== 0)
          .sort(sortMods);
      });

      return _.uniqBy(allMods, (mod) => mod.hash);
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: bucketsSelector(state)!,
    language: settingsSelector(state).language,
    mods: unlockedModsSelector(state, props),
    defs: state.manifest.d2Manifest!,
  });
}

/**
 * A sheet that allows picking a perk.
 */
function ModPicker({
  defs,
  mods,
  language,
  onClose,
  isPhonePortrait,
  lockedArmor2Mods,
  lbDispatch,
}: Props) {
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [lockedArmor2ModsInternal, setLockedArmor2ModsInternal] = useState(copy(lockedArmor2Mods));
  const filterInput = useRef<SearchFilterRef | null>(null);
  const itemContainer = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (itemContainer.current) {
      setHeight(itemContainer.current.clientHeight);
    }
  }, [itemContainer]);

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const onModSelected = useCallback(
    (item: LockedArmor2Mod) => {
      setLockedArmor2ModsInternal((oldState) => ({
        ...oldState,
        [item.category]: [...oldState[item.category], { ...item, key: modKey++ }],
      }));
    },
    [setLockedArmor2ModsInternal]
  );

  const onModRemoved = useCallback(
    (item: LockedArmor2Mod) => {
      setLockedArmor2ModsInternal((oldState) => {
        const firstIndex = oldState[item.category].findIndex((li) => li.mod.hash === item.mod.hash);

        if (firstIndex >= 0) {
          const newState = [...oldState[item.category]];
          newState.splice(firstIndex, 1);
          return {
            ...oldState,
            [item.category]: newState,
          };
        }

        return oldState;
      });
    },
    [setLockedArmor2ModsInternal]
  );

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    lbDispatch({
      type: 'lockedArmor2ModsChanged',
      lockedArmor2Mods: lockedArmor2ModsInternal,
    });
    onClose();
  };

  const scrollToBucket = (categoryOrSeasonal: number | string) => {
    const elementId = `mod-picker-section-${categoryOrSeasonal}`;
    const elem = document.getElementById(elementId)!;
    elem?.scrollIntoView();
  };

  const order = Object.values(ModPickerCategories).map((category) => ({
    category,
    translatedName: Armor2ModPlugCategoriesTitles[category],
  }));

  const queryFilteredMods = useMemo(() => {
    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');
    return query.length
      ? mods.filter(
          (mod) =>
            regexp.test(mod.displayProperties.name) ||
            regexp.test(mod.displayProperties.description)
        )
      : mods;
  }, [language, query, mods]);

  const modsByCategory = useMemo(() => {
    const rtn: { [T in ModPickerCategory]: LockedArmor2Mod[] } = {
      [ModPickerCategories.general]: [],
      [ModPickerCategories.helmet]: [],
      [ModPickerCategories.gauntlets]: [],
      [ModPickerCategories.chest]: [],
      [ModPickerCategories.leg]: [],
      [ModPickerCategories.classitem]: [],
      [ModPickerCategories.seasonal]: [],
    };

    for (const mod of queryFilteredMods) {
      if (getSpecialtySocketMetadataByPlugCategoryHash(mod.plug.plugCategoryHash)) {
        rtn.seasonal.push({ mod, category: 'seasonal' });
      } else if (isModPickerCategory(mod.plug.plugCategoryHash)) {
        rtn[mod.plug.plugCategoryHash].push({
          mod,
          category: mod.plug.plugCategoryHash,
        });
      }
    }

    return rtn;
  }, [queryFilteredMods]);

  const isGeneralOrSeasonal = (category: ModPickerCategory) =>
    category === ModPickerCategories.general || category === ModPickerCategories.seasonal;

  const footer = Object.values(lockedArmor2ModsInternal).some((f) => Boolean(f?.length))
    ? ({ onClose }) => (
        <ModPickerFooter
          defs={defs}
          categoryOrder={order}
          lockedArmor2Mods={lockedArmor2ModsInternal}
          isPhonePortrait={isPhonePortrait}
          onSubmit={(e) => onSubmit(e, onClose)}
          onModSelected={onModRemoved}
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
          scrollToBucket={scrollToBucket}
          onSearchChange={(e) => setQuery(e.currentTarget.value)}
          isPhonePortrait={isPhonePortrait}
        />
      }
      footer={footer}
      sheetClassName="item-picker"
    >
      <div ref={itemContainer} style={{ height }}>
        {Object.values(ModPickerCategories).map((category) => (
          <ModPickerSection
            key={category}
            mods={modsByCategory[category]}
            defs={defs}
            locked={lockedArmor2ModsInternal[category]}
            title={Armor2ModPlugCategoriesTitles[category]}
            category={category}
            maximumSelectable={isGeneralOrSeasonal(category) ? 5 : 2}
            energyMustMatch={!isGeneralOrSeasonal(category)}
            onModSelected={onModSelected}
            onModRemoved={onModRemoved}
          />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
