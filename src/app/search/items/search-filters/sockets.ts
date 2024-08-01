import { tl } from 'app/i18next-t';
import {
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
} from 'app/search/d2-known-values';
import { plainString } from 'app/search/text-utils';
import {
  getInterestingSocketMetadatas,
  getSpecialtySocketMetadatas,
  isShiny,
  modSlotTags,
  modTypeTags,
} from 'app/utils/item-utils';
import {
  countEnhancedPerks,
  getIntrinsicArmorPerkSocket,
  getSocketsByCategoryHash,
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
import { ItemFilterDefinition } from '../item-filter-types';

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
    filter: () => isShiny,
  },
  {
    keywords: 'extraperk',
    description: tl('Filter.ExtraPerk'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!(item.bucket?.sort === 'Weapons' && item.tier === 'Legendary')) {
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
    keywords: 'hasmod',
    description: tl('Filter.Mods.Y2'),
    destinyVersion: 2,
    filter: () => (item) =>
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            !emptySocketHashes.includes(socket.plugged.plugDef.hash) &&
            socket.plugged.plugDef.plug?.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/,
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plugged.plugDef.perks.length &&
            // enforce that this doesn't have an energy cost (y3 reusables)
            !socket.plugged.plugDef.plug.energyCost,
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
    keywords: 'holdsmod',
    description: tl('Filter.HoldsMod'),
    format: 'query',
    suggestions: modTypeTags.concat(['any', 'none']),
    destinyVersion: 2,
    filter:
      ({ filterValue }) =>
      (item) => {
        const compatibleModTags = getSpecialtySocketMetadatas(item)?.flatMap(
          (m) => m.compatibleModTags,
        );
        return (
          (filterValue === 'none' && !compatibleModTags) ||
          (compatibleModTags && (filterValue === 'any' || compatibleModTags.includes(filterValue)))
        );
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
        filterValue === 'harmonizable'
          ? Boolean(
              item.sockets?.allSockets.some(
                (s) =>
                  s.plugged?.plugDef.plug.plugCategoryHash ===
                    PlugCategoryHashes.CraftingPlugsWeaponsModsExtractors && s.visibleInGame,
              ),
            )
          : Boolean(
              item.deepsightInfo &&
                item.patternUnlockRecord &&
                item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted,
            ),
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
    format: 'range',
    destinyVersion: 2,
    filter:
      ({ compare }) =>
      (item) =>
        item.sockets && compare!(countEnhancedPerks(item.sockets)),
  },
  {
    keywords: 'enhanceable',
    description: tl('Filter.Enhanceable'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(
        item.sockets?.allSockets.some(
          (s) =>
            s.plugged?.plugDef.plug.plugCategoryHash ===
            PlugCategoryHashes.CraftingPlugsWeaponsModsEnhancers,
        ),
      ),
  },
  {
    // this currently tests for full enhancedness, returning false for partially-enhanced items
    keywords: 'enhanced',
    description: tl('Filter.Enhanced'),
    destinyVersion: 2,
    format: ['simple'], // TO-DO: add 'range' here
    filter:
      ({ lhs }) =>
      (item) => {
        if (lhs === 'is') {
          // rules out partially-enhanced items
          // the game explicitly warns you that partially-enhanced items stop looking masterworked
          return item.crafted === 'enhanced' && item.masterwork;
        }
      },
  },
  {
    keywords: 'retiredperk',
    description: tl('Filter.RetiredPerk'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!(item.bucket?.sort === 'Weapons' && item.tier === 'Legendary')) {
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
];

export default socketFilters;
