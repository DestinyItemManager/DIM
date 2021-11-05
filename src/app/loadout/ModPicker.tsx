import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, profileResponseSelector } from 'app/inventory/selectors';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import {
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { DestinyClass, DestinyEnergyType, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { isLoadoutBuilderItem } from './item-utils';
import { knownModPlugCategoryHashes, slotSpecificPlugCategoryHashes } from './known-values';
import { isInsertableArmor2Mod, sortMods } from './mod-utils';
import PlugDrawer from './plug-drawer/PlugDrawer';

/** Slot specific mods can have at most 2 mods. */
const MAX_SLOT_SPECIFIC_MODS = 2;
/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

interface ProvidedProps {
  /**
   * An array of mods that are already locked.
   */
  lockedMods: PluggableInventoryItemDefinition[];
  /**
   * The DestinyClass instance that is used to filter items on when building up the
   * set of available mods.
   */
  classType: DestinyClass;
  /** A query string that is passed to the filtering logic to prefilter the available mods. */
  initialQuery?: string;
  /** The min height for the sheet. */
  minHeight?: number;
  /** A list of plugs we are restricting the available mods to. */
  plugCategoryHashWhitelist?: number[];
  /** Called with the new lockedMods when the user accepts the new modset. */
  onAccept(newLockedMods: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose(): void;
}

interface StoreProps {
  language: string;
  /**
   * An array of mods built from looking at the current DestinyClass's
   * items and finding all the available mods that could be socketed.
   */
  mods: PluggableInventoryItemDefinition[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedModsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    d2ManifestSelector,
    (_state: RootState, props: ProvidedProps) => props.classType,
    (_state: RootState, props: ProvidedProps) => props.plugCategoryHashWhitelist,
    (
      profileResponse: DestinyProfileResponse,
      allItems: DimItem[],
      defs: D2ManifestDefinitions,
      classType?: DestinyClass,
      plugCategoryHashWhitelist?: number[]
    ): PluggableInventoryItemDefinition[] => {
      const plugSets: { [bucketHash: number]: Set<number> } = {};
      if (!profileResponse || classType === undefined) {
        return [];
      }

      // 1. loop through all items, build up a map of mod sockets by bucket
      for (const item of allItems) {
        if (
          !item ||
          !item.sockets ||
          // Makes sure its an armour 2.0 item
          !isLoadoutBuilderItem(item) ||
          // If classType is passed in only use items from said class otherwise use
          // items from all characters. Usefull if in loadouts and only mods and guns.
          !(classType === DestinyClass.Unknown || item.classType === classType)
        ) {
          continue;
        }
        if (!plugSets[item.bucket.hash]) {
          plugSets[item.bucket.hash] = new Set<number>();
        }
        // build the filtered unique mods
        item.sockets.allSockets
          .filter((s) => !s.isPerk)
          .forEach((socket) => {
            if (socket.socketDefinition.reusablePlugSetHash) {
              plugSets[item.bucket.hash].add(socket.socketDefinition.reusablePlugSetHash);
            }
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

        const finalMods: PluggableInventoryItemDefinition[] = [];

        for (const plug of unlockedPlugs) {
          const def = defs.InventoryItem.get(plug);
          const isWhitelisted =
            def.plug &&
            (!plugCategoryHashWhitelist ||
              plugCategoryHashWhitelist.includes(def.plug.plugCategoryHash));

          if (isWhitelisted && isInsertableArmor2Mod(def)) {
            finalMods.push(def);
          }
        }

        return finalMods.sort(sortMods);
      });

      return _.uniqBy(allUnlockedMods, (unlocked) => unlocked.hash);
    }
  );
  return (state: RootState, props: ProvidedProps): StoreProps => ({
    language: languageSelector(state),
    mods: unlockedModsSelector(state, props),
  });
}

/**
 * A sheet to pick mods that are required in the final loadout sets.
 */
function ModPicker({
  mods,
  language,
  lockedMods,
  initialQuery,
  minHeight,
  onAccept,
  onClose,
}: Props) {
  const isModSelectable = useCallback(
    (mod: PluggableInventoryItemDefinition, selected: PluggableInventoryItemDefinition[]) => {
      const { plugCategoryHash } = mod.plug;
      const isSlotSpecificCategory = slotSpecificPlugCategoryHashes.includes(plugCategoryHash);

      let associatedLockedMods: PluggableInventoryItemDefinition[] = [];

      if (isSlotSpecificCategory || plugCategoryHash === armor2PlugCategoryHashesByName.general) {
        associatedLockedMods = selected.filter(
          (mod) => mod.plug.plugCategoryHash === plugCategoryHash
        );
      } else if (raidModPlugCategoryHashes.includes(plugCategoryHash)) {
        associatedLockedMods = selected.filter((mod) =>
          raidModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
        );
      } else {
        associatedLockedMods = selected.filter(
          (mod) => !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
        );
      }

      // We only care about this for slot specific mods and it is used in isModSelectable. It is calculated here
      // so it is only done once per render.
      const lockedModCost = isSlotSpecificCategory
        ? _.sumBy(associatedLockedMods, (mod) => mod.plug.energyCost?.energyCost || 0)
        : 0;

      if (isSlotSpecificCategory) {
        // Traction has no energy type so its basically Any energy and 0 cost
        const modCost = mod.plug.energyCost?.energyCost || 0;
        const modEnergyType = mod.plug.energyCost?.energyType || DestinyEnergyType.Any;

        return (
          associatedLockedMods.length < MAX_SLOT_SPECIFIC_MODS &&
          lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY &&
          (modEnergyType === DestinyEnergyType.Any || // Any energy works with everything
            associatedLockedMods.some((l) => l.plug.energyCost?.energyType === modEnergyType) || // Matches some other enery
            associatedLockedMods.every(
              (l) =>
                (l.plug.energyCost?.energyType || DestinyEnergyType.Any) === DestinyEnergyType.Any
            )) // If every thing else is Any we are good
        );
      } else {
        return associatedLockedMods.length < MAX_SLOT_INDEPENDENT_MODS;
      }
    },
    []
  );

  return (
    <PlugDrawer
      title={t('LB.ChooseAMod')}
      searchPlaceholder={t('LB.SearchAMod')}
      acceptButtonText={t('LB.SelectMods')}
      language={language}
      initialQuery={initialQuery}
      plugs={mods}
      initiallySelected={lockedMods}
      minHeight={minHeight}
      isPlugSelectable={isModSelectable}
      onAccept={onAccept}
      onClose={onClose}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
