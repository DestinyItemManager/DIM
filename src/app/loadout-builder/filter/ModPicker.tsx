import { itemsForPlugSet } from 'app/collections/plugset-helpers';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  allItemsSelector,
  bucketsSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { escapeRegExp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { RootState } from 'app/store/types';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import copy from 'fast-copy';
import _ from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { LockedArmor2Mod, LockedArmor2ModMap, raidPlugCategoryHashes } from '../types';
import { armor2ModPlugCategoriesTitles, isLoadoutBuilderItem } from '../utils';
import ModPickerFooter from './ModPickerFooter';
import ModPickerHeader from './ModPickerHeader';
import PickerSectionMods from './PickerSectionMods';

/** Used for generating the key attribute of the lockedArmor2Mods */
let modKey = 0;

const sortMods = chainComparator<LockedArmor2Mod>(
  compareBy((l) => l.modDef.plug.energyCost?.energyType),
  compareBy((l) => l.modDef.plug.energyCost?.energyCost),
  compareBy((l) => l.modDef.displayProperties.name)
);

interface ProvidedProps {
  lockedArmor2Mods: LockedArmor2ModMap;
  classType: DestinyClass;
  initialQuery?: string;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  mods: LockedArmor2Mod[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedModsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    (state: RootState) => state.manifest.d2Manifest!,
    (_: RootState, props: ProvidedProps) => props.classType,
    (profileResponse, allItems, defs, classType): StoreProps['mods'] => {
      const plugSets: { [bucketHash: number]: Set<number> } = {};
      if (!profileResponse) {
        return [];
      }

      // 1. loop through all items, build up a map of mod sockets by bucket
      for (const item of allItems) {
        if (
          !item ||
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

      // 2. for each unique socket (type?) get a list of unlocked mods
      const allUnlockedMods = Object.values(plugSets).flatMap((sets) => {
        const unlockedPlugs: number[] = [];

        for (const plugSetHash of sets) {
          const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
          for (const plugSetItem of plugSetItems) {
            if (plugIsInsertable(plugSetItem)) {
              unlockedPlugs.push(plugSetItem.plugItemHash);
            }
          }
        }

        const transformedMods: LockedArmor2Mod[] = [];

        for (const plug of unlockedPlugs) {
          const def = defs.InventoryItem.get(plug);

          if (
            isPluggableItem(def) &&
            isArmor2Mod(def) &&
            def.plug.insertionMaterialRequirementHash !== 0
          ) {
            transformedMods.push({ modDef: def });
          }
        }

        return transformedMods.sort(sortMods);
      });

      return _.uniqBy(allUnlockedMods, (unlocked) => unlocked.modDef.hash);
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
  isPhonePortrait,
  lockedArmor2Mods,
  initialQuery,
  lbDispatch,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery || '');
  const [lockedArmor2ModsInternal, setLockedArmor2ModsInternal] = useState(copy(lockedArmor2Mods));
  const filterInput = useRef<SearchFilterRef | null>(null);

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const onModSelected = useCallback(
    (mod: LockedArmor2Mod) => {
      const { plugCategoryHash } = mod.modDef.plug;
      setLockedArmor2ModsInternal((oldState) => ({
        ...oldState,
        [plugCategoryHash]: [...(oldState[plugCategoryHash] || []), { ...mod, key: modKey++ }],
      }));
    },
    [setLockedArmor2ModsInternal]
  );

  const onModRemoved = useCallback(
    (mod: LockedArmor2Mod) => {
      const { plugCategoryHash } = mod.modDef.plug;
      setLockedArmor2ModsInternal((oldState) => {
        const firstIndex =
          oldState[plugCategoryHash]?.findIndex((li) => li.modDef.hash === mod.modDef.hash) || -1;

        if (firstIndex >= 0) {
          const newState = [...(oldState[plugCategoryHash] || [])];
          newState.splice(firstIndex, 1);
          return {
            ...oldState,
            [plugCategoryHash]: newState,
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

  const scrollToBucket = (plugCategoryHashes: number[]) => {
    const elementId = `mod-picker-section-${plugCategoryHashes.join('-')}`;
    const elem = document.getElementById(elementId)!;
    elem?.scrollIntoView();
  };

  const queryFilteredMods = useMemo(() => {
    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');
    return query.length
      ? mods.filter(
          (mod) =>
            regexp.test(mod.modDef.displayProperties.name) ||
            regexp.test(mod.modDef.displayProperties.description) ||
            regexp.test(mod.modDef.itemTypeDisplayName) ||
            (query.startsWith('plugCategoryHash:in:') &&
              query.includes(`${mod.modDef.plug.plugCategoryHash}`)) ||
            mod.modDef.perks.some((perk) => {
              const perkDef = defs.SandboxPerk.get(perk.perkHash);
              return (
                perkDef &&
                (regexp.test(perkDef.displayProperties.name) ||
                  regexp.test(perkDef.displayProperties.description) ||
                  regexp.test(perk.requirementDisplayString))
              );
            })
        )
      : mods;
  }, [language, query, mods, defs.SandboxPerk]);

  const modsByCategory = useMemo(() => {
    const otherMods: { mods: LockedArmor2Mod[]; plugCategoryHashes: number[]; title: string } = {
      mods: [],
      plugCategoryHashes: [],
      title: t(armor2ModPlugCategoriesTitles.other),
    };

    const rtn: { mods: LockedArmor2Mod[]; plugCategoryHashes: number[]; title: string }[] = [
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.general],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.general]),
      },
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.helmet],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.helmet]),
      },
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.gauntlets],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.gauntlets]),
      },
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.chest],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.chest]),
      },
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.leg],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.leg]),
      },
      {
        mods: [],
        plugCategoryHashes: [armor2PlugCategoryHashesByName.classitem],
        title: t(armor2ModPlugCategoriesTitles[armor2PlugCategoryHashesByName.classitem]),
      },
      {
        mods: [],
        plugCategoryHashes: raidPlugCategoryHashes,
        title: t(armor2ModPlugCategoriesTitles.raid),
      },
      otherMods, // build hashes as we go
    ];

    for (const mod of queryFilteredMods) {
      const group = rtn.find((group) =>
        group.plugCategoryHashes.includes(mod.modDef.plug.plugCategoryHash)
      );

      if (group) {
        group.mods.push(mod);
      } else {
        otherMods.mods.push(mod);
        otherMods.plugCategoryHashes.push(mod.modDef.plug.plugCategoryHash);
      }
    }

    return rtn;
  }, [queryFilteredMods]);

  const footer = Object.values(lockedArmor2ModsInternal).some((f) => Boolean(f?.length))
    ? ({ onClose }) => (
        <ModPickerFooter
          defs={defs}
          groupOrder={modsByCategory}
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
          groupOrder={modsByCategory}
          query={query}
          scrollToBucket={scrollToBucket}
          onSearchChange={(e) => setQuery(e.currentTarget.value)}
          isPhonePortrait={isPhonePortrait}
        />
      }
      footer={footer}
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {modsByCategory.map(({ mods, plugCategoryHashes, title }) => (
        <PickerSectionMods
          key={plugCategoryHashes.join('-')}
          mods={mods}
          defs={defs}
          locked={Object.entries(lockedArmor2ModsInternal)
            .filter(([plugCategoryHash]) => plugCategoryHashes.includes(Number(plugCategoryHash)))
            .flatMap(([_, mods]) => mods)
            .filter((mod): mod is LockedArmor2Mod => Boolean(mod))}
          title={title}
          plugCategoryHashes={plugCategoryHashes}
          onModSelected={onModSelected}
          onModRemoved={onModRemoved}
        />
      ))}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
