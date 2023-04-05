import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { ResolvedLoadoutMod } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { unlockedItemsForCharacterOrProfilePlugSet } from 'app/records/plugset-helpers';
import {
  MAX_ARMOR_ENERGY_CAPACITY,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { modMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { uniqBy } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { isLoadoutBuilderItem } from './item-utils';
import {
  activityModPlugCategoryHashes,
  knownModPlugCategoryHashes,
  slotSpecificPlugCategoryHashes,
} from './known-values';
import { isInsertableArmor2Mod, sortModGroups } from './mod-utils';
import PlugDrawer from './plug-drawer/PlugDrawer';
import { PlugSet } from './plug-drawer/types';

/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

const sortModPickerPlugGroups = (a: PlugSet, b: PlugSet) => sortModGroups(a.plugs, b.plugs);

interface ProvidedProps {
  /** An array of mods that are already selected by the user. */
  lockedMods: ResolvedLoadoutMod[];
  /** The character class we'll show unlocked mods for. */
  classType: DestinyClass;
  /**
   * The store ID that we're picking mods for. Used to restrict mods to those unlocked by that store.
   */
  owner: string;
  /** A query string that is passed to the filtering logic to prefilter the available mods. */
  initialQuery?: string;
  /** Only show mods that are in these categories. No restriction if this is not provided. */
  plugCategoryHashWhitelist?: number[];
  /** Never show mods in these categories */
  plugCategoryHashDenyList?: number[];
  /** Called with the complete list of lockedMods when the user accepts the new mod selections. */
  onAccept: (newLockedMods: number[]) => void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose: () => void;
}

interface StoreProps {
  plugSets: PlugSet[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /**
   * Build up a list of PlugSets used by armor in the user's inventory, and the
   * plug items contained within them, restricted to an optional plugCategoryHashWhitelist and plugCategoryHashDenyList
   */
  const unlockedPlugSetsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    d2ManifestSelector,
    (_state: RootState, props: ProvidedProps) => props.classType,
    (_state: RootState, props: ProvidedProps) => props.owner,
    (_state: RootState, props: ProvidedProps) => props.plugCategoryHashWhitelist,
    (_state: RootState, props: ProvidedProps) => props.plugCategoryHashDenyList,
    (_state: RootState, props: ProvidedProps) => props.lockedMods,
    currentStoreSelector,
    (
      profileResponse,
      allItems,
      defs,
      classType,
      owner,
      plugCategoryHashWhitelist,
      plugCategoryHashDenyList,
      lockedMods,
      currentStore
    ): PlugSet[] => {
      const plugSetsByHash: { [plugSetHash: number]: PlugSet } = {};
      if (!profileResponse || !defs) {
        return emptyArray();
      }

      // For some reason there are six identical copies of the artifice plugSet, so
      // let's stop after the first one. It doesn't really matter which particular set we get
      // since the contained mods are the same.
      let usedArtifice = false;

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
          const unlockedPlugs = unlockedItemsForCharacterOrProfilePlugSet(
            profileResponse,
            sockets[0].plugSet!.hash,
            // TODO: For vaulted items, union all the unlocks and then be smart about picking the right store
            owner ?? currentStore!.id
          );

          const isArtificePlugSet = sockets[0].plugSet!.plugs.some(
            (p) => p?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice
          );

          const dimPlugs = sockets[0].plugSet!.plugs.filter((p) =>
            unlockedPlugs.has(p.plugDef.hash)
          );

          // Filter down to plugs that match the plugCategoryHashWhitelist
          const plugsWithDuplicates: PluggableInventoryItemDefinition[] = [];
          for (const dimPlug of dimPlugs) {
            if (
              isInsertableArmor2Mod(dimPlug.plugDef) &&
              (!plugCategoryHashWhitelist ||
                plugCategoryHashWhitelist.includes(dimPlug.plugDef.plug.plugCategoryHash)) &&
              !plugCategoryHashDenyList?.includes(dimPlug.plugDef.plug.plugCategoryHash)
            ) {
              plugsWithDuplicates.push(dimPlug.plugDef);
            }
          }

          // TODO: Why would there be duplicates within a single plugset?
          const plugs = uniqBy(plugsWithDuplicates, (plug) => plug.hash);

          // Combat, general and raid mods are restricted across items so we need to manually
          // set the max selectable
          const maxSelectable = plugs.some((p) =>
            slotSpecificPlugCategoryHashes.includes(p.plug.plugCategoryHash)
          )
            ? sockets.length
            : MAX_SLOT_INDEPENDENT_MODS;

          if (
            plugs.length &&
            !plugSetsByHash[plugSetHash] &&
            !(isArtificePlugSet && usedArtifice)
          ) {
            usedArtifice ||= isArtificePlugSet;
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
          } else if (plugs.length && plugSetsByHash[plugSetHash]?.maxSelectable < sockets.length) {
            plugSetsByHash[plugSetHash].maxSelectable = sockets.length;
          }
        }
      }

      const plugSets = Object.values(plugSetsByHash);

      // Order our mods so that we assign the most picky mods first (the mods that have the fewest
      // plugSets containing them). This is necessary for artifact mods in artificer sockets and
      // essentially the same logic that actual mod assignment uses.
      const orderedMods = _.sortBy(
        lockedMods,
        (mod) => plugSets.filter((s) => s.plugs.some((p) => p.hash === mod.resolvedMod.hash)).length
      );

      // However, sort the plugSets so that regular armor plugsets are preferred.
      // Assigning the first artifact mod to the (Artifice Armor) header is confusing
      // when a user doesn't have any artifice armor in the loadouts because the mod
      // assignment might not actually need any artifice sockets.
      plugSets.sort(compareBy((plugSet) => -plugSet.plugs.length));

      // Now we populate the plugsets with their corresponding plugs.
      for (const initiallySelected of orderedMods) {
        const possiblePlugSets = plugSets.filter((set) =>
          set.plugs.some((plug) => plug.hash === initiallySelected.resolvedMod.hash)
        );

        for (const possiblePlugSet of possiblePlugSets) {
          if (possiblePlugSet.selected.length < possiblePlugSet.maxSelectable) {
            possiblePlugSet.selected.push(initiallySelected.resolvedMod);
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
function ModPicker({ plugSets, classType, lockedMods, initialQuery, onAccept, onClose }: Props) {
  // Partition the locked (selected) mods into ones that will be shown in this
  // picker (based on plugCategoryHashWhitelist) and ones that will not. The
  // ones that won't (hidden mods) are still part of the locked mods set and
  // shouldn't be wiped out when the selection of visible mods changes!
  const [_visibleSelectedMods, hiddenSelectedMods] = useMemo(
    () =>
      _.partition(lockedMods, (mod) =>
        plugSets.some((plugSet) => plugSet.plugs.some((plug) => plug.hash === mod.resolvedMod.hash))
      ),
    [lockedMods, plugSets]
  );

  const onAcceptWithHiddenSelectedMods = useCallback(
    (newLockedMods: PluggableInventoryItemDefinition[]) => {
      // Put back the mods that were filtered out of the display
      onAccept([
        ...hiddenSelectedMods.map((mod) => mod.originalModHash),
        ...newLockedMods.map((mod) => mod.hash),
      ]);
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
      classType={classType}
      isPlugSelectable={isModSelectable}
      sortPlugGroups={sortModPickerPlugGroups}
      onAccept={onAcceptWithHiddenSelectedMods}
      onClose={onClose}
    />
  );
}

export default connect<StoreProps, {}, ProvidedProps, RootState>(mapStateToProps)(ModPicker);

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

  // Slot-specific mods (e.g. chest mods) can slot 3 per piece, so make sure the sum of energy doesn't
  // exceed the maximum and that energy all aligns. This doesn't check other mods that could be on the
  // item because we haven't assigned those to specific pieces.
  // TODO: This also doesn't check whether we add 5 1-cost chest mods?
  if (isSlotSpecificCategory) {
    const lockedModCost = isSlotSpecificCategory
      ? _.sumBy(associatedLockedMods, (mod) => mod.plug.energyCost?.energyCost || 0)
      : 0;
    const modCost = energyCost?.energyCost || 0;

    return lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY;
  } else {
    // Just check that we haven't locked too many
    return associatedLockedMods.length < MAX_SLOT_INDEPENDENT_MODS;
  }
}
