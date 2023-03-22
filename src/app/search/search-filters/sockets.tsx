import { tl } from 'app/i18next-t';
import {
  getInterestingSocketMetadatas,
  getSpecialtySocketMetadatas,
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
import craftingMementos from 'data/d2/crafting-mementos.json';
import {
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import {
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
} from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { plainString } from './freeform';

export const modslotFilter: FilterDefinition = {
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
};

const socketFilters: FilterDefinition[] = [
  modslotFilter,
  {
    keywords: 'randomroll',
    description: tl('Filter.RandomRoll'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(item.bucket.inArmor && item.energy) ||
      (!item.crafted &&
        item.sockets?.allSockets.some(
          (s) => s.isPerk && s.plugOptions.length > 0 && s.hasRandomizedPlugItems
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
            socket.hasRandomizedPlugItems
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
            socket.plugged.plugDef.hash !== DEFAULT_SHADER
        )
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
                /armor_skins_(titan|warlock|hunter)_(head|arms|chest|legs|class)/
              )) &&
            socket.plugged.plugDef.hash !== DEFAULT_GLOW &&
            !DEFAULT_ORNAMENTS.includes(socket.plugged.plugDef.hash) &&
            !socket.plugged.plugDef.itemCategoryHashes?.includes(
              ItemCategoryHashes.ArmorModsGlowEffects
            )
        )
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
            socket.plugged.plugDef.plug &&
            socket.plugged.plugDef.plug.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plugged.plugDef.perks.length &&
            // enforce that this doesn't have an energy cost (y3 reusables)
            !socket.plugged.plugDef.plug.energyCost
        )
      ),
  },
  {
    keywords: 'modded',
    description: tl('Filter.Mods.Y3'),
    destinyVersion: 2,
    filter: () => (item) =>
      Boolean(item.energy) &&
      item.sockets &&
      item.sockets.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            !emptySocketHashes.includes(socket.plugged.plugDef.hash) &&
            socket.plugged.plugDef.plug &&
            socket.plugged.plugDef.plug.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plugged.plugDef.perks.length
        )
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
          (m) => m.compatibleModTags
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
    format: 'simple',
    destinyVersion: 2,
    filter: () => (item) => {
      if (!item.deepsightInfo) {
        return false;
      }
      return Boolean(
        item.patternUnlockRecord &&
          item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted
      );
    },
  },
  {
    keywords: 'memento',
    description: tl('Filter.HasMemento'),
    format: 'query',
    destinyVersion: 2,
    suggestions: ['any', ...Object.keys(craftingMementos)],
    filter: ({ filterValue }) => {
      const list = (craftingMementos as StringLookup<number[]>)[filterValue];
      return (item) =>
        item.sockets?.allSockets.some(
          (s) =>
            s.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos &&
            (filterValue === 'any' || list?.includes(s.plugged.plugDef.hash))
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
    keywords: 'retiredperk',
    description: tl('Filter.RetiredPerk'),
    destinyVersion: 2,
    filter: () => (item) => {
      if (!(item.bucket?.sort === 'Weapons' && item.tier === 'Legendary')) {
        return false;
      }

      return getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.WeaponPerks_Reusable).some(
        (socket) => socket.plugOptions.some((p) => p.cannotCurrentlyRoll)
      );
    },
  },
];

export default socketFilters;
