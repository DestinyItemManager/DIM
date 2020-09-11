import { tl } from 'app/i18next-t';
import { D2Item } from 'app/inventory/item-types';
import { getSpecialtySocketMetadata, modSlotTags } from 'app/utils/item-utils';
import { DestinyItemSubType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import {
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
  SHADERS_BUCKET,
} from '../d2-known-values';
import { FilterDefinition } from '../filter-types';

const socketFilters: FilterDefinition[] = [
  {
    keywords: 'randomroll',
    description: tl('Filter.RandomRoll'),
    destinyVersion: 2,
    filter: () => (item: D2Item) =>
      Boolean(item.energy) || item.sockets?.allSockets.some((s) => s.hasRandomizedPlugItems),
  },
  {
    keywords: 'curated',
    description: tl('Filter.Curated'),
    destinyVersion: 2,
    filter: () => (item: D2Item) => {
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
        .filter((socket) => socket?.plugOptions.length && socket.curatedRoll)
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
    keywords: ['shaded', 'hasshader'],
    description: tl('Filter.HasShader'),
    destinyVersion: 2,
    filter: () => (item: D2Item) =>
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged?.plugDef.plug &&
            socket.plugged.plugDef.plug.plugCategoryHash === SHADERS_BUCKET &&
            socket.plugged.plugDef.hash !== DEFAULT_SHADER
        )
      ),
  },
  {
    keywords: ['ornamented', 'hasornament'],
    description: tl('Filter.HasOrnament'),
    destinyVersion: 2,
    filter: () => (item: D2Item) =>
      item.sockets?.allSockets.some((socket) =>
        Boolean(
          socket.plugged &&
            socket.plugged.plugDef.itemSubType === DestinyItemSubType.Ornament &&
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
    filter: () => (item: D2Item) =>
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
    filter: () => (item: D2Item) =>
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
    keywords: 'modslot',
    description: tl('Filter.ModSlot'),
    format: 'query',
    suggestions: modSlotTags.concat(['any', 'none']),
    destinyVersion: 2,
    filter: ({ filterValue }) => (item: D2Item) => {
      const modSocketTypeHash = getSpecialtySocketMetadata(item);
      return (
        (filterValue === 'none' && !modSocketTypeHash) ||
        (modSocketTypeHash && (filterValue === 'any' || modSocketTypeHash.tag === filterValue))
      );
    },
  },
  {
    keywords: 'holdsmod',
    description: tl('Filter.HoldsMod'),
    format: 'query',
    suggestions: modSlotTags.concat(['any', 'none']),
    destinyVersion: 2,
    filter: ({ filterValue }) => (item: D2Item) => {
      const modSocketTypeHash = getSpecialtySocketMetadata(item);
      return (
        (filterValue === 'none' && !modSocketTypeHash) ||
        (modSocketTypeHash &&
          (filterValue === 'any' || modSocketTypeHash.compatibleTags.includes(filterValue)))
      );
    },
  },
];

export default socketFilters;
