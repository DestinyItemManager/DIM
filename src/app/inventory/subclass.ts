import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DamageType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import subclassArc from 'images/subclass-arc.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassVoid from 'images/subclass-void.png';
import { DimItem } from './item-types';

type SubclassPath = 'top' | 'middle' | 'bottom';

interface CommonSubclassInfo {
  damageType: DamageType;
}
interface V2SubclassPathInfo {
  nodeHash: number;
  superIconNodeHash: number;
}
interface V2SubclassInfo {
  isV3: false;
  paths: Record<SubclassPath, V2SubclassPathInfo>;
}
interface V3SubclassInfo {
  isV3: true;
}
type SubclassInfo = CommonSubclassInfo & (V2SubclassInfo | V3SubclassInfo);

function v2Subclass(
  dmg: DamageType,
  paths: Record<SubclassPath, V2SubclassPathInfo>
): SubclassInfo {
  return {
    damageType: dmg,
    isV3: false,
    paths,
  };
}
function subclassPath(nodeHash: number, superIconNodeHash: number): V2SubclassPathInfo {
  return { nodeHash, superIconNodeHash };
}
function v3Subclass(dmg: DamageType): SubclassInfo {
  return {
    damageType: dmg,
    isV3: true,
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

const subclassInfoByHash: Record<number, SubclassInfo> = {
  // Arcstrider (v2)
  1334959255: v2Subclass(DamageType.Arc, {
    top: subclassPath(1690891826, superIconNodeHashes.arcStaff),
    middle: subclassPath(3006627468, superIconNodeHashes.whirlwindGuard),
    bottom: subclassPath(313617030, superIconNodeHashes.arcStaff),
  }),
  // Striker (v2)
  2958378809: v2Subclass(DamageType.Arc, {
    top: subclassPath(4099943028, superIconNodeHashes.fistsOfHavoc),
    middle: subclassPath(2795355746, superIconNodeHashes.thundercrash),
    bottom: subclassPath(4293830764, superIconNodeHashes.fistsOfHavoc),
  }),
  // Stormcaller (v2)
  1751782730: v2Subclass(DamageType.Arc, {
    top: subclassPath(487158888, superIconNodeHashes.stormtrance),
    middle: subclassPath(3882393894, superIconNodeHashes.chaosReach),
    bottom: subclassPath(3297679786, superIconNodeHashes.stormtrance),
  }),
  // Gunslinger (v2)
  3635991036: v2Subclass(DamageType.Thermal, {
    top: subclassPath(2242504056, superIconNodeHashes.goldenGun),
    middle: subclassPath(1590824323, superIconNodeHashes.bladeBarrage),
    bottom: subclassPath(2805396803, superIconNodeHashes.goldenGun),
  }),
  // Sunbreaker (v2)
  3105935002: v2Subclass(DamageType.Thermal, {
    top: subclassPath(3928207649, superIconNodeHashes.hammerOfSol),
    middle: subclassPath(1323416107, superIconNodeHashes.burningMaul),
    bottom: subclassPath(1236431642, superIconNodeHashes.hammerOfSol),
  }),
  // Dawnblade (v2)
  3481861797: v2Subclass(DamageType.Thermal, {
    top: subclassPath(1893159641, superIconNodeHashes.daybreak),
    middle: subclassPath(935376049, superIconNodeHashes.wellOfRadiance),
    bottom: subclassPath(966868917, superIconNodeHashes.daybreak),
  }),
  // Nightstalker (v2)
  3225959819: v2Subclass(DamageType.Void, {
    top: subclassPath(277476372, superIconNodeHashes.shadowshot),
    middle: subclassPath(499823166, superIconNodeHashes.spectralBlades),
    bottom: subclassPath(4025960910, superIconNodeHashes.shadowshot),
  }),
  // Sentinel (v2)
  3382391785: v2Subclass(DamageType.Void, {
    top: subclassPath(3806272138, superIconNodeHashes.sentinelShield),
    middle: subclassPath(3504292102, superIconNodeHashes.bannerShield),
    bottom: subclassPath(1347995538, superIconNodeHashes.sentinelShield),
  }),
  // Voidwalker (v2)
  3887892656: v2Subclass(DamageType.Void, {
    top: subclassPath(2718724912, superIconNodeHashes.novaBomb),
    middle: subclassPath(194702279, superIconNodeHashes.novaWarp),
    bottom: subclassPath(1389184794, superIconNodeHashes.novaBomb),
  }),

  // Subclass 3.0
  873720784: v3Subclass(DamageType.Stasis), // Revenant (v3)
  613647804: v3Subclass(DamageType.Stasis), // Behemoth (v3)
  3291545503: v3Subclass(DamageType.Stasis), // Shadebinder (v3)
  2453351420: v3Subclass(DamageType.Void), // Nightstalker (v3)
  2842471112: v3Subclass(DamageType.Void), // Sentinel (v3)
  2849050827: v3Subclass(DamageType.Void), // Voidwalker (v3)
};

const baseImagesByDamageType: Partial<Record<DamageType, string>> = {
  [DamageType.Arc]: subclassArc,
  [DamageType.Thermal]: subclassSolar,
  [DamageType.Void]: subclassVoid,
};

interface SubclassIconInfo {
  base: string;
  path?: SubclassPath;
  super: string;
}
export function getSubclassIconInfo(
  item: DimItem,
  ignoreSelectedPerks?: boolean
): SubclassIconInfo | undefined {
  const info = subclassInfoByHash[item.hash];
  if (info) {
    const base = baseImagesByDamageType[info.damageType];
    if (base) {
      if (info.isV3) {
        const superIcon = getV3SubclassSuperIcon(item);
        if (superIcon) {
          return {
            base,
            super: superIcon,
          };
        }
      } else if (!ignoreSelectedPerks) {
        const v2Info = getV2SubclassIconInfo(item, info);
        if (v2Info) {
          return {
            base,
            ...v2Info,
          };
        }
      }
    }
  }
}

function getV2SubclassIconInfo(
  item: DimItem,
  subclassInfo: V2SubclassInfo
):
  | {
      path: SubclassPath;
      super: string;
    }
  | undefined {
  if (item.talentGrid) {
    for (const path of Object.keys(subclassInfo.paths) as SubclassPath[]) {
      const pathInfo: V2SubclassPathInfo = subclassInfo.paths[path];
      const pathNode = item.talentGrid.nodes.find(
        (n) => n.activated && n.hash === pathInfo.nodeHash
      );
      if (pathNode) {
        const superNode = item.talentGrid.nodes.find((n) => n.hash === pathInfo.superIconNodeHash);
        if (superNode) {
          return {
            path,
            super: superNode.icon,
          };
        }
      }
    }
  }
}

function getV3SubclassSuperIcon(item: DimItem): string | undefined {
  if (item.sockets) {
    const superSocket = getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.Super);
    return superSocket?.plugged?.plugDef?.displayProperties?.icon;
  }
}
