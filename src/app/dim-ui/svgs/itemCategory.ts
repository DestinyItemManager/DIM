import { DimItem } from 'app/inventory/item-types';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import hunter from 'destiny-icons/general/class_hunter.svg';
import titan from 'destiny-icons/general/class_titan.svg';
import warlock from 'destiny-icons/general/class_warlock.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';

export const weaponTypeSvgByCategoryHash = {
  5: String(FontGlyphs.auto_rifle),
  6: String(FontGlyphs.hand_cannon),
  7: String(FontGlyphs.pulse_rifle),
  8: String(FontGlyphs.scout_rifle),
  9: String(FontGlyphs.fusion_rifle),
  10: String(FontGlyphs.sniper_rifle),
  11: String(FontGlyphs.shotgun),
  12: String(FontGlyphs.machinegun),
  13: String(FontGlyphs.rocket_launcher),
  14: String(FontGlyphs.sidearm),
  54: String(FontGlyphs.sword_heavy),
  153950757: String(FontGlyphs.grenade_launcher),
  [-153950757]: String(FontGlyphs.grenade_launcher_field_forged),
  2489664120: String(FontGlyphs.beam_weapon),
  1504945536: String(FontGlyphs.wire_rifle),
  3954685534: String(FontGlyphs.smg),
  3317538576: String(FontGlyphs.bow),
};

export const weaponSlotSvgByCategoryHash = {
  2: String(FontGlyphs.environment_hazard),
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

/** an SVG of the weapon's type, if determinable */
export function getWeaponTypeSvgIcon(item: DimItem) {
  // reverse through the ICHs because most specific is last,
  // i.e. Weapon, Fusion Rifle, Linear Fusion Rifle
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const svg: string = weaponTypeSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}

/** an SVG of the weapon's slot, if possible */
export function getWeaponSlotSvgIcon(item: DimItem) {
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const svg: string = weaponSlotSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}

/** an SVG of the armor's slot, if determinable */
export function getArmorSlotSvgIcon(item: DimItem) {
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const svg: string = armorSlotSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}
