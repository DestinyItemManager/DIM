import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  currentStoreSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { itemsForCharacterOrProfilePlugSet } from 'app/records/plugset-helpers';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { isLoadoutBuilderItem } from './item-utils';
import { knownModPlugCategoryHashes, slotSpecificPlugCategoryHashes } from './known-values';
import { isInsertableArmor2Mod, sortModGroups, sortMods } from './mod-utils';
import PlugDrawer from './plug-drawer/PlugDrawer';
import { PlugSet } from './plug-drawer/PlugSection';

/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

const sortModPickerPlugGroups = (a: PlugSet, b: PlugSet) => sortModGroups(a.plugs, b.plugs);

interface ProvidedProps {
  /**
   * An array of mods that are already locked.
   */
  lockedMods: PluggableInventoryItemDefinition[];
  /**
   * The character we'll show unlocked mods for.
   */
  classType?: DestinyClass;
  /**
   * The store ID that we're picking mods for. Used to restrict mods to those unlocked by that store.
   */
  owner?: string;
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
  plugSets: PlugSet[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedPlugSetsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    d2ManifestSelector,
    (_state: RootState, props: ProvidedProps) => props.classType,
    (_state: RootState, props: ProvidedProps) => props.owner,
    (_state: RootState, props: ProvidedProps) => props.plugCategoryHashWhitelist,
    currentStoreSelector,
    (
      profileResponse,
      allItems,
      defs,
      classType,
      owner,
      plugCategoryHashWhitelist,
      currentStore
    ): PlugSet[] => {
      const artificeString = defs?.InventoryItem.get(3727270518).displayProperties.name;

      const plugSets: { [plugSetHash: number]: PlugSet } = {};
      if (!profileResponse || !defs) {
        return [];
      }

      for (const item of allItems) {
        if (
          !item ||
          !item.sockets ||
          // Makes sure it's an armour 2.0 item
          !isLoadoutBuilderItem(item) ||
          // If classType is passed in, only use items from said class,
          // otherwise use items from all characters.
          // Useful if in loadouts and only mods and guns
          !(classType === DestinyClass.Unknown || item.classType === classType)
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

        for (const [hashAsString, sockets] of Object.entries(socketsGroupedByPlugSetHash)) {
          const plugSetHash = parseInt(hashAsString, 10);
          const plugsWithDuplicates: PluggableInventoryItemDefinition[] = [];

          const plugSetItems = itemsForCharacterOrProfilePlugSet(
            profileResponse,
            plugSetHash,
            // TODO: For vaulted items, union all the unlocks and then be smart about picking the right store
            owner ?? currentStore!.id
          );

          // Get the item plugs actually available to the profile
          for (const itemPlug of plugSetItems) {
            const plugDef = defs.InventoryItem.get(itemPlug.plugItemHash);
            if (
              isInsertableArmor2Mod(plugDef) &&
              (!plugCategoryHashWhitelist ||
                plugCategoryHashWhitelist?.includes(plugDef.plug.plugCategoryHash))
            ) {
              plugsWithDuplicates.push(plugDef);
            }
          }

          const plugs = _.uniqBy(plugsWithDuplicates, (plug) => plug.hash);

          // Combat, general and raid mods are restricted across items so we need to manually
          // set the max selectable
          const maxSelectable = plugs.some((p) =>
            slotSpecificPlugCategoryHashes.includes(p.plug.plugCategoryHash)
          )
            ? sockets.length
            : MAX_SLOT_INDEPENDENT_MODS;

          if (plugs.length && !plugSets[plugSetHash]) {
            plugSets[plugSetHash] = {
              plugSetHash,
              maxSelectable,
              selectionType: 'multi',
              plugs,
            };
            if (
              maxSelectable === 1 &&
              armor2PlugCategoryHashes.includes(plugs[0].plug.plugCategoryHash)
            ) {
              plugSets[plugSetHash].headerSuffix = artificeString;
            }
          } else if (plugs.length && plugSets[plugSetHash].maxSelectable < sockets.length) {
            plugSets[plugSetHash].maxSelectable = sockets.length;
          }
        }
      }
      return Object.values(plugSets);
    }
  );
  return (state: RootState, props: ProvidedProps): StoreProps => ({
    language: languageSelector(state),
    plugSets: unlockedPlugSetsSelector(state, props),
  });
}

/**
 * A sheet to pick mods that are required in the final loadout sets.
 */
function ModPicker({
  plugSets,
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
        // Traction has no energy type so it's basically Any energy and 0 cost
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

  const [visibleSelectedMods, hiddenSelectedMods] = useMemo(
    () =>
      _.partition(lockedMods, (mod) =>
        plugSets.some((plugSet) => plugSet.plugs.some((plug) => plug.hash === mod.hash))
      ),
    [lockedMods, plugSets]
  );

  const onAcceptWithHiddenSelectedMods = useCallback(
    (newLockedMods: PluggableInventoryItemDefinition[]) => {
      onAccept([...hiddenSelectedMods, ...newLockedMods]);
    },
    [hiddenSelectedMods, onAccept]
  );

  return (
    <PlugDrawer
      title={t('LB.ChooseAMod')}
      searchPlaceholder={t('LB.SearchAMod')}
      acceptButtonText={t('LB.SelectMods')}
      language={language}
      initialQuery={initialQuery}
      plugSets={plugSets}
      initiallySelected={visibleSelectedMods}
      minHeight={minHeight}
      isPlugSelectable={isModSelectable}
      sortPlugGroups={sortModPickerPlugGroups}
      sortPlugs={sortMods}
      onAccept={onAcceptWithHiddenSelectedMods}
      onClose={onClose}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
