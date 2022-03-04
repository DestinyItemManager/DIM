import { DimItem } from 'app/inventory/item-types';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
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

const weaponTypeSvgByCategoryHash = {
  [ItemCategoryHashes.AutoRifle]: autoRifle,
  [ItemCategoryHashes.HandCannon]: handCannon,
  [ItemCategoryHashes.PulseRifle]: pulseRifle,
  [ItemCategoryHashes.ScoutRifle]: scoutRifle,
  [ItemCategoryHashes.FusionRifle]: fusionRifle,
  [ItemCategoryHashes.SniperRifle]: sniperRifle,
  [ItemCategoryHashes.Shotgun]: shotgun,
  [ItemCategoryHashes.MachineGun]: machinegun,
  [ItemCategoryHashes.RocketLauncher]: rLauncher,
  [ItemCategoryHashes.Sidearm]: sidearm,
  [ItemCategoryHashes.Sword]: sword,
  [ItemCategoryHashes.GrenadeLaunchers]: gLauncher,
  [-ItemCategoryHashes.GrenadeLaunchers]: gLauncher_special,
  [ItemCategoryHashes.TraceRifles]: traceRifle,
  [ItemCategoryHashes.LinearFusionRifles]: lFusionRifle,
  [ItemCategoryHashes.SubmachineGuns]: smg,
  [ItemCategoryHashes.Bows]: bow,
  // TODO: Update when Bungie releases Glaive ICH
  [ItemCategoryHashes.Glaives]: glaive,
};

const weaponSlotSvgByCategoryHash = {
  [ItemCategoryHashes.KineticWeapon]: dmgKinetic,
  [ItemCategoryHashes.EnergyWeapon]: energyWeapon,
  [ItemCategoryHashes.PowerWeapon]: powerWeapon,
};

const armorSlotSvgByCategoryHash = {
  [ItemCategoryHashes.Helmets]: helmet,
  [ItemCategoryHashes.Arms]: gauntlets,
  [ItemCategoryHashes.Chest]: chest,
  [ItemCategoryHashes.Legs]: legs,
  [ItemCategoryHashes.ClassItems]: classItem,
};

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
