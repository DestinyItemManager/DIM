import { DimItem } from 'app/inventory/item-types';
import { LookupTable } from 'app/utils/util-types';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import legs from 'destiny-icons/armor_types/boots.svg?react';
import chest from 'destiny-icons/armor_types/chest.svg?react';
import classItem from 'destiny-icons/armor_types/class.svg?react';
import gauntlets from 'destiny-icons/armor_types/gloves.svg?react';
import helmet from 'destiny-icons/armor_types/helmet.svg?react';
import heavyAmmo from 'destiny-icons/general/ammo-heavy.svg?react';
import hunter from 'destiny-icons/general/class_hunter.svg?react';
import titan from 'destiny-icons/general/class_titan.svg?react';
import warlock from 'destiny-icons/general/class_warlock.svg?react';
import emblem from 'destiny-icons/general/emblem.svg?react';
import ghost from 'destiny-icons/general/ghost.svg?react';
import ship from 'destiny-icons/general/ship.svg?react';
import sparrow from 'destiny-icons/general/sparrow.svg?react';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg?react';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg?react';
import bow from 'destiny-icons/weapons/bow.svg?react';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg?react';
import glaive from 'destiny-icons/weapons/glaive.svg?react';
import gLauncher_special from 'destiny-icons/weapons/grenade_launcher-field_forged.svg?react';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg?react';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg?react';
import machinegun from 'destiny-icons/weapons/machinegun.svg?react';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg?react';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg?react';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg?react';
import shotgun from 'destiny-icons/weapons/shotgun.svg?react';
import sidearm from 'destiny-icons/weapons/sidearm.svg?react';
import smg from 'destiny-icons/weapons/smg.svg?react';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg?react';
import sword from 'destiny-icons/weapons/sword_heavy.svg?react';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg?react';
import energyWeaponSlot from 'images/weapon-slot-energy.svg?react';
import kineticWeaponSlot from 'images/weapon-slot-kinetic.svg?react';
import React from 'react';

export interface ItemCategoryIcon {
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  colorized: boolean;
}
function monochrome(svg: React.FC<React.SVGProps<SVGSVGElement>>): ItemCategoryIcon {
  return { svg, colorized: false };
}
function colorized(svg: React.FC<React.SVGProps<SVGSVGElement>>): ItemCategoryIcon {
  return { svg, colorized: true };
}

const weaponTypeSvgByCategoryHash: LookupTable<ItemCategoryHashes, ItemCategoryIcon> = {
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

const weaponSlotSvgByCategoryHash: LookupTable<ItemCategoryHashes, ItemCategoryIcon> = {
  [ItemCategoryHashes.KineticWeapon]: colorized(kineticWeaponSlot),
  [ItemCategoryHashes.EnergyWeapon]: colorized(energyWeaponSlot),
  [ItemCategoryHashes.PowerWeapon]: colorized(heavyAmmo),
};

const armorSlotSvgByCategoryHash: LookupTable<ItemCategoryHashes, ItemCategoryIcon> = {
  [ItemCategoryHashes.Helmets]: monochrome(helmet),
  [ItemCategoryHashes.Arms]: monochrome(gauntlets),
  [ItemCategoryHashes.Chest]: monochrome(chest),
  [ItemCategoryHashes.Legs]: monochrome(legs),
  [ItemCategoryHashes.ClassItems]: monochrome(classItem),
};

/**
 * A mapping from known item category hashes to an appropriate icon
 */
export const itemCategoryIcons: LookupTable<ItemCategoryHashes, ItemCategoryIcon> = {
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

/** A mapping from bucket hash to item category */
const bucketHashToItemCategoryHash: LookupTable<BucketHashes, ItemCategoryHashes> = {
  [BucketHashes.KineticWeapons]: ItemCategoryHashes.KineticWeapon,
  [BucketHashes.EnergyWeapons]: ItemCategoryHashes.EnergyWeapon,
  [BucketHashes.PowerWeapons]: ItemCategoryHashes.PowerWeapon,
  [BucketHashes.Helmet]: ItemCategoryHashes.Helmets,
  [BucketHashes.Gauntlets]: ItemCategoryHashes.Arms,
  [BucketHashes.ChestArmor]: ItemCategoryHashes.Chest,
  [BucketHashes.LegArmor]: ItemCategoryHashes.Legs,
  [BucketHashes.ClassArmor]: ItemCategoryHashes.ClassItems,
  [BucketHashes.Ghost]: ItemCategoryHashes.Ghost,
  [BucketHashes.Vehicle]: ItemCategoryHashes.Sparrows,
  [BucketHashes.Ships]: ItemCategoryHashes.Ships,
  [BucketHashes.Emblems]: ItemCategoryHashes.Emblems,
} as const;

/** an SVG of the weapon's type, if determinable */
export function getWeaponTypeSvgIconFromCategoryHashes(itemCategoryHashes: ItemCategoryHashes[]) {
  // reverse through the ICHs because most specific is last,
  // i.e. Weapon, Fusion Rifle, Linear Fusion Rifle
  for (const ich of itemCategoryHashes.toReversed()) {
    const svg = weaponTypeSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}

/** an SVG of the weapon's type, if determinable */
export function getWeaponTypeSvgIcon(item: DimItem) {
  return getWeaponTypeSvgIconFromCategoryHashes(item.itemCategoryHashes);
}

/** an SVG of the weapon's slot, if possible */
export function getWeaponSlotSvgIcon(item: DimItem) {
  for (const ich of item.itemCategoryHashes.toReversed()) {
    const svg = weaponSlotSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}

/** an SVG of the armor's slot, if determinable */
export function getArmorSlotSvgIcon(item: DimItem) {
  for (const ich of item.itemCategoryHashes.toReversed()) {
    const svg = armorSlotSvgByCategoryHash[ich];
    if (svg) {
      return svg;
    }
  }
}

/** an SVG of the bucket's icon, if determinable */
export function getBucketSvgIcon(bucketHash: BucketHashes) {
  const ich = bucketHashToItemCategoryHash[bucketHash];
  if (ich) {
    return itemCategoryIcons[ich];
  }
}
