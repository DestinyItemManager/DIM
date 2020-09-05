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
    keywords: ['randomroll'],
    description: [tl('Filter.RandomRoll')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      Boolean(item.energy) || item.sockets?.allSockets.some((s) => s.hasRandomizedPlugItems),
  },
  {
    keywords: ['curated'],
    description: [tl('Filter.Curated')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) => {
      if (!item) {
        return false;
      }

      // TODO: remove if there are no false positives, as this precludes maintaining a list for curatedNonMasterwork
      // const masterWork = item.masterworkInfo?.statValue === 10;
      // const curatedNonMasterwork = [792755504, 3356526253, 2034817450].includes(item.hash); // Nightshade, Wishbringer, Distant Relation

      const legendaryWeapon =
        item.bucket?.sort === 'Weapons' && item.tier.toLowerCase() === 'legendary';

      const oneSocketPerPlug = item.sockets?.allSockets
        .filter((socket) =>
          curatedPlugsAllowList.includes(socket?.plugged?.plugDef?.plug?.plugCategoryHash || 0)
        )
        .every((socket) => socket?.plugOptions.length === 1);

      return (
        legendaryWeapon &&
        // (masterWork || curatedNonMasterwork) && // checks for masterWork(10) or on curatedNonMasterWork list
        oneSocketPerPlug
      );
    },
  },
  {
    keywords: ['shaded', 'hasshader'],
    description: [tl('Filter.HasShader')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
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
    description: [tl('Filter.HasOrnament')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
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
    keywords: ['hasmod'],
    description: [tl('Filter.Mods.Y2')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
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
    keywords: ['modded'],
    description: [tl('Filter.Mods.Y3')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
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
    keywords: ['modslot'],
    description: [tl('Filter.ModSlot')],
    format: 'query',
    suggestionsGenerator: modSlotTags.concat(['any', 'none']),
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) => {
      const modSocketTypeHash = getSpecialtySocketMetadata(item);
      return (
        (filterValue === 'none' && !modSocketTypeHash) ||
        (modSocketTypeHash && (filterValue === 'any' || modSocketTypeHash.tag === filterValue))
      );
    },
  },
  {
    keywords: ['holdsmod'],
    description: [tl('Filter.HoldsMod')],
    format: 'query',
    suggestionsGenerator: modSlotTags.concat(['any', 'none']),
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) => {
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
