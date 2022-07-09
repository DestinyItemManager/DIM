import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import {
  getInterestingSocketMetadatas,
  getSpecialtySocketMetadatas,
  modSlotTags,
  modTypeTags,
} from 'app/utils/item-utils';
import { countEnhancedPerks, getSocketsByCategoryHash } from 'app/utils/socket-utils';
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
import { rangeStringToComparator } from './range-numeric';

export const modslotFilter: FilterDefinition = {
  keywords: 'modslot',
  description: tl('Filter.ModSlot'),
  format: 'query',
  suggestions: modSlotTags.concat(['any', 'none', 'activity']),
  destinyVersion: 2,
  filter:
    ({ filterValue }) =>
    (item: DimItem) => {
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
    filter: () => (item: DimItem) =>
      Boolean(item.energy) || item.sockets?.allSockets.some((s) => s.hasRandomizedPlugItems),
  },
  {
    keywords: 'curated',
    description: tl('Filter.Curated'),
    destinyVersion: 2,
    filter: () => (item: DimItem) => {
      if (!item) {
        return false;
      }

      const legendaryWeapon =
        item.bucket?.sort === 'Weapons' && item.tier.toLowerCase() === 'legendary';

      if (!legendaryWeapon) {
        return false;
      }

      const matchesCollectionsRoll = item.sockets?.allSockets
        // curatedRoll is only set for perk-style sockets
        .filter((socket) => socket.plugOptions.length && socket.curatedRoll)
        .every(
          (socket) =>
            socket.curatedRoll!.length === socket.plugOptions.length &&
            socket.plugOptions.every(function (e, i) {
              return e.plugDef.hash === socket.curatedRoll![i];
            })
        );

      return matchesCollectionsRoll;
    },
  },
  {
    keywords: 'extraperk',
    description: tl('Filter.ExtraPerk'),
    destinyVersion: 2,
    filter: () => (item: DimItem) => {
      if (!(item.bucket?.sort === 'Weapons' && item.tier.toLowerCase() === 'legendary')) {
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
    filter: () => (item: DimItem) =>
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
    filter: () => (item: DimItem) =>
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
    filter: () => (item: DimItem) =>
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
    filter: () => (item: DimItem) =>
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
    keywords: 'holdsmod',
    description: tl('Filter.HoldsMod'),
    format: 'query',
    suggestions: modTypeTags.concat(['any', 'none']),
    destinyVersion: 2,
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
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
    format: ['simple', 'query'],
    destinyVersion: 2,
    suggestions: ['complete', 'incomplete', 'pattern'],
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
        if (!item.deepsightInfo) {
          return false;
        }

        switch (filterValue) {
          case 'deepsight':
            return true;
          case 'complete':
            return item.deepsightInfo.attunementObjective.complete;
          case 'incomplete':
            return !item.deepsightInfo.attunementObjective.complete;
          case 'pattern':
            return Boolean(
              item.patternUnlockRecord &&
                item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted
            );
        }
      },
  },
  {
    keywords: 'memento',
    description: tl('Filter.HasMemento'),
    format: ['query'],
    destinyVersion: 2,
    suggestions: ['any', ...Object.keys(craftingMementos)],
    filter: ({ filterValue }) => {
      const list: number[] | undefined = craftingMementos[filterValue];
      return (item: DimItem) =>
        item.sockets?.allSockets.some(
          (s) =>
            s.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Mementos &&
            (filterValue === 'any' || list?.includes(s.plugged.plugDef.hash))
        );
    },
  },
  {
    keywords: 'enhancedperk',
    description: tl('Filter.EnhancedPerk'),
    format: 'range',
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const compare = rangeStringToComparator(filterValue);
      return (item: DimItem) => item.sockets && compare(countEnhancedPerks(item.sockets));
    },
  },
];

export default socketFilters;
