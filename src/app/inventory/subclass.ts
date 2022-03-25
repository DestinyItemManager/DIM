import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DamageType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import subclassArc from 'images/subclass-arc.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassStasisAlt from 'images/subclass-stasis-alt.png';
import subclassStasis from 'images/subclass-stasis.png';
import subclassVoidAlt from 'images/subclass-void-alt.png';
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
interface V2SubclassInfo extends CommonSubclassInfo {
  isV3: false;
  paths: Record<SubclassPath, V2SubclassPathInfo>;
}
interface V3SubclassInfo extends CommonSubclassInfo {
  isV3: true;
}
type SubclassInfo = V2SubclassInfo | V3SubclassInfo;

function v2Subclass(
  dmg: DamageType,
  topPathNodeHash: number,
  middlePathNodeHash: number,
  bottomPathNodeHash: number,
  superIconNodeHash: number,
  altSuperIconNodeHash: number
): SubclassInfo {
  return {
    damageType: dmg,
    isV3: false,
    paths: {
      top: { nodeHash: topPathNodeHash, superIconNodeHash },
      middle: { nodeHash: middlePathNodeHash, superIconNodeHash: altSuperIconNodeHash },
      bottom: { nodeHash: bottomPathNodeHash, superIconNodeHash },
    },
  };
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
  1334959255: v2Subclass(
    DamageType.Arc,
    1690891826,
    3006627468,
    313617030,
    superIconNodeHashes.arcStaff,
    superIconNodeHashes.whirlwindGuard
  ),
  // Striker (v2)
  2958378809: v2Subclass(
    DamageType.Arc,
    4099943028,
    2795355746,
    4293830764,
    superIconNodeHashes.fistsOfHavoc,
    superIconNodeHashes.thundercrash
  ),
  // Stormcaller (v2)
  1751782730: v2Subclass(
    DamageType.Arc,
    487158888,
    3882393894,
    3297679786,
    superIconNodeHashes.stormtrance,
    superIconNodeHashes.chaosReach
  ),
  // Gunslinger (v2)
  3635991036: v2Subclass(
    DamageType.Thermal,
    2242504056,
    1590824323,
    2805396803,
    superIconNodeHashes.goldenGun,
    superIconNodeHashes.bladeBarrage
  ),
  // Sunbreaker (v2)
  3105935002: v2Subclass(
    DamageType.Thermal,
    3928207649,
    1323416107,
    1236431642,
    superIconNodeHashes.hammerOfSol,
    superIconNodeHashes.burningMaul
  ),
  // Dawnblade (v2)
  3481861797: v2Subclass(
    DamageType.Thermal,
    1893159641,
    935376049,
    966868917,
    superIconNodeHashes.daybreak,
    superIconNodeHashes.wellOfRadiance
  ),
  // Nightstalker (v2)
  3225959819: v2Subclass(
    DamageType.Void,
    277476372,
    499823166,
    4025960910,
    superIconNodeHashes.shadowshot,
    superIconNodeHashes.spectralBlades
  ),
  // Sentinel (v2)
  3382391785: v2Subclass(
    DamageType.Void,
    3806272138,
    3504292102,
    1347995538,
    superIconNodeHashes.sentinelShield,
    superIconNodeHashes.bannerShield
  ),
  // Voidwalker (v2)
  3887892656: v2Subclass(
    DamageType.Void,
    2718724912,
    194702279,
    1389184794,
    superIconNodeHashes.novaBomb,
    superIconNodeHashes.novaWarp
  ),

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
  ignoreSelectedPerks?: boolean
): SubclassIconInfo | undefined {
  const info = subclassInfoByHash[item.hash];
  if (info) {
    return info.isV3
      ? getV3SubclassIconInfo(item, info)
      : ignoreSelectedPerks
      ? undefined
      : getV2SubclassIconInfo(item, info);
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
