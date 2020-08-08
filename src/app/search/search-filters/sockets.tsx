import { D2Item } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';
import { DestinyItemSubType } from 'bungie-api-ts/destiny2';
import { getSpecialtySocketMetadata, modSlotTags } from 'app/utils/item-utils';
import {
  curatedPlugsAllowList,
  DEFAULT_GLOW,
  DEFAULT_ORNAMENTS,
  DEFAULT_SHADER,
  emptySocketHashes,
  SHADERS_BUCKET,
} from '../d2-known-values';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

const socketFilters: FilterDefinition[] = [
  {
    keywords: ['randomroll'],
    description: ['Filter.RandomRoll'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      Boolean(item.energy) || item.sockets?.sockets.some((s) => s.hasRandomizedPlugItems),
  },
  {
    keywords: ['curated'],
    description: ['Filter.Curated'],
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

      const oneSocketPerPlug = item.sockets?.sockets
        .filter((socket) =>
          curatedPlugsAllowList.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash || 0)
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
    description: ['Filter.HasShader'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      item.sockets?.sockets.some((socket) =>
        Boolean(
          socket.plug?.plugItem.plug &&
            socket.plug.plugItem.plug.plugCategoryHash === SHADERS_BUCKET &&
            socket.plug.plugItem.hash !== DEFAULT_SHADER
        )
      ),
  },
  {
    keywords: ['ornamented', 'hasornament'],
    description: ['Filter.HasOrnament'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      item.sockets?.sockets.some((socket) =>
        Boolean(
          socket.plug &&
            socket.plug.plugItem.itemSubType === DestinyItemSubType.Ornament &&
            socket.plug.plugItem.hash !== DEFAULT_GLOW &&
            !DEFAULT_ORNAMENTS.includes(socket.plug.plugItem.hash) &&
            !socket.plug.plugItem.itemCategoryHashes?.includes(
              ItemCategoryHashes.ArmorModsGlowEffects
            )
        )
      ),
  },
  {
    keywords: ['hasmod'],
    description: ['Filter.Mods.Y2'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      item.sockets?.sockets.some((socket) =>
        Boolean(
          socket.plug &&
            !emptySocketHashes.includes(socket.plug.plugItem.hash) &&
            socket.plug.plugItem.plug &&
            socket.plug.plugItem.plug.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plug.plugItem.perks.length &&
            // enforce that this doesn't have an energy cost (y3 reusables)
            !socket.plug.plugItem.plug.energyCost
        )
      ),
  },
  {
    keywords: ['modded'],
    description: ['Filter.Mods.Y3'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      Boolean(item.energy) &&
      item.sockets &&
      item.sockets.sockets.some((socket) =>
        Boolean(
          socket.plug &&
            !emptySocketHashes.includes(socket.plug.plugItem.hash) &&
            socket.plug.plugItem.plug &&
            socket.plug.plugItem.plug.plugCategoryIdentifier.match(
              /(v400.weapon.mod_(guns|damage|magazine)|enhancements.)/
            ) &&
            // enforce that this provides a perk (excludes empty slots)
            socket.plug.plugItem.perks.length
        )
      ),
  },
  {
    keywords: ['modslot'],
    description: ['Filter.ModSlot'],
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
    description: ['Filter.HoldsMod'],
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
