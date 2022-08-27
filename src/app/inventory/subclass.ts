import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DamageType, DestinyClass } from 'bungie-api-ts/destiny2';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import {
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import subclassArc from 'images/subclass-arc.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassStasisAlt from 'images/subclass-stasis-alt.png';
import subclassStasis from 'images/subclass-stasis.png';
import subclassVoidAlt from 'images/subclass-void-alt.png';
import subclassVoid from 'images/subclass-void.png';
import memoizeOne from 'memoize-one';
import { DimItem, PluggableInventoryItemDefinition } from './item-types';

type SubclassPath = 'top' | 'middle' | 'bottom';

interface SubclassInfo {
  damageType: DamageType;
  characterClass: DestinyClass;
}
function subclass(damageType: DamageType, characterClass: DestinyClass): SubclassInfo {
  return {
    damageType,
    characterClass,
  };
}

const subclassInfoByHash: Record<number, SubclassInfo> = {
  // Subclass 3.0
  873720784: subclass(DamageType.Stasis, DestinyClass.Hunter), // Revenant (v3)
  613647804: subclass(DamageType.Stasis, DestinyClass.Titan), // Behemoth (v3)
  3291545503: subclass(DamageType.Stasis, DestinyClass.Warlock), // Shadebinder (v3)
  2453351420: subclass(DamageType.Void, DestinyClass.Hunter), // Nightstalker (v3)
  2842471112: subclass(DamageType.Void, DestinyClass.Titan), // Sentinel (v3)
  2849050827: subclass(DamageType.Void, DestinyClass.Warlock), // Voidwalker (v3)
  2240888816: subclass(DamageType.Thermal, DestinyClass.Hunter), // Gunslinger (v3)
  2550323932: subclass(DamageType.Thermal, DestinyClass.Titan), // Sunbreaker (v3)
  3941205951: subclass(DamageType.Thermal, DestinyClass.Warlock), // Dawnblade (v3)
  2328211300: subclass(DamageType.Arc, DestinyClass.Hunter), // Arcstrider (v3)
  2932390016: subclass(DamageType.Arc, DestinyClass.Titan), // Striker (v3)
  3168997075: subclass(DamageType.Arc, DestinyClass.Warlock), // Stormcaller (v3)
};

interface SubclassPlugCategory {
  /** The item hashes of all subclasses that can insert plugs of this category. */
  compatibleSubclassHashes: number[];
  /**
   * The socket category that plugs of this category can be inserted into e.g. abilities, fragments etc.
   * If plugs of this category can be inserted into multiple sockets with differing socket category hashes,
   * this will be set to null.
   */
  socketCategoryHash: SocketCategoryHashes | null;
  /**
   * The damage type of the subclasses that plugs of this category can be inserted into.
   * If plugs of this category can be inserted into multiple subclasses with differing damage types, this
   * will be set to null.
   */
  damageType: DamageType | null;
}

export const getSubclassPlugCategories = memoizeOne((defs: D2ManifestDefinitions) => {
  const results = new Map<PlugCategoryHashes, SubclassPlugCategory>();
  for (const [itemHashStr, subclassInfo] of Object.entries(subclassInfoByHash)) {
    const subclassHash = parseInt(itemHashStr, 10);
    const def = defs.InventoryItem.get(subclassHash);
    if (!def.sockets) {
      continue;
    }
    for (const socketEntry of def.sockets.socketEntries) {
      const socketType = defs.SocketType.get(socketEntry.socketTypeHash);
      const socketCategoryHash = socketType.socketCategoryHash;
      for (const whitelistedPlugCategory of socketType.plugWhitelist) {
        const plugCategoryHash = whitelistedPlugCategory.categoryHash;
        const plugCategory = results.get(plugCategoryHash);
        if (plugCategory) {
          plugCategory.compatibleSubclassHashes.push(subclassHash);

          /*
          If there are conflicting damage types or socket categories, reset back to null. We assume that
          the caller can't ascertain anything useful in these cases.
          */
          if (plugCategory.damageType !== subclassInfo.damageType) {
            plugCategory.damageType = null;
          }
          if (plugCategory.socketCategoryHash !== socketCategoryHash) {
            plugCategory.socketCategoryHash = null;
          }
        } else {
          results.set(plugCategoryHash, {
            compatibleSubclassHashes: [subclassHash],
            damageType: subclassInfo.damageType,
            socketCategoryHash,
          });
        }
      }
    }
  }
  return results;
});

const baseImagesByDamageType: Partial<Record<DamageType, string>> = {
  [DamageType.Arc]: subclassArc,
  [DamageType.Thermal]: subclassSolar,
  [DamageType.Void]: subclassVoid,
  [DamageType.Stasis]: subclassStasis,
};

/*
These alternate base images are preferred for Subclass 3.0 as they account for the subtle gradient background
that the super icons include.
*/
const altBaseImagesByDamageType: Partial<Record<DamageType, string>> = {
  [DamageType.Void]: subclassVoidAlt,
  [DamageType.Stasis]: subclassStasisAlt,
};

interface SubclassIconInfo {
  base: string;
  path?: SubclassPath;
  super: string;
}
export function getSubclassIconInfo(item: DimItem): SubclassIconInfo | undefined {
  const info = subclassInfoByHash[item.hash];
  if (info) {
    return getV3SubclassIconInfo(item, info);
  }
}

function getV3SubclassIconInfo(
  item: DimItem,
  subclassInfo: SubclassInfo
): SubclassIconInfo | undefined {
  const base =
    altBaseImagesByDamageType[subclassInfo.damageType] ??
    baseImagesByDamageType[subclassInfo.damageType];
  if (base && item.sockets) {
    const superSocket = getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.Super);
    const superIcon = superSocket?.plugged?.plugDef?.displayProperties?.icon;
    if (superIcon) {
      return {
        base,
        super: superIcon,
      };
    }
  }
}

export function getDamageTypeForSubclassPlug(
  defs: D2ManifestDefinitions,
  item: PluggableInventoryItemDefinition
) {
  // ignore empty plugs because they'll be present across all subclasses
  if (emptyPlugHashes.has(item.hash)) {
    return null;
  }

  // early out to avoid building subclass plug categories
  if (!item.itemCategoryHashes?.includes(ItemCategoryHashes.SubclassMods)) {
    return null;
  }

  const subclassPlugCategory = getSubclassPlugCategories(defs).get(item.plug.plugCategoryHash);
  if (subclassPlugCategory) {
    return subclassPlugCategory.damageType;
  }

  return null;
}
