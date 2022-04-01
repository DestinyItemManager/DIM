import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { filterDimPlugsUnlockedOnCharacterOrProfile } from 'app/records/plugset-helpers';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { modMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { isLoadoutBuilderItem } from './item-utils';
import { knownModPlugCategoryHashes, slotSpecificPlugCategoryHashes } from './known-values';
import {
  activityModPlugCategoryHashes,
  isInsertableArmor2Mod,
  sortModGroups,
  sortMods,
} from './mod-utils';
import PlugDrawer from './plug-drawer/PlugDrawer';
import { PlugSet } from './plug-drawer/types';

/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

const sortModPickerPlugGroups = (a: PlugSet, b: PlugSet) => sortModGroups(a.plugs, b.plugs);

interface ProvidedProps {
  /** An array of mods that are already selected by the user. */
  lockedMods: PluggableInventoryItemDefinition[];
  /** The character class we'll show unlocked mods for. */
  classType?: DestinyClass;
  /**
   * The store ID that we're picking mods for. Used to restrict mods to those unlocked by that store.
   */
  owner?: string;
  /** A query string that is passed to the filtering logic to prefilter the available mods. */
  initialQuery?: string;
  /** Only show mods that are in these categories. No restriction if this is not provided. */
  plugCategoryHashWhitelist?: number[];
  /** Called with the complete list of lockedMods when the user accepts the new mod selections. */
  onAccept(newLockedMods: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose(): void;
}

interface StoreProps {
  plugSets: PlugSet[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /**
   * Build up a list of PlugSets used by armor in the user's inventory, and the
   * plug items contained within them, restricted to an optional plugCategoryHashWhitelist
   */
  const unlockedPlugSetsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    d2ManifestSelector,
    (_state: RootState, props: ProvidedProps) => props.classType,
    (_state: RootState, props: ProvidedProps) => props.owner,
    (_state: RootState, props: ProvidedProps) => props.plugCategoryHashWhitelist,
    (_state: RootState, props: ProvidedProps) => props.lockedMods,
    currentStoreSelector,
    (
      profileResponse,
      allItems,
      defs,
      classType,
      owner,
      plugCategoryHashWhitelist,
      lockedMods,
      currentStore
    ): PlugSet[] => {
      const plugSetsByHash: { [plugSetHash: number]: PlugSet } = {};
      if (!profileResponse || !defs) {
        return emptyArray();
      }

      // We need the name of the Artifice armor perk to show in one of the headers
      const artificeString = defs.InventoryItem.get(3727270518)?.displayProperties.name;

      // Look at every armor item and see what sockets it has
      for (const item of allItems) {
        if (
          !item?.sockets ||
          // Makes sure it's an armour 2.0 item
          !isLoadoutBuilderItem(item) ||
          // If classType is passed in, only use items from said class,
          // otherwise use items from all characters.
          // Useful if in loadouts and only mods and guns
          (classType !== DestinyClass.Unknown &&
            classType !== undefined &&
            item.classType !== classType)
        ) {
          continue;
        }

        // Get all the armor mod sockets we can use for an item. Note that sockets without `plugged`
        // are considered disabled by the API
        const modSockets = getSocketsByCategoryHash(
          item.sockets,
          SocketCategoryHashes.ArmorMods
        ).filter((socket) => socket.socketDefinition.reusablePlugSetHash && socket.plugged);

        // Group the sockets by their reusablePlugSetHash, this lets us get a count of available mods for
        // each socket in the case of bucket specific mods/sockets
        const socketsGroupedByPlugSetHash = _.groupBy(
          modSockets,
          (socket) => socket.socketDefinition.reusablePlugSetHash
        );

        // For each of the socket types on the item, figure out what plugs could go into it
        // and the maximum number of those sockets that can appear on a single item.
        for (const [hashAsString, sockets] of Object.entries(socketsGroupedByPlugSetHash)) {
          const plugSetHash = parseInt(hashAsString, 10);
          const dimPlugs = filterDimPlugsUnlockedOnCharacterOrProfile(
            profileResponse,
            sockets[0].plugSet!,
            // TODO: For vaulted items, union all the unlocks and then be smart about picking the right store
            owner ?? currentStore!.id
          );

          // Filter down to plugs that match the plugCategoryHashWhitelist
          const plugsWithDuplicates: PluggableInventoryItemDefinition[] = [];
          for (const dimPlug of dimPlugs) {
            if (
              isInsertableArmor2Mod(dimPlug.plugDef) &&
              (!plugCategoryHashWhitelist ||
                plugCategoryHashWhitelist.includes(dimPlug.plugDef.plug.plugCategoryHash))
            ) {
              plugsWithDuplicates.push(dimPlug.plugDef);
            }
          }

          // TODO: Why would there be duplicates within a single plugset?
          const plugs = _.uniqBy(plugsWithDuplicates, (plug) => plug.hash);

          // Combat, general and raid mods are restricted across items so we need to manually
          // set the max selectable
          const maxSelectable = plugs.some((p) =>
            slotSpecificPlugCategoryHashes.includes(p.plug.plugCategoryHash)
          )
            ? sockets.length
            : MAX_SLOT_INDEPENDENT_MODS;

          if (plugs.length && !plugSetsByHash[plugSetHash]) {
            plugSetsByHash[plugSetHash] = {
              plugSetHash,
              maxSelectable,
              selectionType: 'multi',
              plugs,
              selected: [],
            };

            // use an activity name, if one is available, for mods with no item type display name
            if (!plugs[0].itemTypeDisplayName) {
              const activityHash =
                modMetadataByPlugCategoryHash[plugs[0].plug.plugCategoryHash]
                  ?.modGroupNameOverrideActivityHash;
              if (activityHash) {
                const activityName = defs.Activity.get(activityHash).displayProperties.name;
                if (activityName) {
                  plugSetsByHash[plugSetHash].headerSuffix = activityName;
                }
              }
            }

            // Artificer armor has a single extra slot that can take slot-specific mods. Give it a special header
            if (
              maxSelectable === 1 &&
              armor2PlugCategoryHashes.includes(plugs[0].plug.plugCategoryHash)
            ) {
              plugSetsByHash[plugSetHash].headerSuffix = artificeString;
            }
          } else if (plugs.length && plugSetsByHash[plugSetHash].maxSelectable < sockets.length) {
            plugSetsByHash[plugSetHash].maxSelectable = sockets.length;
          }
        }
      }

      const plugSets = Object.values(plugSetsByHash);

      // Now we populate the plugsets with their corresponding plugs.
      // Due to artificer plugsets being a subset of the corresponding bucket specific plugsets
      // we sort the plugsets in reverse by length to ensure we use artificer sockets first.
      plugSets.sort((a, b) => b.plugs.length - a.plugs.length);
      for (const initiallySelected of lockedMods) {
        const possiblePlugSets = plugSets.filter((set) =>
          set.plugs.some((plug) => plug.hash === initiallySelected.hash)
        );

        for (const possiblePlugSet of possiblePlugSets) {
          if (possiblePlugSet.selected.length < possiblePlugSet.maxSelectable) {
            possiblePlugSet.selected.push(initiallySelected);
            break;
          }
        }
      }

      return plugSets;
    }
  );
  return (state: RootState, props: ProvidedProps): StoreProps => ({
    plugSets: unlockedPlugSetsSelector(state, props),
  });
}

/**
 * A sheet to pick armor mods to be included in a loadout. This allows picking
 * multiple mods before accepting the choice, and tries to show when you've
 * chosen too many mods. It also can be filtered down to a specific set of mods
 * using plugCategoryHashWhitelist.
 */
function ModPicker({ plugSets, lockedMods, initialQuery, onAccept, onClose }: Props) {
  // Partition the locked (selected) mods into ones that will be shown in this
  // picker (based on plugCategoryHashWhitelist) and ones that will not. The
  // ones that won't (hidden mods) are still part of the locked mods set and
  // shouldn't be wiped out when the selection of visible mods changes!
  const [_visibleSelectedMods, hiddenSelectedMods] = useMemo(
    () =>
      _.partition(lockedMods, (mod) =>
        plugSets.some((plugSet) => plugSet.plugs.some((plug) => plug.hash === mod.hash))
      ),
    [lockedMods, plugSets]
  );

  const onAcceptWithHiddenSelectedMods = useCallback(
    (newLockedMods: PluggableInventoryItemDefinition[]) => {
      // Put back the mods that were filtered out of the display
      onAccept([...hiddenSelectedMods, ...newLockedMods]);
    },
    [hiddenSelectedMods, onAccept]
  );

  // Ensure the plug drawer is reset when selecting a different
  // set of plugSets so that it shows the correct mods and chooses
  // a correct height for the sheet.
  const plugSetsKey = plugSets
    .map((p) => p.plugSetHash)
    .sort()
    .toString();

  return (
    <PlugDrawer
      key={plugSetsKey}
      title={t('LB.ChooseAMod')}
      searchPlaceholder={t('LB.SearchAMod')}
      acceptButtonText={t('LB.SelectMods')}
      initialQuery={initialQuery}
      plugSets={plugSets}
      isPlugSelectable={isModSelectable}
      sortPlugGroups={sortModPickerPlugGroups}
      sortPlugs={sortMods}
      onAccept={onAcceptWithHiddenSelectedMods}
      onClose={onClose}
    />
  );
}

export default connect<StoreProps, {}, ProvidedProps>(mapStateToProps)(ModPicker);

/**
 * Determine whether an armor mod can still be selected, given that the `selected` mods have already been selected.
 * This doesn't take into account the actual armor that's in the loadout and what slots it has.
 */
function isModSelectable(
  mod: PluggableInventoryItemDefinition,
  selected: PluggableInventoryItemDefinition[]
) {
  const { plugCategoryHash, energyCost } = mod.plug;
  const isSlotSpecificCategory = slotSpecificPlugCategoryHashes.includes(plugCategoryHash);

  // Already selected mods that are in the same category as "mod"
  let associatedLockedMods: PluggableInventoryItemDefinition[] = [];

  if (isSlotSpecificCategory || plugCategoryHash === armor2PlugCategoryHashesByName.general) {
    // General and slot-specific mods just match to the same category hash
    associatedLockedMods = selected.filter((mod) => mod.plug.plugCategoryHash === plugCategoryHash);
  } else if (activityModPlugCategoryHashes.includes(plugCategoryHash)) {
    // Activity mods match to any other activity mod, since a single armor piece can only have one activity mod slot
    associatedLockedMods = selected.filter((mod) =>
      activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
    );
  } else {
    // This is some unknown/unmapped mod slot, match all other unknown mod slots
    associatedLockedMods = selected.filter(
      (mod) => !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
    );
  }

  // Slot-specific mods (e.g. chest mods) can slot 2 per piece, so make sure the sum of energy doesn't
  // exceed the maximum and that energy all aligns. This doesn't check other mods that could be on the
  // item because we haven't assigned those to specific pieces.
  // TODO: This also doesn't check whether we add 5 1-cost chest mods?
  if (isSlotSpecificCategory) {
    const lockedModCost = isSlotSpecificCategory
      ? _.sumBy(associatedLockedMods, (mod) => mod.plug.energyCost?.energyCost || 0)
      : 0;

    // Traction has no energy type so it's basically Any energy and 0 cost
    const modCost = energyCost?.energyCost || 0;
    const modEnergyType = energyCost?.energyType || DestinyEnergyType.Any;

    return (
      lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY &&
      (modEnergyType === DestinyEnergyType.Any || // Any energy works with everything
        associatedLockedMods.every(
          (l) =>
            // Matches energy
            l.plug.energyCost?.energyType === modEnergyType ||
            // or Any energy
            (l.plug.energyCost?.energyType ?? DestinyEnergyType.Any) === DestinyEnergyType.Any
        ))
    );
  } else {
    // Just check that we haven't locked too many
    return associatedLockedMods.length < MAX_SLOT_INDEPENDENT_MODS;
  }
}
