import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, profileResponseSelector } from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import {
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, DestinyEnergyType, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { isLoadoutBuilderItem } from './item-utils';
import { knownModPlugCategoryHashes, slotSpecificPlugCategoryHashes } from './known-values';
import { isInsertableArmor2Mod, sortModGroups, sortMods } from './mod-utils';
import PlugDrawer, { PlugsWithMaxSelectable } from './plug-drawer/PlugDrawer';

/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

const sortModPickerGroups = (a: PlugsWithMaxSelectable, b: PlugsWithMaxSelectable) =>
  sortModGroups(a.plugs, b.plugs);

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
  plugsWithMaxSelectableSets: PlugsWithMaxSelectable[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedPlugSetsSelector = createSelector(
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
    ): PlugsWithMaxSelectable[] => {
      const plugsWithMaxSelectableSets: { [plugSetHash: number]: PlugsWithMaxSelectable } = {};
      if (!profileResponse || classType === undefined) {
        return [];
      }

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

        const modSockets = getSocketsByCategoryHash(
          item.sockets,
          SocketCategoryHashes.ArmorMods
        ).filter(
          (socket) =>
            socket.socketDefinition.reusablePlugSetHash &&
            socket.socketDefinition.singleInitialItemHash &&
            (!plugCategoryHashWhitelist ||
              (socket.plugged &&
                plugCategoryHashWhitelist.includes(socket.plugged.plugDef.plug.plugCategoryHash)))
        );
        const socketsGroupedByPlugSetHash = _.groupBy(
          modSockets,
          (socket) => socket.socketDefinition.reusablePlugSetHash
        );
        for (const [hashAsString, sockets] of Object.entries(socketsGroupedByPlugSetHash)) {
          const hash = parseInt(hashAsString, 10);
          const plugsWithDuplicates: PluggableInventoryItemDefinition[] = [];

          for (const itemPlug of itemsForPlugSet(profileResponse, hash)) {
            const plugDef = defs.InventoryItem.get(itemPlug.plugItemHash);
            if (isInsertableArmor2Mod(plugDef)) {
              plugsWithDuplicates.push(plugDef);
            }
          }

          const plugs = _.uniqBy(plugsWithDuplicates, (plug) => plug.hash);

          if (plugs.length && !plugsWithMaxSelectableSets[hash]) {
            plugsWithMaxSelectableSets[hash] = {
              plugSetHash: hash,
              maxSelectable: plugs.some((p) =>
                slotSpecificPlugCategoryHashes.includes(p.plug.plugCategoryHash)
              )
                ? sockets.length
                : MAX_SLOT_INDEPENDENT_MODS,
              plugs,
            };
          } else if (
            plugs.length &&
            plugsWithMaxSelectableSets[hash].maxSelectable < sockets.length
          ) {
            plugsWithMaxSelectableSets[hash].maxSelectable = sockets.length;
          }
        }
      }
      return Object.values(plugsWithMaxSelectableSets);
    }
  );
  return (state: RootState, props: ProvidedProps): StoreProps => ({
    language: languageSelector(state),
    plugsWithMaxSelectableSets: unlockedPlugSetsSelector(state, props),
  });
}

/**
 * A sheet to pick mods that are required in the final loadout sets.
 */
function ModPicker({
  plugsWithMaxSelectableSets,
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
          lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY &&
          (modEnergyType === DestinyEnergyType.Any || // Any energy works with everything
            associatedLockedMods.some((l) => l.plug.energyCost?.energyType === modEnergyType) || // Matches some other energy
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
      plugsWithMaxSelectableSets={plugsWithMaxSelectableSets}
      initiallySelected={lockedMods}
      minHeight={minHeight}
      isPlugSelectable={isModSelectable}
      sortPlugGroups={sortModPickerGroups}
      sortPlugs={sortMods}
      onAccept={onAccept}
      onClose={onClose}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
