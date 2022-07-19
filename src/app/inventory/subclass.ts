import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DamageType, DestinyClass, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
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
import _ from 'lodash';
import { DimItem } from './item-types';

type SubclassPath = 'top' | 'middle' | 'bottom';

interface CommonSubclassInfo {
  damageType: DamageType;
  characterClass: DestinyClass;
}
interface V2SubclassPathInfo {
  nodeHash: number;
  superIconNodeHash: number;
}
interface V2SubclassInfo extends CommonSubclassInfo {
  isV3: false;
  paths: Record<SubclassPath, V2SubclassPathInfo>;
}
interface V3SubclassInfo extends CommonSubclassInfo {
  isV3: true;
  plugCategoryHashes: {
    supers: PlugCategoryHashes;
    classAbilities: PlugCategoryHashes;
    movementAbilities: PlugCategoryHashes;
    melees: PlugCategoryHashes;
    grenades: PlugCategoryHashes;
    aspects: PlugCategoryHashes;
    fragments: PlugCategoryHashes;
  };
}
type SubclassInfo = V2SubclassInfo | V3SubclassInfo;

function v2Subclass(
  damageType: DamageType,
  characterClass: DestinyClass,
  paths: Record<SubclassPath, V2SubclassPathInfo>
): SubclassInfo {
  return {
    characterClass,
    damageType,
    isV3: false,
    paths,
  };
}
function subclassPath(nodeHash: number, superIconNodeHash: number): V2SubclassPathInfo {
  return { nodeHash, superIconNodeHash };
}
function v3Subclass(
  damageType: DamageType,
  characterClass: DestinyClass,
  plugCategoryHashes: V3SubclassInfo['plugCategoryHashes']
): SubclassInfo {
  return {
    damageType,
    characterClass,
    isV3: true,
    plugCategoryHashes,
  };
}

const superIconNodeHashes = {
  arcStaff: 2936898795,
  whirlwindGuard: 3006627468,
  goldenGun: 675014898,
  bladeBarrage: 1590824323,
  shadowshot: 3931765019,
  spectralBlades: 499823166,

  stormtrance: 178252917,
  chaosReach: 3882393894,
  daybreak: 4102085486,
  wellOfRadiance: 935376049,
  novaBomb: 3082407249,
  novaWarp: 194702279,

  fistsOfHavoc: 1757742244,
  thundercrash: 2795355746,
  sentinelShield: 368405360,
  bannerShield: 3504292102,
  hammerOfSol: 1722642322,
  burningMaul: 1323416107,
};

export const subclassInfoByHash: Record<number, SubclassInfo> = {
  // Arcstrider (v2)
  1334959255: v2Subclass(DamageType.Arc, DestinyClass.Hunter, {
    top: subclassPath(1690891826, superIconNodeHashes.arcStaff),
    middle: subclassPath(3006627468, superIconNodeHashes.whirlwindGuard),
    bottom: subclassPath(313617030, superIconNodeHashes.arcStaff),
  }),
  // Striker (v2)
  2958378809: v2Subclass(DamageType.Arc, DestinyClass.Titan, {
    top: subclassPath(4099943028, superIconNodeHashes.fistsOfHavoc),
    middle: subclassPath(2795355746, superIconNodeHashes.thundercrash),
    bottom: subclassPath(4293830764, superIconNodeHashes.fistsOfHavoc),
  }),
  // Stormcaller (v2)
  1751782730: v2Subclass(DamageType.Arc, DestinyClass.Warlock, {
    top: subclassPath(487158888, superIconNodeHashes.stormtrance),
    middle: subclassPath(3882393894, superIconNodeHashes.chaosReach),
    bottom: subclassPath(3297679786, superIconNodeHashes.stormtrance),
  }),
  // Gunslinger (v2)
  3635991036: v2Subclass(DamageType.Thermal, DestinyClass.Hunter, {
    top: subclassPath(2242504056, superIconNodeHashes.goldenGun),
    middle: subclassPath(1590824323, superIconNodeHashes.bladeBarrage),
    bottom: subclassPath(2805396803, superIconNodeHashes.goldenGun),
  }),
  // Sunbreaker (v2)
  3105935002: v2Subclass(DamageType.Thermal, DestinyClass.Titan, {
    top: subclassPath(3928207649, superIconNodeHashes.hammerOfSol),
    middle: subclassPath(1323416107, superIconNodeHashes.burningMaul),
    bottom: subclassPath(1236431642, superIconNodeHashes.hammerOfSol),
  }),
  // Dawnblade (v2)
  3481861797: v2Subclass(DamageType.Thermal, DestinyClass.Warlock, {
    top: subclassPath(1893159641, superIconNodeHashes.daybreak),
    middle: subclassPath(935376049, superIconNodeHashes.wellOfRadiance),
    bottom: subclassPath(966868917, superIconNodeHashes.daybreak),
  }),
  // Nightstalker (v2)
  3225959819: v2Subclass(DamageType.Void, DestinyClass.Hunter, {
    top: subclassPath(277476372, superIconNodeHashes.shadowshot),
    middle: subclassPath(499823166, superIconNodeHashes.spectralBlades),
    bottom: subclassPath(4025960910, superIconNodeHashes.shadowshot),
  }),
  // Sentinel (v2)
  3382391785: v2Subclass(DamageType.Void, DestinyClass.Titan, {
    top: subclassPath(3806272138, superIconNodeHashes.sentinelShield),
    middle: subclassPath(3504292102, superIconNodeHashes.bannerShield),
    bottom: subclassPath(1347995538, superIconNodeHashes.sentinelShield),
  }),
  // Voidwalker (v2)
  3887892656: v2Subclass(DamageType.Void, DestinyClass.Warlock, {
    top: subclassPath(2718724912, superIconNodeHashes.novaBomb),
    middle: subclassPath(194702279, superIconNodeHashes.novaWarp),
    bottom: subclassPath(1389184794, superIconNodeHashes.novaBomb),
  }),

  // Subclass 3.0

  // Revenant (v3)
  873720784: v3Subclass(DamageType.Stasis, DestinyClass.Hunter, {
    supers: PlugCategoryHashes.HunterStasisSupers,
    classAbilities: PlugCategoryHashes.HunterStasisClassAbilities,
    movementAbilities: PlugCategoryHashes.HunterStasisMovement,
    melees: PlugCategoryHashes.HunterStasisMelee,
    grenades: PlugCategoryHashes.SharedStasisGrenades,
    aspects: PlugCategoryHashes.HunterStasisTotems,
    fragments: PlugCategoryHashes.SharedStasisTrinkets,
  }),
  // Behemoth (v3)
  613647804: v3Subclass(DamageType.Stasis, DestinyClass.Titan, {
    supers: PlugCategoryHashes.TitanStasisSupers,
    classAbilities: PlugCategoryHashes.TitanStasisClassAbilities,
    movementAbilities: PlugCategoryHashes.TitanStasisMovement,
    melees: PlugCategoryHashes.TitanStasisMelee,
    grenades: PlugCategoryHashes.SharedStasisGrenades,
    aspects: PlugCategoryHashes.TitanStasisTotems,
    fragments: PlugCategoryHashes.SharedStasisTrinkets,
  }),
  // Shadebinder (v3)
  3291545503: v3Subclass(DamageType.Stasis, DestinyClass.Warlock, {
    supers: PlugCategoryHashes.WarlockStasisSupers,
    classAbilities: PlugCategoryHashes.WarlockStasisClassAbilities,
    movementAbilities: PlugCategoryHashes.WarlockStasisMovement,
    melees: PlugCategoryHashes.WarlockStasisMelee,
    grenades: PlugCategoryHashes.SharedStasisGrenades,
    aspects: PlugCategoryHashes.WarlockStasisTotems,
    fragments: PlugCategoryHashes.SharedStasisTrinkets,
  }),
  // Nightstalker (v3)
  2453351420: v3Subclass(DamageType.Void, DestinyClass.Hunter, {
    supers: PlugCategoryHashes.HunterVoidSupers,
    classAbilities: PlugCategoryHashes.HunterVoidClassAbilities,
    movementAbilities: PlugCategoryHashes.HunterVoidMovement,
    melees: PlugCategoryHashes.HunterVoidMelee,
    grenades: PlugCategoryHashes.SharedVoidGrenades,
    aspects: PlugCategoryHashes.HunterVoidAspects,
    fragments: PlugCategoryHashes.SharedVoidFragments,
  }),
  // Sentinel (v3)
  2842471112: v3Subclass(DamageType.Void, DestinyClass.Titan, {
    supers: PlugCategoryHashes.TitanVoidSupers,
    classAbilities: PlugCategoryHashes.TitanVoidClassAbilities,
    movementAbilities: PlugCategoryHashes.TitanVoidMovement,
    melees: PlugCategoryHashes.TitanVoidMelee,
    grenades: PlugCategoryHashes.SharedVoidGrenades,
    aspects: PlugCategoryHashes.TitanVoidAspects,
    fragments: PlugCategoryHashes.SharedVoidFragments,
  }),
  // Voidwalker (v3)
  2849050827: v3Subclass(DamageType.Void, DestinyClass.Warlock, {
    supers: PlugCategoryHashes.WarlockVoidSupers,
    classAbilities: PlugCategoryHashes.WarlockVoidClassAbilities,
    movementAbilities: PlugCategoryHashes.WarlockVoidMovement,
    melees: PlugCategoryHashes.WarlockVoidMelee,
    grenades: PlugCategoryHashes.SharedVoidGrenades,
    aspects: PlugCategoryHashes.WarlockVoidAspects,
    fragments: PlugCategoryHashes.SharedVoidFragments,
  }),
  // Gunslinger (v3)
  2240888816: v3Subclass(DamageType.Thermal, DestinyClass.Hunter, {
    supers: PlugCategoryHashes.HunterSolarSupers,
    classAbilities: PlugCategoryHashes.HunterSolarClassAbilities,
    movementAbilities: PlugCategoryHashes.HunterSolarMovement,
    melees: PlugCategoryHashes.HunterSolarMelee,
    grenades: PlugCategoryHashes.SharedSolarGrenades,
    aspects: PlugCategoryHashes.HunterSolarAspects,
    fragments: PlugCategoryHashes.SharedSolarFragments,
  }),
  // Sunbreaker (v3)
  2550323932: v3Subclass(DamageType.Thermal, DestinyClass.Titan, {
    supers: PlugCategoryHashes.TitanSolarSupers,
    classAbilities: PlugCategoryHashes.TitanSolarClassAbilities,
    movementAbilities: PlugCategoryHashes.TitanSolarMovement,
    melees: PlugCategoryHashes.TitanSolarMelee,
    grenades: PlugCategoryHashes.SharedSolarGrenades,
    aspects: PlugCategoryHashes.TitanSolarAspects,
    fragments: PlugCategoryHashes.SharedSolarFragments,
  }),
  // Dawnblade (v3)
  3941205951: v3Subclass(DamageType.Thermal, DestinyClass.Warlock, {
    supers: PlugCategoryHashes.WarlockSolarSupers,
    classAbilities: PlugCategoryHashes.WarlockSolarClassAbilities,
    movementAbilities: PlugCategoryHashes.WarlockSolarMovement,
    melees: PlugCategoryHashes.WarlockSolarMelee,
    grenades: PlugCategoryHashes.SharedSolarGrenades,
    aspects: PlugCategoryHashes.WarlockSolarAspects,
    fragments: PlugCategoryHashes.SharedSolarFragments,
  }),
};

// build up a map of V2 -> V3 subclass hashes
export const v3SubclassHashesByV2SubclassHash: Record<number, number> = {};
const subclassInfosByClassAndDamageType = _.groupBy(Object.entries(subclassInfoByHash), ([, s]) => [
  s.characterClass,
  s.damageType,
]);
for (const subclassGroup of Object.values(subclassInfosByClassAndDamageType)) {
  if (subclassGroup?.length > 1) {
    const v2Subclass = subclassGroup.find(([, s]) => !s.isV3);
    const v3Subclass = subclassGroup.find(([, s]) => s.isV3);
    if (v2Subclass && v3Subclass) {
      const [v2SubclassHashStr] = v2Subclass;
      const [v3SubclassHashStr] = v3Subclass;
      v3SubclassHashesByV2SubclassHash[parseInt(v2SubclassHashStr, 10)] = parseInt(
        v3SubclassHashStr,
        10
      );
    }
  }
}

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
export function getSubclassIconInfo(
  item: DimItem,
  onlyShowSuperForV3Subclasses: boolean
): SubclassIconInfo | undefined {
  const info = subclassInfoByHash[item.hash];
  if (info) {
    if (info.isV3) {
      return getV3SubclassIconInfo(item, info);
    } else if (!onlyShowSuperForV3Subclasses) {
      return getV2SubclassIconInfo(item, info);
    }
  }
}

function getV2SubclassIconInfo(
  item: DimItem,
  subclassInfo: V2SubclassInfo
): SubclassIconInfo | undefined {
  const base = baseImagesByDamageType[subclassInfo.damageType];
  if (base && item.talentGrid) {
    for (const path of Object.keys(subclassInfo.paths) as SubclassPath[]) {
      const pathInfo: V2SubclassPathInfo = subclassInfo.paths[path];
      const pathNode = item.talentGrid.nodes.find(
        (n) => n.activated && n.hash === pathInfo.nodeHash
      );
      if (pathNode) {
        const superNode = item.talentGrid.nodes.find((n) => n.hash === pathInfo.superIconNodeHash);
        if (superNode) {
          return {
            base,
            path,
            super: superNode.icon,
          };
        }
      }
    }
  }
}

function getV3SubclassIconInfo(
  item: DimItem,
  subclassInfo: V3SubclassInfo
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

export function getDamageTypeForSubclassPlug(item: DestinyInventoryItemDefinition) {
  if (!item.plug) {
    return null;
  }

  // ignore empty plugs because they'll be present across all subclasses
  if (emptyPlugHashes.has(item.hash)) {
    return null;
  }

  // early out to avoid looping through subclass infos
  if (
    !item.itemCategoryHashes ||
    !item.itemCategoryHashes.includes(ItemCategoryHashes.SubclassMods)
  ) {
    return null;
  }

  for (const subclass of Object.values(subclassInfoByHash)) {
    if (
      subclass.isV3 &&
      (item.plug.plugCategoryHash === subclass.plugCategoryHashes.supers ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.classAbilities ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.movementAbilities ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.melees ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.grenades ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.aspects ||
        item.plug.plugCategoryHash === subclass.plugCategoryHashes.fragments)
    ) {
      return subclass.damageType;
    }
  }
  return null;
}
