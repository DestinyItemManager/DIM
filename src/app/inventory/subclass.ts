import { DimTalentGrid } from './item-types';
import subclassArc from 'images/subclass-arc.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassVoid from 'images/subclass-void.png';

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

  fistsofHavoc: 1757742244,
  thundercrash: 2795355746,
  sentinelShield: 368405360,
  bannerShield: 3504292102,
  hammerOfSol: 1722642322,
  burningMaul: 1323416107,
};

// prettier-ignore
const nodeHashToSubclassPath: {
  [hash: number]: {
    base: string;
    position: 'top' | 'middle' | 'bottom';
    superHash: number;
  };
} = {
  // Arcstrider
  1690891826: { base: subclassArc,   position: 'top',    superHash: superIconNodeHashes.arcStaff       },
  3006627468: { base: subclassArc,   position: 'middle', superHash: superIconNodeHashes.whirlwindGuard },
  313617030:  { base: subclassArc,   position: 'bottom', superHash: superIconNodeHashes.arcStaff       },
  // Gunslinger
  2242504056: { base: subclassSolar, position: 'top',    superHash: superIconNodeHashes.goldenGun      },
  1590824323: { base: subclassSolar, position: 'middle', superHash: superIconNodeHashes.bladeBarrage   },
  2805396803: { base: subclassSolar, position: 'bottom', superHash: superIconNodeHashes.goldenGun      },
  // Nightstalker
  277476372:  { base: subclassVoid,  position: 'top',    superHash: superIconNodeHashes.shadowshot     },
  499823166:  { base: subclassVoid,  position: 'middle', superHash: superIconNodeHashes.spectralBlades },
  4025960910: { base: subclassVoid,  position: 'bottom', superHash: superIconNodeHashes.shadowshot     },
  // Dawnblade
  1893159641: { base: subclassSolar, position: 'top',    superHash: superIconNodeHashes.daybreak       },
  935376049:  { base: subclassSolar, position: 'middle', superHash: superIconNodeHashes.wellOfRadiance },
  966868917:  { base: subclassSolar, position: 'bottom', superHash: superIconNodeHashes.daybreak       },
  // Stormcaller
  487158888:  { base: subclassArc,   position: 'top',    superHash: superIconNodeHashes.stormtrance    },
  3882393894: { base: subclassArc,   position: 'middle', superHash: superIconNodeHashes.chaosReach     },
  3297679786: { base: subclassArc,   position: 'bottom', superHash: superIconNodeHashes.stormtrance    },
  // Voidwalker
  2718724912: { base: subclassVoid,  position: 'top',    superHash: superIconNodeHashes.novaBomb       },
  194702279:  { base: subclassVoid,  position: 'middle', superHash: superIconNodeHashes.novaWarp       },
  1389184794: { base: subclassVoid,  position: 'bottom', superHash: superIconNodeHashes.novaBomb       },
  // Striker
  4099943028: { base: subclassArc,   position: 'top',    superHash: superIconNodeHashes.fistsofHavoc   },
  2795355746: { base: subclassArc,   position: 'middle', superHash: superIconNodeHashes.thundercrash   },
  4293830764: { base: subclassArc,   position: 'bottom', superHash: superIconNodeHashes.fistsofHavoc   },
  // Sentinel
  3806272138: { base: subclassVoid,  position: 'top',    superHash: superIconNodeHashes.sentinelShield },
  3504292102: { base: subclassVoid,  position: 'middle', superHash: superIconNodeHashes.bannerShield   },
  1347995538: { base: subclassVoid,  position: 'bottom', superHash: superIconNodeHashes.sentinelShield },
  // Sunbreaker
  3928207649: { base: subclassSolar, position: 'top',    superHash: superIconNodeHashes.hammerOfSol    },
  1323416107: { base: subclassSolar, position: 'middle', superHash: superIconNodeHashes.burningMaul    },
  1236431642: { base: subclassSolar, position: 'bottom', superHash: superIconNodeHashes.hammerOfSol    }
};

export function selectedSubclassPath(talentGrid: DimTalentGrid) {
  for (const node of talentGrid.nodes) {
    const def = nodeHashToSubclassPath[node.hash];
    if (node.activated && def) {
      const superNode = talentGrid.nodes.find((n) => n.hash === def.superHash);
      return {
        base: def.base,
        position: def.position,
        super: superNode?.icon,
      };
    }
  }

  return null;
}
