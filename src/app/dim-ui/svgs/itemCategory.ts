import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import legs from 'destiny-icons/armor_types/boots.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import titan from 'destiny-icons/general/class_titan.svg';
import hunter from 'destiny-icons/general/class_hunter.svg';
import warlock from 'destiny-icons/general/class_warlock.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import { D2Item } from 'app/inventory/item-types';

export const weaponTypeSvgByCategoryHash = {
  5: autoRifle,
  6: handCannon,
  7: pulseRifle,
  8: scoutRifle,
  9: fusionRifle,
  10: sniperRifle,
  11: shotgun,
  12: machinegun,
  13: rLauncher,
  14: sidearm,
  54: sword,
  153950757: gLauncher,
  2489664120: traceRifle,
  1504945536: lFusionRifle,
  3954685534: smg,
  3317538576: bow,
};

export const weaponSlotSvgByCategoryHash = {
  2: dmgKinetic,
  3: energyWeapon,
  4: powerWeapon,
};

export const armorSlotSvgByCategoryHash = {
  45: helmet,
  46: gauntlets,
  47: chest,
  48: legs,
  49: classItem,
};

export const armorClassSvgByCategoryHash = {
  23: hunter,
  22: titan,
  21: warlock,
};

export const cosmeticSvgByCategoryHash = {
  39: ghost,
};

export const consumableSvgByCategoryHash = {};

/** an SVG of the weapon's type, or slot, if possible */
export function getWeaponSvgIcon(item: D2Item) {
  // reverse through the ICHs because most specific is last,
  // i.e. Weapon, Fusion Rifle, Linear Fusion Rifle
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    if (weaponTypeSvgByCategoryHash[ich]) {
      const svg: string = weaponTypeSvgByCategoryHash[ich] ?? weaponSlotSvgByCategoryHash[ich];
      if (svg) {
        return svg;
      }
    }
  }
}

/**
 * an SVG of the item's type, or undefined.
 * i like this idea but not sure where to employ it yet.
 */
export function getItemSvgIcon(item: D2Item) {
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const svg: string =
      weaponTypeSvgByCategoryHash[ich] ??
      // weaponSlotSvgByCategoryHash[ich] ??
      // armorSlotSvgByCategoryHash[ich] ??
      // armorClassSvgByCategoryHash[ich] ??
      cosmeticSvgByCategoryHash[ich] ??
      consumableSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}
