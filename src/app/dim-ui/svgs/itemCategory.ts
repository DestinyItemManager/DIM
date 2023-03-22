import { DimItem } from 'app/inventory/item-types';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import heavyAmmo from 'destiny-icons/general/ammo-heavy.svg';
import hunter from 'destiny-icons/general/class_hunter.svg';
import titan from 'destiny-icons/general/class_titan.svg';
import warlock from 'destiny-icons/general/class_warlock.svg';
import emblem from 'destiny-icons/general/emblem.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import ship from 'destiny-icons/general/ship.svg';
import sparrow from 'destiny-icons/general/sparrow.svg';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import glaive from 'destiny-icons/weapons/glaive.svg';
import gLauncher_special from 'destiny-icons/weapons/grenade_launcher-field_forged.svg';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';
import energyWeaponSlot from 'images/weapon-slot-energy.svg';
import kineticWeaponSlot from 'images/weapon-slot-kinetic.svg';

interface ItemCategoryIcon {
  svg: string;
  colorized: boolean;
}
function monochrome(svg: string): ItemCategoryIcon {
  return { svg, colorized: false };
}
function colorized(svg: string): ItemCategoryIcon {
  return { svg, colorized: true };
}

const weaponTypeSvgByCategoryHash = {
  [ItemCategoryHashes.AutoRifle]: monochrome(autoRifle),
  [ItemCategoryHashes.HandCannon]: monochrome(handCannon),
  [ItemCategoryHashes.PulseRifle]: monochrome(pulseRifle),
  [ItemCategoryHashes.ScoutRifle]: monochrome(scoutRifle),
  [ItemCategoryHashes.FusionRifle]: monochrome(fusionRifle),
  [ItemCategoryHashes.SniperRifle]: monochrome(sniperRifle),
  [ItemCategoryHashes.Shotgun]: monochrome(shotgun),
  [ItemCategoryHashes.MachineGun]: monochrome(machinegun),
  [ItemCategoryHashes.RocketLauncher]: monochrome(rLauncher),
  [ItemCategoryHashes.Sidearm]: monochrome(sidearm),
  [ItemCategoryHashes.Sword]: monochrome(sword),
  [ItemCategoryHashes.GrenadeLaunchers]: monochrome(gLauncher),
  [-ItemCategoryHashes.GrenadeLaunchers]: monochrome(gLauncher_special),
  [ItemCategoryHashes.TraceRifles]: monochrome(traceRifle),
  [ItemCategoryHashes.LinearFusionRifles]: monochrome(lFusionRifle),
  [ItemCategoryHashes.SubmachineGuns]: monochrome(smg),
  [ItemCategoryHashes.Bows]: monochrome(bow),
  [ItemCategoryHashes.Glaives]: monochrome(glaive),
};

const weaponSlotSvgByCategoryHash = {
  [ItemCategoryHashes.KineticWeapon]: colorized(kineticWeaponSlot),
  [ItemCategoryHashes.EnergyWeapon]: colorized(energyWeaponSlot),
  [ItemCategoryHashes.PowerWeapon]: colorized(heavyAmmo),
};

const armorSlotSvgByCategoryHash = {
  [ItemCategoryHashes.Helmets]: monochrome(helmet),
  [ItemCategoryHashes.Arms]: monochrome(gauntlets),
  [ItemCategoryHashes.Chest]: monochrome(chest),
  [ItemCategoryHashes.Legs]: monochrome(legs),
  [ItemCategoryHashes.ClassItems]: monochrome(classItem),
};

/**
 * A mapping from known item category hashes to an appropriate icon
 */
export const itemCategoryIcons: { [itemCategoryHash: number]: ItemCategoryIcon } = {
  ...armorSlotSvgByCategoryHash,
  ...weaponSlotSvgByCategoryHash,
  ...weaponTypeSvgByCategoryHash,

  [ItemCategoryHashes.Weapon]: monochrome(handCannon),
  [ItemCategoryHashes.Ghost]: monochrome(ghost),
  [ItemCategoryHashes.Sparrows]: monochrome(sparrow),
  [ItemCategoryHashes.Ships]: monochrome(ship),
  [ItemCategoryHashes.Emblems]: monochrome(emblem),

  [ItemCategoryHashes.Hunter]: monochrome(hunter),
  [ItemCategoryHashes.Titan]: monochrome(titan),
  [ItemCategoryHashes.Warlock]: monochrome(warlock),
} as const;

/** an SVG of the weapon's type, if determinable */
export function getWeaponTypeSvgIcon(item: DimItem): ItemCategoryIcon | undefined {
  // reverse through the ICHs because most specific is last,
  // i.e. Weapon, Fusion Rifle, Linear Fusion Rifle
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const icon = weaponTypeSvgByCategoryHash[ich];
    if (icon) {
      return icon;
    }
  }
}

/** an SVG of the weapon's slot, if possible */
export function getWeaponSlotSvgIcon(item: DimItem): ItemCategoryIcon | undefined {
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const icon = weaponSlotSvgByCategoryHash[ich];
    if (icon) {
      return icon;
    }
  }
}

/** an SVG of the armor's slot, if determinable */
export function getArmorSlotSvgIcon(item: DimItem): ItemCategoryIcon | undefined {
  for (const ich of [...item.itemCategoryHashes].reverse()) {
    const icon = armorSlotSvgByCategoryHash[ich];
    if (icon) {
      return icon;
    }
  }
}
