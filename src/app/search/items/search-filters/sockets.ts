import { tl } from 'app/i18next-t';
import { enhancementSocketHash } from 'app/inventory/store/crafted';
import {
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
} from 'app/search/d2-known-values';
import { plainString } from 'app/search/text-utils';
import {
  braveShiny,
  getInterestingSocketMetadatas,
  getSpecialtySocketMetadatas,
  modSlotTags,
  riteShiny,
} from 'app/utils/item-utils';
import {
  countEnhancedPerks,
  getIntrinsicArmorPerkSocket,
  getSocketsByCategoryHash,
  getSocketsByType,
  matchesCuratedRoll,
} from 'app/utils/socket-utils';
import { StringLookup } from 'app/utils/util-types';
import { DestinyItemSubType, DestinyRecordState } from 'bungie-api-ts/destiny2';
import adeptWeaponHashes from 'data/d2/adept-weapon-hashes.json';
import craftingMementos from 'data/d2/crafting-mementos.json';
import {
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import { ItemFilterDefinition } from '../item-filter-types';
import { patternIsUnlocked } from './known-values';

export const modslotFilter = {
  keywords: 'modslot',
  description: tl('Filter.ModSlot'),
  format: 'query',
  suggestions: modSlotTags.concat(['any', 'none', 'activity']),
  destinyVersion: 2,
  filter:
    ({ filterValue }) =>
    (item) => {
      const metadatas =
        filterValue === 'activity'
          ? getInterestingSocketMetadatas(item)
          : getSpecialtySocketMetadatas(item);

      const modSocketTags = metadatas?.map((m) => m.slotTag);

      return (
        (filterValue === 'none' && !modSocketTags) ||
        (modSocketTags &&
          (filterValue === 'any' ||
            filterValue === 'activity' ||
            modSocketTags.includes(filterValue)))
      );
    },
  fromItem: (item) => {
    const modSocketTags =
      getInterestingSocketMetadatas(item)?.map((m) => `modslot:${m.slotTag}`) ?? [];
    return modSocketTags.join(' ');
  },
} satisfies ItemFilterDefinition;

const socketFilters: ItemFilterDefinition[] = [
  modslotFilter,
  {
    keywords: 'randomroll',
    description: tl('Filter.RandomRoll'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(item.bucket.inArmor && item.energy) ||
      (!item.crafted &&
        item.sockets?.allSockets.some(
          (s) => s.isPerk && s.plugOptions.length > 0 && s.hasRandomizedPlugItems,
        )),
  },
  {
    keywords: 'curated',
    description: tl('Filter.Curated'),
    destinyVersion: 2,
    filter:
      ({ d2Definitions }) =>
      (item) =>
        matchesCuratedRoll(d2Definitions!, item),
  },
  {
    keywords: 'shiny',
    description: tl('Filter.Shiny'),
    destinyVersion: 2,
    filter: () => (i) => {
      if (i.bucket.inWeapons) {
        if (braveShiny(i) || riteShiny(i)) {
          return true;
        }

        // There are special Heresy weapons with an extra Origin Trait
        const plugOptions = getSocketsByType(i, 'origin')[0]?.plugOptions;
        if (
          plugOptions &&
          plugOptions.length === 2 &&
          plugOptions[0].plugDef.hash === 878237828 && // Willing Vessel
          plugOptions[1].plugDef.hash === 120721526 // Runneth Over
        ) {
          return true;
        }
      }

      return false;
    },
  },
  {
    keywords: 'extraperk',
    description: tl('Filter.ExtraPerk'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!(item.bucket?.sort === 'Weapons' && item.rarity === 'Legendary')) {
        return false;
      }

      return getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.WeaponPerks_Reusable)
        .filter(
          (socket) =>
            socket.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Frames &&
            socket.hasRandomizedPlugItems,
        )
        .some((socket) => socket.plugOptions.length > 1);
    },
  },
  {
    keywords: ['shaded', 'hasshader'],
    description: tl('Filter.HasShader'),
    destinyVersion: 2,
    filter: () => (item) =>
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            socket.plugged.plugDef.itemSubType === DestinyItemSubType.Shader &&
            socket.plugged.plugDef.hash !== DEFAULT_SHADER,
        ),
      ),
  },
  {
    keywords: ['ornamented', 'hasornament'],
    description: tl('Filter.HasOrnament'),
    destinyVersion: 2,
    filter: () => (item) =>
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            (socket.plugged.plugDef.itemSubType === DestinyItemSubType.Ornament ||
              socket.plugged.plugDef.plug.plugCategoryIdentifier.match(
                /armor_skins_(titan|warlock|hunter)_(head|arms|chest|legs|class)/,
              )) &&
            socket.plugged.plugDef.hash !== DEFAULT_GLOW &&
            !DEFAULT_ORNAMENTS.includes(socket.plugged.plugDef.hash) &&
            !socket.plugged.plugDef.itemCategoryHashes?.includes(
              ItemCategoryHashes.ArmorModsGlowEffects,
            ),
        ),
      ),
  },
  {
    keywords: 'hasdisabledmod',
    description: tl('Filter.DisabledModSlot'),
    destinyVersion: 2,

    filter: () => (item) =>
      !item.itemCategoryHashes.includes(ItemCategoryHashes.Subclasses) &&
      item.sockets?.allSockets.some((socket) =>
        Boolean(socket.plugged && socket.visibleInGame && !socket.plugged.enabled),
      ),
  },
  {
    keywords: 'modded',
    description: tl('Filter.Mods.Y3'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(item.energy) &&
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            !emptySocketHashes.includes(socket.plugged.plugDef.hash) &&
            socket.plugged.plugDef.plug?.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/,
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plugged.plugDef.perks.length,
        ),
      ),
  },
  {
    keywords: 'armorintrinsic',
    format: ['simple', 'query'],
    suggestions: ['none'],
    description: tl('Filter.ArmorIntrinsic'),
    destinyVersion: 2,
    filter: ({ filterValue, language }) => {
      if (filterValue === 'armorintrinsic') {
        return (item) => Boolean(!item.isExotic && getIntrinsicArmorPerkSocket(item));
      }
      if (filterValue === 'none') {
        return (item) =>
          Boolean(!item.isExotic && item.bucket.inArmor && !getIntrinsicArmorPerkSocket(item));
      }
      return (item) => {
        const intrinsic =
          getIntrinsicArmorPerkSocket(item)?.plugged?.plugDef.displayProperties.name;
        return Boolean(intrinsic && plainString(intrinsic, language).includes(filterValue));
      };
    },
  },
  {
    keywords: 'deepsight',
    description: tl('Filter.Deepsight'),
    format: ['simple', 'query'],
    suggestions: ['harmonizable', 'extractable'],
    destinyVersion: 2,
    filter:
      ({ filterValue }) =>
      (item) =>
        !patternIsUnlocked(item) &&
        (filterValue === 'harmonizable'
          ? // is:harmonizable checks for an "insert harmonizer" socket
            Boolean(
              item.sockets?.allSockets.some(
                (s) =>
                  s.plugged?.plugDef.plug.plugCategoryHash ===
                    PlugCategoryHashes.CraftingPlugsWeaponsModsExtractors && s.visibleInGame,
              ),
            )
          : // is:extractable checks for red-borderness
            Boolean(
              item.deepsightInfo &&
                item.patternUnlockRecord &&
                item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted,
            )),
  },
  {
    keywords: 'memento',
    description: tl('Filter.Memento'),
    format: 'query',
    destinyVersion: 2,
    suggestions: ['any', 'none', ...Object.keys(craftingMementos)],
    filter: ({ filterValue }) => {
      const list = (craftingMementos as StringLookup<number[]>)[filterValue];
      return (item) =>
        item.sockets?.allSockets.some(
          (s) =>
            (s.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos &&
              (filterValue === 'any' || list?.includes(s.plugged.plugDef.hash))) ||
            // Crafted items with no memento
            (filterValue === 'none' &&
              item.crafted &&
              s.plugged?.plugDef.plug.plugCategoryHash ===
                PlugCategoryHashes.CraftingRecipesEmptySocket),
        );
    },
  },
  {
    keywords: 'catalyst',
    description: tl('Filter.Catalyst'),
    format: 'query',
    destinyVersion: 2,
    suggestions: ['complete', 'incomplete', 'missing'],
    filter:
      ({ filterValue }) =>
      (item) => {
        if (!item.catalystInfo) {
          return false;
        }

        switch (filterValue) {
          case 'missing':
            return !item.catalystInfo.unlocked;
          case 'complete':
            return item.catalystInfo.complete;
          case 'incomplete':
            return item.catalystInfo.unlocked && !item.catalystInfo.complete;
          default:
            return false;
        }
      },
  },
  {
    keywords: 'enhancedperk',
    description: tl('Filter.EnhancedPerk'),
    format: ['simple', 'range'],
    destinyVersion: 2,
    filter: ({ lhs, compare }) => {
      if (compare) {
        return (item) => item.sockets && compare(countEnhancedPerks(item.sockets));
      }
      if (lhs === 'is') {
        return (item) => item.sockets && countEnhancedPerks(item.sockets) > 0;
      }
      return (_item) => false;
    },
  },
  {
    keywords: 'enhanceable',
    description: tl('Filter.Enhanceable'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(
        (item.craftedInfo?.enhancementTier || 0) < 3 &&
          item.sockets?.allSockets.some(
            (s) =>
              s.plugged?.plugDef.plug.plugCategoryHash ===
              PlugCategoryHashes.CraftingPlugsWeaponsModsEnhancers,
          ),
      ),
  },
  {
    keywords: 'enhanced',
    description: tl('Filter.Enhanced'),
    destinyVersion: 2,
    format: ['simple', 'range'],
    filter: ({ lhs, compare }) => {
      if (compare) {
        return (item) => compare(item.craftedInfo?.enhancementTier || 0);
      }
      if (lhs === 'is') {
        return (item) =>
          item.crafted === 'enhanced' && (item.craftedInfo?.enhancementTier || 0) > 0;
      }
      // shouldn't ever get here but need the default case
      return (_item) => false;
    },
  },
  {
    keywords: 'enhancementready',
    description: tl('Filter.EnhancementReady'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!item.crafted || !item.craftedInfo) {
        return false;
      }
      if (item.crafted === 'enhanced') {
        return item.sockets?.allSockets
          .find((s) => s.socketDefinition.socketTypeHash === enhancementSocketHash)
          ?.reusablePlugItems?.some((p) => p.canInsert);
      }
      if (item.crafted === 'crafted') {
        return item.sockets?.allSockets.some((s) => {
          const enhancedPerk = perkToEnhanced[s.plugged?.plugDef.hash || 0] || 0;
          return (
            enhancedPerk &&
            s.plugSet?.plugHashesThatCanRoll.includes(enhancedPerk) &&
            s.plugSet?.craftingData &&
            (s.plugSet?.craftingData?.[enhancedPerk]?.requiredLevel || 0) <=
              (item.craftedInfo?.level || 0)
          );
        });
      }
      return false;
    },
  },
  {
    keywords: 'retiredperk',
    description: tl('Filter.RetiredPerk'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!(item.bucket?.sort === 'Weapons' && item.rarity === 'Legendary')) {
        return false;
      }

      return getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.WeaponPerks_Reusable).some(
        (socket) => socket.plugOptions.some((p) => p.cannotCurrentlyRoll),
      );
    },
  },
  {
    keywords: 'adept',
    description: tl('Filter.IsAdept'),
    destinyVersion: 2,
    filter: () => (item) => adeptWeaponHashes.includes(item.hash),
  },
  {
    keywords: 'origintrait',
    description: tl('Filter.OriginTrait'),
    destinyVersion: 2,
    filter: () => (item) =>
      item.sockets?.allSockets.some((s) =>
        s.plugged?.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsOriginTraits),
      ),
  },
];

export default socketFilters;
