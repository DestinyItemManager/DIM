import { t, tl } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { ResolvedLoadoutMod } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { unlockedItemsForCharacterOrProfilePlugSet } from 'app/records/plugset-helpers';
import { count, sumBy, uniqBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { isClassCompatible, modMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import unstackableModHashes from 'data/d2/unstackable-mods.json';
import { produce } from 'immer';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  activityModPlugCategoryHashes,
  knownModPlugCategoryHashes,
  slotSpecificPlugCategoryHashes,
} from './known-values';
import { isLoadoutBuilderItem } from './loadout-item-utils';
import { getModExclusionGroup, isInsertableArmor2Mod, sortModGroups } from './mod-utils';
import PlugDrawer from './plug-drawer/PlugDrawer';
import { PlugSelectionType, PlugSet } from './plug-drawer/types';

/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

const sortModPickerPlugGroups = (a: PlugSet, b: PlugSet) => sortModGroups(a.plugs, b.plugs);

function useUnlockedPlugSets(
  classType: DestinyClass,
  owner: string,
  plugCategoryHashWhitelist: number[] | undefined,
  plugCategoryHashDenyList: number[] | undefined,
  lockedMods: readonly ResolvedLoadoutMod[],
) {
  const profileResponse = useSelector(profileResponseSelector);
  const allItems = useSelector(allItemsSelector);
  const defs = useD2Definitions();
  const currentStore = useSelector(currentStoreSelector);

  /**
   * Build up a list of PlugSets used by armor in the user's inventory, and the
   * plug items contained within them, restricted to an optional plugCategoryHashWhitelist and plugCategoryHashDenyList
   */
  const plugSets = useMemo((): PlugSet[] => {
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
        (classType !== undefined && !isClassCompatible(classType, item.classType))
      ) {
        continue;
      }

      // Get all the armor mod sockets we can use for an item. Note that sockets without `plugged`
      // are considered disabled by the API
      const modSockets = getSocketsByCategoryHash(
        item.sockets,
        SocketCategoryHashes.ArmorMods,
      ).filter((socket) => socket.socketDefinition.reusablePlugSetHash && socket.plugged);

      // Group the sockets by their reusablePlugSetHash, this lets us get a count of available mods for
      // each socket in the case of bucket specific mods/sockets
      const socketsGroupedByPlugSetHash = Map.groupBy(
        modSockets,
        (socket) => socket.socketDefinition.reusablePlugSetHash ?? 0,
      );

      // For each of the socket types on the item, figure out what plugs could go into it
      // and the maximum number of those sockets that can appear on a single item.
      for (const [plugSetHash, sockets] of socketsGroupedByPlugSetHash.entries()) {
        const unlockedPlugs = unlockedItemsForCharacterOrProfilePlugSet(
          profileResponse,
          sockets[0].plugSet!.hash,
          // TODO: For vaulted items, union all the unlocks and then be smart about picking the right store
          owner ?? currentStore!.id,
        );

        const isArtificePlugSet = sockets[0].plugSet!.plugs.some(
          (p) => p?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice,
        );

        const dimPlugs = sockets[0].plugSet!.plugs.filter((p) => unlockedPlugs.has(p.plugDef.hash));

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
          slotSpecificPlugCategoryHashes.includes(p.plug.plugCategoryHash),
        )
          ? sockets.length
          : MAX_SLOT_INDEPENDENT_MODS;

        if (plugs.length && !plugSetsByHash[plugSetHash] && !(isArtificePlugSet && usedArtifice)) {
          usedArtifice ||= isArtificePlugSet;

          const isActivityMod = plugs.some(
            (p) =>
              activityModPlugCategoryHashes.includes(p.plug.plugCategoryHash) ||
              p.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice,
          );

          plugSetsByHash[plugSetHash] = {
            plugSetHash,
            maxSelectable,
            selectionType: PlugSelectionType.Multi,
            plugs,
            selected: [],
            overrideSelectedAndMax: isActivityMod
              ? tl('LB.SelectModsCountActivityMods')
              : undefined,
          };

          if (isActivityMod) {
            plugSetsByHash[plugSetHash].getNumSelected = (allSelectedPlugs) =>
              count(
                allSelectedPlugs,
                (mod) =>
                  activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash) ||
                  mod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice,
              );
          } else if (
            !plugs.some((p) => knownModPlugCategoryHashes.includes(p.plug.plugCategoryHash))
          ) {
            plugSetsByHash[plugSetHash].getNumSelected = (allSelectedPlugs) =>
              count(
                allSelectedPlugs,
                (mod) => !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash),
              );
          }

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
        } else if (
          plugs.length &&
          (plugSetsByHash[plugSetHash]?.maxSelectable as number) < sockets.length
        ) {
          plugSetsByHash[plugSetHash].maxSelectable = sockets.length;
        }
      }
    }

    const plugSets = Object.values(plugSetsByHash);

    // However, sort the plugSets so that regular armor plugsets are preferred.
    // Assigning the first artifact mod to the (Artifice Armor) header is confusing
    // when a user doesn't have any artifice armor in the loadouts because the mod
    // assignment might not actually need any artifice sockets.
    plugSets.sort(compareBy((plugSet) => -plugSet.plugs.length));
    return plugSets;
  }, [
    allItems,
    classType,
    currentStore,
    defs,
    owner,
    plugCategoryHashDenyList,
    plugCategoryHashWhitelist,
    profileResponse,
  ]);

  // Make a copy with the selected mods filled in. This way we only reprocess this bit when the lockedMods changes.
  return useMemo((): PlugSet[] => {
    // Order our mods so that we assign the most picky mods first (the mods that have the fewest
    // plugSets containing them). This is necessary for artifact mods in artificer sockets and
    // essentially the same logic that actual mod assignment uses.
    const orderedMods = lockedMods.toSorted(
      compareBy((mod) =>
        count(plugSets, (s) => s.plugs.some((p) => p.hash === mod.resolvedMod.hash)),
      ),
    );

    // Now we populate the plugsets with their corresponding plugs.
    return produce(plugSets, (draft) => {
      for (const initiallySelected of orderedMods) {
        const possiblePlugSets = draft.filter((set) =>
          set.plugs.some((plug) => plug.hash === initiallySelected.resolvedMod.hash),
        );

        for (const possiblePlugSet of possiblePlugSets) {
          if (possiblePlugSet.selected.length < (possiblePlugSet.maxSelectable as number)) {
            possiblePlugSet.selected.push(initiallySelected.resolvedMod);
            break;
          }
        }
      }
    });
  }, [lockedMods, plugSets]);
}

/**
 * A sheet to pick armor mods to be included in a loadout. This allows picking
 * multiple mods before accepting the choice, and tries to show when you've
 * chosen too many mods. It also can be filtered down to a specific set of mods
 * using plugCategoryHashWhitelist.
 */
export default function ModPicker({
  owner,
  classType,
  lockedMods,
  initialQuery,
  plugCategoryHashDenyList,
  plugCategoryHashWhitelist,
  onAccept,
  onClose,
}: {
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
}) {
  const plugSets = useUnlockedPlugSets(
    classType,
    owner,
    plugCategoryHashWhitelist,
    plugCategoryHashDenyList,
    lockedMods,
  );

  const onAcceptWithHiddenSelectedMods = useCallback(
    (newLockedMods: PluggableInventoryItemDefinition[]) => {
      // We may have filtered out some plugsets, which means lockedMods contains
      // mods that weren't shown on this screen. These should be untouched when
      // updating the mods list.
      const hiddenSelectedMods = lockedMods.filter(
        (mod) =>
          !plugSets.some((plugSet) =>
            plugSet.plugs.some((plug) => plug.hash === mod.resolvedMod.hash),
          ),
      );

      onAccept([
        ...hiddenSelectedMods.map((mod) => mod.originalModHash),
        ...newLockedMods.map((mod) => mod.hash),
      ]);
    },
    [lockedMods, onAccept, plugSets],
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

/**
 * Determine whether an armor mod can still be selected, given that the `selected` mods have already been selected.
 * This doesn't take into account the actual armor that's in the loadout and what slots it has.
 * NB Socket count is checked by PlugDrawer based on PlugSet/maxSelectable data
 */
function isModSelectable(
  mod: PluggableInventoryItemDefinition,
  selected: PluggableInventoryItemDefinition[],
) {
  const { plugCategoryHash, energyCost } = mod.plug;
  const isSlotSpecificCategory = slotSpecificPlugCategoryHashes.includes(plugCategoryHash);

  // checks if the selected mod can stack with itself.
  if (selected.includes(mod) && unstackableModHashes.includes(mod.hash)) {
    return false;
  }

  // If there's an already selected mod that excludes this mod, we can't select this one
  const exclusionGroup = getModExclusionGroup(mod);
  if (exclusionGroup && selected.some((mod) => getModExclusionGroup(mod) === exclusionGroup)) {
    return false;
  }

  if (isSlotSpecificCategory) {
    // General and slot-specific mods just match to the same category hash
    const associatedLockedMods = selected.filter(
      (mod) => mod.plug.plugCategoryHash === plugCategoryHash,
    );
    // Slot-specific mods (e.g. chest mods) can slot 3 per piece, so make sure the sum of energy doesn't
    // exceed the maximum and that energy all aligns. This doesn't check other mods that could be on the
    // item because we haven't assigned those to specific pieces.
    const lockedModCost = isSlotSpecificCategory
      ? sumBy(associatedLockedMods, (mod) => mod.plug.energyCost?.energyCost ?? 0)
      : 0;
    const modCost = energyCost?.energyCost || 0;

    // TODO: Edge of Fate: Tier 5 armor can have 11 energy. We'd need to pass
    // that in here somehow.
    return lockedModCost + modCost <= 10;
  }

  return true;
}
