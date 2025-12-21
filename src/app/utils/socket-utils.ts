import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DimItem,
  DimPlug,
  DimSocket,
  DimSocketCategory,
  DimSockets,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { craftedSocketCategoryHash, mementoSocketCategoryHash } from 'app/inventory/store/crafted';
import { isDeepsightResonanceSocket } from 'app/inventory/store/deepsight';
import {
  D2PlugCategoryByStatHash,
  GhostActivitySocketTypeHashes,
  armor2PlugCategoryHashes,
  weaponComponentPCHs,
  weaponMasterworkY2SocketTypeHash,
} from 'app/search/d2-known-values';
import {
  DestinyInventoryItemDefinition,
  DestinySocketCategoryStyle,
  TierType,
} from 'bungie-api-ts/destiny2';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import {
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
import { count, filterMap } from './collections';
import { isKillTrackerSocket } from './item-utils';

type WithRequiredProperty<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

function getSocketHashesByCategoryStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle,
): number[] {
  const socketCategory = sockets.categories.find(
    (category) => category.category.categoryStyle === style,
  );

  return (socketCategory && getPlugHashesFromCategory(sockets, socketCategory)) || [];
}

function getPlugHashesFromCategory(sockets: DimSockets, category: DimSocketCategory) {
  return getSocketsByIndexes(sockets, category.socketIndexes)
    .map((socket) => socket.plugged?.plugDef.hash ?? NaN)
    .filter((val) => !isNaN(val));
}

export function getSocketsWithStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle,
): DimSocket[] {
  const socketHashes = getSocketHashesByCategoryStyle(sockets, style);
  return sockets.allSockets.filter(
    (socket) => socket.plugged && socketHashes.includes(socket.plugged.plugDef.hash),
  );
}

/** Is this socket a weapon's masterwork socket */
export function isWeaponMasterworkSocket(socket: DimSocket) {
  return (
    socket.plugged?.plugDef.plug &&
    (socket.plugged.plugDef.plug.uiPlugLabel === 'masterwork' ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.includes('masterworks.stat') ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.endsWith('_masterwork'))
  );
}

/** Given an item and a list of socketIndexes, find all the sockets that match those indices, in the order the indexes were provided */
export function getSocketsByIndexes(sockets: DimSockets, socketIndexes: number[]) {
  return filterMap(socketIndexes, (i) => getSocketByIndex(sockets, i));
}

/** Given a socketIndex, find the socket that matches that index */
export function getSocketByIndex(sockets: DimSockets, socketIndex: number) {
  return sockets.allSockets.find((s) => s.socketIndex === socketIndex);
}

/** Find all sockets on the item that belong to the given category hash */
export function getSocketsByCategoryHash(
  sockets: DimSockets | null,
  categoryHash: SocketCategoryHashes,
) {
  const category = sockets?.categories.find((c) => c.category.hash === categoryHash);
  if (!category || !sockets) {
    return [];
  }
  return getSocketsByIndexes(sockets, category.socketIndexes);
}

/** Find all sockets on the item that belong to the given category hash */
export function getSocketsByCategoryHashes(
  sockets: DimSockets | null,
  categoryHashes: SocketCategoryHashes[],
) {
  return categoryHashes.flatMap((categoryHash) => getSocketsByCategoryHash(sockets, categoryHash));
}

/** Special case of getSocketsByCategoryHash that returns the first (presumably only) socket that matches the category hash */
export function getFirstSocketByCategoryHash(sockets: DimSockets, categoryHash: number) {
  const category = sockets?.categories.find((c) => c.category.hash === categoryHash);
  if (!category) {
    return undefined;
  }
  const socketIndex = category.socketIndexes[0];
  return sockets.allSockets.find((s) => s.socketIndex === socketIndex);
}

function getSocketsByPlugCategoryIdentifier(sockets: DimSockets, plugCategoryIdentifier: string) {
  return sockets.allSockets.find((socket) =>
    socket.plugged?.plugDef.plug.plugCategoryIdentifier.includes(plugCategoryIdentifier),
  );
}

export function getWeaponArchetypeSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.IntrinsicTraits);
  }
}

export const getWeaponArchetype = (item: DimItem): PluggableInventoryItemDefinition | undefined =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;

export function getIntrinsicArmorPerkSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inArmor && item.sockets) {
    const largePerkCategory = item.sockets.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.ArmorPerks_LargePerk,
    );
    if (largePerkCategory) {
      const largePerkSocket = getSocketByIndex(
        item.sockets,
        largePerkCategory.socketIndexes.at(-1)!,
      );
      if (largePerkSocket?.plugged?.plugDef.displayProperties.name) {
        return largePerkSocket;
      }
    }
    return getSocketsByPlugCategoryIdentifier(item.sockets, 'enhancements.exotic');
  }
}

export function getArmorArchetype(item: DimItem) {
  return getArmorArchetypeSocket(item)?.plugged?.plugDef;
}
export function getArmorArchetypeSocket(item: DimItem): DimSocket | undefined {
  return item.sockets?.allSockets.find((s) => isArmorArchetypeSocket(s));
}

function isArmorArchetypeSocket(socket: DimSocket) {
  return isArmorArchetypePlug(socket.plugged);
}

export function isArmorArchetypePlug(plug: DimPlug | DestinyInventoryItemDefinition | null) {
  const plugDef = plug && 'plugDef' in plug ? plug.plugDef : plug;
  return Boolean(
    plugDef?.plug?.plugCategoryHash === PlugCategoryHashes.ArmorArchetypes &&
    plugDef.displayProperties.name,
  );
}

/**
 * returns sockets that contains intrinsic perks even if those sockets are not
 * the "Intrinsic" socket. This handles the exotic class items that were added
 * in The Final Shape. Note that items with a normal intrinsic perk (so far)
 * won't have anything here, while exotic class items (so far) don't have a
 * normal intrinsic.
 */
export function getExtraIntrinsicPerkSockets(item: DimItem): DimSocket[] {
  if (!item.sockets) {
    return [];
  }
  return [
    ...(item.isExotic && item.bucket.hash === BucketHashes.ClassArmor
      ? item.sockets.allSockets
          .filter((s) => s.isPerk && s.visibleInGame && socketContainsIntrinsicPlug(s))
          // exotic class item intrinsics need to set isReusable false to avoid showing as selectable
          .map((s) => ({ ...s, isReusable: false }))
      : []),
  ];
}

export function socketContainsPlugWithCategory(
  socket: DimSocket,
  category: PlugCategoryHashes,
): socket is WithRequiredProperty<DimSocket, 'plugged'> {
  // the above type predicate removes the need to null-check `plugged` after this call
  return socket.plugged?.plugDef.plug.plugCategoryHash === category;
}

/**
 * the "intrinsic" plug type is:
 * - weapon frames
 * - exotic weapon archetypes
 * - exotic armor special effect plugs
 * - the special invisible plugs that contribute to armor 2.0 stat rolls
 */
export function socketContainsIntrinsicPlug(
  socket: DimSocket,
): socket is WithRequiredProperty<DimSocket, 'plugged'> {
  // the above type predicate removes the need to null-check `plugged` after this call
  return (
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.Intrinsics) ||
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.ArmorStats)
  );
}

/**
 * Is this one of the plugs that could possibly fit into this socket? This does not
 * check whether the plug is enabled or unlocked - only that it appears in the list of
 * possible plugs.
 */
export function plugFitsIntoSocket(socket: DimSocket, plugHash: number) {
  return (
    socket.emptyPlugItemHash === plugHash ||
    socket.plugSet?.plugs.some((dimPlug) => dimPlug.plugDef.hash === plugHash) ||
    // TODO(#7793): This should use reusablePlugItems on the socket def
    // because the check should operate on static definitions. This is still
    // incorrect for quite a few blue-quality items because DIM throws away the data.
    socket.reusablePlugItems?.some((p) => p.plugItemHash === plugHash)
  );
}

/**
 * Abilities and supers are "choice sockets", there might be a default
 * but it's not really a meaningful empty or reset option.
 * Still, this can be a useful to initialize user selections.
 */
export function getDefaultAbilityChoiceHash(socket: DimSocket) {
  const { singleInitialItemHash } = socket.socketDefinition;
  return singleInitialItemHash
    ? singleInitialItemHash
    : // Some sockets like Void 3.0 grenades don't have a singleInitialItemHash
      socket.plugSet!.plugs[0].plugDef.hash;
}

export const eventArmorRerollSocketIdentifiers: string[] = ['events.solstice.'];

/**
 * With Solstice 2022, event armor has a ton of sockets for stat rerolling
 * and they take up a lot of space. No idea if this system will be around for
 * other armor but if it does, just add to this function.
 */
export function isEventArmorRerollSocket(socket: DimSocket) {
  return eventArmorRerollSocketIdentifiers.some((i) =>
    socket.plugged?.plugDef.plug.plugCategoryIdentifier.startsWith(i),
  );
}

export function isEnhancedPerk(plugDef: PluggableInventoryItemDefinition) {
  return (
    plugDef.inventory!.tierType === TierType.Common &&
    (plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
      plugDef.plug.plugCategoryHash === PlugCategoryHashes.Origins ||
      weaponComponentPCHs.has(plugDef.plug.plugCategoryHash))
  );
}

export function countEnhancedPerks(sockets: DimSockets) {
  return count(sockets.allSockets, (s) => s.plugged && isEnhancedPerk(s.plugged.plugDef));
}

export const aspectSocketCategoryHashes: SocketCategoryHashes[] = [
  SocketCategoryHashes.Aspects_Abilities_Ikora,
  SocketCategoryHashes.Aspects_Abilities_Neomuna,
  SocketCategoryHashes.Aspects_Abilities_Stranger,
  SocketCategoryHashes.Aspects_Abilities,
];

export const fragmentSocketCategoryHashes: SocketCategoryHashes[] = [
  SocketCategoryHashes.Fragments_Abilities_Ikora,
  SocketCategoryHashes.Fragments_Abilities_Stranger,
  SocketCategoryHashes.Fragments_Abilities_Neomuna,
  SocketCategoryHashes.Fragments_Abilities,
];

export const subclassAbilitySocketCategoryHashes: SocketCategoryHashes[] = [
  SocketCategoryHashes.Abilities_Abilities,
  SocketCategoryHashes.Abilities_Abilities_Ikora,
  SocketCategoryHashes.Super,
];

export function isModCostVisible(plug: PluggableInventoryItemDefinition): boolean {
  return (
    // hide cost if it's less than 1
    (plug.plug.energyCost?.energyCost ?? 0) >= 1 &&
    // subclass stuff is always 1
    !plug.plug.plugCategoryIdentifier.endsWith('.fragments') &&
    !plug.plug.plugCategoryIdentifier.endsWith('.trinkets') &&
    // artifact unlocks happen to have the armor PCHs, but don't have
    // the "armor mod" ICH because they don't go in armor
    !(
      armor2PlugCategoryHashes.includes(plug.plug.plugCategoryHash) &&
      !plug.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)
    )
  );
}

const ARMOR_STAT_CATEGORYSTYLE = 2251952357;

function filterSocketCategories(
  categories: DimSocketCategory[],
  sockets: DimSockets,
  allowCategory: (cat: DimSocketCategory) => boolean,
  allowSocket: (socket: DimSocket) => boolean,
): Map<DimSocketCategory, DimSocket[]> {
  // Pre-calculate the list of sockets we'll display for each category
  const socketsByCategory = new Map<DimSocketCategory, DimSocket[]>();
  for (const category of categories) {
    if (!allowCategory(category)) {
      continue;
    }
    const categorySockets = getSocketsByIndexes(sockets, category.socketIndexes).filter(
      (socketInfo) =>
        (socketInfo.plugged || socketInfo.plugOptions[0])?.plugDef.displayProperties.name &&
        allowSocket(socketInfo),
    );
    if (categorySockets.length) {
      socketsByCategory.set(category, categorySockets);
    }
  }

  return socketsByCategory;
}

/**
 * Should this socket be excluded when we filter out empty sockets?
 * This shows empty catalyst sockets when the weapon has a catalyst
 * because it is useful info...
 */
export function isSocketEmpty(socket: DimSocket) {
  return (
    socket.plugged &&
    (socket.plugged.plugDef.hash === socket.emptyPlugItemHash ||
      emptyPlugHashes.has(socket.plugged?.plugDef.hash)) &&
    socket.plugged.plugDef.plug.plugCategoryHash !== PlugCategoryHashes.V400EmptyExoticMasterwork
  );
}

export interface DisplayedSockets {
  intrinsicSocket?: DimSocket;
  perks?: DimSocketCategory;
  modSocketsByCategory: Map<DimSocketCategory, DimSocket[]>;
}

export function getDisplayedItemSockets(
  item: DimItem,
  excludeEmptySockets = false,
): DisplayedSockets | undefined {
  if (item.bucket.inWeapons) {
    return getWeaponSockets(item, { excludeEmptySockets });
  } else {
    return getGeneralSockets(item, excludeEmptySockets);
  }
}

export function getSocketsByType(
  item: DimItem,
  type?: 'all' | 'traits' | 'cosmetics' | 'origin' | 'mods' | 'perks' | 'components',
): DimSocket[] {
  if (!item.sockets) {
    return [];
  }

  let sockets = [];
  const { modSocketsByCategory, perks } = getDisplayedItemSockets(
    item,
    /* excludeEmptySockets */ true,
  )!;

  if (perks) {
    sockets.push(...getSocketsByIndexes(item.sockets, perks.socketIndexes));
  }
  switch (type) {
    case 'traits':
      sockets = sockets.filter(socketIsTrait);
      break;

    case 'origin':
      sockets = sockets.filter(socketIsOriginTrait);
      break;

    case 'cosmetics': {
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(socketIsCosmetic);
      break;
    }

    case 'mods': {
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(socketIsMod);
      break;
    }

    case 'components': {
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(socketIsWeaponComponent);
      break;
    }

    case 'perks': {
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(socketIsPerk);
      break;
    }

    default: {
      // Improve this when we use iterator-helpers
      sockets.push(...[...modSocketsByCategory.values()].flat());
      sockets = sockets.filter(
        (s) =>
          !(
            s.plugged &&
            (s.plugged?.plugDef.itemCategoryHashes?.includes(
              ItemCategoryHashes.WeaponModsOriginTraits,
            ) ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Shader ||
              s.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos ||
              s.plugged.plugDef.plug.plugCategoryIdentifier.includes('skin'))
          ),
      );
      break;
    }
  }

  sockets = sockets.filter(
    (s) =>
      // we have a separate column for the kill tracker
      !isKillTrackerSocket(s) &&
      // and for the regular weapon masterworks
      s.socketDefinition.socketTypeHash !== weaponMasterworkY2SocketTypeHash &&
      // Remove "extra intrinsics" for exotic class items
      (!item.bucket.inArmor || !(s.isPerk && s.visibleInGame && socketContainsIntrinsicPlug(s))),
  );
  return sockets;
}

export function getWeaponSockets(
  item: DimItem,
  options: {
    excludeEmptySockets?: boolean;
    includeFakeMasterwork?: boolean;
  },
): DisplayedSockets | undefined {
  const { excludeEmptySockets = false, includeFakeMasterwork = false } = options;

  if (!item.sockets) {
    return undefined;
  }

  const archetypeSocket = getWeaponArchetypeSocket(item);
  const perks = item.sockets.categories.find(
    (c) =>
      c.category.hash !== SocketCategoryHashes.IntrinsicTraits &&
      c.socketIndexes.length &&
      getSocketByIndex(item.sockets!, c.socketIndexes[0])?.isPerk,
  );

  const excludedSocketCategoryHashes = [
    craftedSocketCategoryHash,
    !item.crafted && mementoSocketCategoryHash,
  ];

  const excludedPlugCategoryHashes = [
    PlugCategoryHashes.GenericAllVfx,
    PlugCategoryHashes.CraftingPlugsWeaponsModsEnhancers,
    PlugCategoryHashes.CraftingPlugsWeaponsModsExtractors,
    // The weapon level socket is not interesting
    PlugCategoryHashes.CraftingPlugsWeaponsModsTransfusersLevel,
    // Hide catalyst socket for exotics with no known catalyst
    !item.catalystInfo && PlugCategoryHashes.V400EmptyExoticMasterwork,
    PlugCategoryHashes.V300WeaponDamageTypeEnergy,
    PlugCategoryHashes.V300WeaponDamageTypeAttack,
    PlugCategoryHashes.V300WeaponDamageTypeKinetic,
  ];

  let moddedSockets: DimSockets = item.sockets;
  if (includeFakeMasterwork) {
    const allSockets = item.sockets.allSockets.map((socket) => {
      if (socket.socketDefinition.socketTypeHash !== weaponMasterworkY2SocketTypeHash) {
        return socket;
      }
      const mwHash = item.masterworkInfo?.stats?.find((s) => s.isPrimary)?.hash || 0;
      const plugCategory = D2PlugCategoryByStatHash.get(mwHash);
      let fullMasterworkPlug =
        socket.plugSet &&
        plugCategory &&
        maxBy(
          socket.plugSet.plugs.filter((p) => p.plugDef.plug.plugCategoryHash === plugCategory),
          (plugOption) => plugOption.plugDef.investmentStats[0]?.value,
        );
      if (!fullMasterworkPlug) {
        return socket;
      }
      fullMasterworkPlug = {
        ...fullMasterworkPlug,
        plugDef: {
          ...fullMasterworkPlug.plugDef,
          displayProperties: {
            ...fullMasterworkPlug.plugDef.displayProperties,
            iconHash: 0, // use legacy icon so we can remove the '10' on it
          },
          iconWatermark: '', // remove the '10' in the top right of the icon
          investmentStats: [], // remove the stats from the fake plug
        },
      };
      return {
        ...socket,
        plugged: fullMasterworkPlug,
        plugOptions: [fullMasterworkPlug],
        visibleInGame: true,
        reusablePlugItems: [],
        isPerk: true, // isPerk is required to prevent the socket from being selectable/modifiable
      };
    });

    moddedSockets = {
      ...item.sockets,
      allSockets,
    };
  }

  const modSocketsByCategory = filterSocketCategories(
    moddedSockets.categories.toReversed(),
    moddedSockets,
    (category) =>
      !excludedSocketCategoryHashes.includes(category.category.hash) && category !== perks,
    (socket) =>
      (!excludeEmptySockets || !isSocketEmpty(socket)) &&
      socket.plugged !== null &&
      !excludedPlugCategoryHashes.includes(socket.plugged.plugDef.plug.plugCategoryHash) &&
      socket !== archetypeSocket &&
      !isDeepsightResonanceSocket(socket) &&
      // only show memento socket if it isn't empty
      (socket.plugged.plugDef.plug.plugCategoryHash !==
        PlugCategoryHashes.CraftingRecipesEmptySocket ||
        !isSocketEmpty(socket)),
  );

  return {
    intrinsicSocket: archetypeSocket,
    perks,
    modSocketsByCategory,
  };
}

// Sometimes we trust Bungie's advertised socket visibility information
export const trustBungieVisibility = new Set<PlugCategoryHashes | undefined>([
  // Artifice slots the game has marked as not visible (on un-upgraded exotics)
  PlugCategoryHashes.EnhancementsArtifice,
  // Stat tuning mod slots on all Armor 3.0 but only available at Tier 5
  PlugCategoryHashes.CoreGearSystemsArmorTieringPlugsTuningMods,
]);

export function getGeneralSockets(
  item: DimItem,
  excludeEmptySockets = false,
): Omit<DisplayedSockets, 'perks'> | undefined {
  if (!item.sockets) {
    return undefined;
  }

  const intrinsicSocket = getIntrinsicArmorPerkSocket(item);

  const isAllowedCategory = (c: DimSocketCategory) =>
    // hide if this is the energy slot. it's already displayed in ItemDetails
    c.category.categoryStyle !== DestinySocketCategoryStyle.EnergyMeter &&
    // hide if this is the emote wheel because we show it separately
    c.category.hash !== SocketCategoryHashes.Emotes &&
    // Hidden sockets for intrinsic armor stats
    c.category.uiCategoryStyle !== ARMOR_STAT_CATEGORYSTYLE;

  const isAllowedSocket = (socketInfo: DimSocket) =>
    socketInfo.socketIndex !== intrinsicSocket?.socketIndex &&
    (!excludeEmptySockets || !isSocketEmpty(socketInfo)) &&
    // don't include these weird little solstice stat rerolling mechanic sockets
    !isEventArmorRerollSocket(socketInfo) &&
    // never include the "pay for artifice upgrade" slot on exotic armor
    socketInfo.plugged?.plugDef.plug.plugCategoryHash !==
      PlugCategoryHashes.EnhancementsArtificeExotic &&
    // Hide armor masterwork payment socket for armor 2.0 since it's the same as the energy bar for them.
    (item.tier > 0 ||
      !socketInfo.plugged?.plugDef.plug.plugCategoryIdentifier.startsWith(
        'v460.plugs.armor.masterworks',
      )) &&
    !(
      !socketInfo.visibleInGame &&
      trustBungieVisibility.has(socketInfo.plugged?.plugDef.plug.plugCategoryHash)
    ) &&
    // Ghost shells unlock an activity mod slot when masterworked and hide the dummy locked slot
    (item.bucket.hash !== BucketHashes.Ghost ||
      socketInfo.socketDefinition.socketTypeHash !==
        (item.masterwork
          ? GhostActivitySocketTypeHashes.Locked
          : GhostActivitySocketTypeHashes.Unlocked));

  const modSocketsByCategory = filterSocketCategories(
    item.sockets.categories,
    item.sockets,
    isAllowedCategory,
    isAllowedSocket,
  );

  return {
    intrinsicSocket,
    modSocketsByCategory,
  };
}

/**
 * Determine the perk selections that correspond to the "curated" roll for this socket.
 */
function getCuratedRollForSocket(defs: D2ManifestDefinitions, socket: DimSocket) {
  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  const socketDef = socket.socketDefinition;
  let curatedRoll: number[] | null = null;
  if (socket.isPerk) {
    if (socketDef.reusablePlugSetHash) {
      // Get options from plug set, instead of live info
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash);
      if (plugSet) {
        curatedRoll = plugSet.reusablePlugItems.map((p) => p.plugItemHash);
      }
    } else if (socketDef.reusablePlugItems) {
      curatedRoll = socketDef.reusablePlugItems.map((p) => p.plugItemHash);
    }
  }
  return curatedRoll;
}

/** Determine if the item has a curated roll, and if all of its perks match that curated roll. */
export function matchesCuratedRoll(defs: D2ManifestDefinitions, item: DimItem) {
  const legendaryWeapon = item.bucket?.sort === 'Weapons' && item.rarity === 'Legendary';

  if (!legendaryWeapon) {
    return false;
  }

  const matchesCollectionsRoll = item.sockets?.allSockets
    // curatedRoll is only set for perk-style sockets
    .filter((socket) => socket.isPerk && socket.plugOptions.length && !isKillTrackerSocket(socket))
    .map((socket) => ({
      socket,
      curatedRoll: getCuratedRollForSocket(defs, socket),
    }))
    .filter(({ curatedRoll }) => curatedRoll)
    .every(
      ({ socket, curatedRoll }) =>
        curatedRoll!.length === socket.plugOptions.length &&
        socket.plugOptions.every((option, idx) => option.plugDef.hash === curatedRoll![idx]),
    );

  return matchesCollectionsRoll;
}

/** Finds the item's tuning socket if it's enabled. This socket can slightly modify the armor's stats. */
export function getArmor3TuningSocket(item: DimItem): DimSocket | undefined {
  return item.sockets?.allSockets.find(
    (s) =>
      // Ensures the socket is active (Tier 5 armor)
      s.visibleInGame &&
      // Even the "empty slot" placeholder has the right plugCategoryHash
      s.plugged?.plugDef.plug.plugCategoryHash ===
        PlugCategoryHashes.CoreGearSystemsArmorTieringPlugsTuningMods,
  );
}

//
// TODO: Use these functions other places in DIM where sockets are identified.
//

// TODO: This is wrong/insufficient. This would also find "Aggressive Frame." Upstream filtering is the only thing keeping this "correct".
/**
 * Identifies a Trait. Think "Rampage" or "Subsistence".
 */
function socketIsTrait(socket: DimSocket) {
  return (
    socket.plugged &&
    (socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames ||
      socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics)
  );
}

// TODO: Stop trusting itemCategoryHashes
/**
 * Identifies an Origin Trait, introduced in Witch Queen, fixed Traits associated with sets of weapons.
 */
function socketIsOriginTrait(socket: DimSocket) {
  return socket.plugged?.plugDef.itemCategoryHashes?.includes(
    ItemCategoryHashes.WeaponModsOriginTraits,
  );
}

// TODO: Stop trusting itemCategoryHashes
// TODO: This would fail to find Enhanced Impact mod, due to the above, even though it finds other mods.
/**
 * This could be almost anything. It's unclear what this is useful for.
 */
function socketIsPerk(socket: DimSocket) {
  return (
    socket.plugged &&
    socket.isPerk &&
    (socket.plugged.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponMods) ||
      socket.plugged.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods))
  );
}

// TODO: This should also find Combat Flair sockets?
/**
 * This identifies shaders, mementos, and ornaments.
 */
function socketIsCosmetic(socket: DimSocket) {
  return (
    socket.plugged &&
    (socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Shader ||
      socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.includes('skin'))
  );
}

// TODO: Stop trusting itemCategoryHashes
// TODO: This would fail to find Enhanced Impact mod, due to the above, even though it finds other mods.
// TODO: Improve this.
/**
 * Find a square-looking mod on an item.
 * Things like "Mobility Mod" or "Stasis Targeting" or "Backup Mag".
 */
function socketIsMod(socket: DimSocket) {
  return (
    socket.plugged &&
    !socket.isPerk &&
    (socket.plugged.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponMods) ||
      socket.plugged.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) &&
    !(
      socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Shader ||
      socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.includes('skin')
    )
  );
}

/**
 * Check to see if a socket contains a barrel, mag, etc.
 * A plug that contributes to a weapon's stats, but aren't its base stats, traits, or mods.
 */
function socketIsWeaponComponent(socket: DimSocket) {
  return weaponComponentPCHs.has(socket.plugged?.plugDef.plug.plugCategoryHash);
}

/**
 * Gets weapon components, like barrels, mags, etc.
 * Sockets that contribute to a weapon's stats, but aren't its base stats, traits, or mods.
 */
export function getWeaponComponentSockets(item: DimItem) {
  return (item.sockets?.allSockets ?? []).filter(socketIsWeaponComponent);
}
