import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import hunter from 'destiny-icons/general/class_hunter.svg';
import titan from 'destiny-icons/general/class_titan.svg';
import warlock from 'destiny-icons/general/class_warlock.svg';
import emblem from 'destiny-icons/general/emblem.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import ship from 'destiny-icons/general/ship.svg';
import sparrow from 'destiny-icons/general/sparrow.svg';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import gLauncherFF from 'destiny-icons/weapons/grenade_launcher-field_forged.svg';
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

/**
 * A mapping from known item category hashes to an appropriate icon
 */
export const itemCategoryIcons: { [itemCategoryHash: number]: string } = {
  [ItemCategoryHashes.Helmets]: helmet,
  [ItemCategoryHashes.Arms]: gauntlets,
  [ItemCategoryHashes.Chest]: chest,
  [ItemCategoryHashes.Legs]: legs,
  [ItemCategoryHashes.ClassItems]: classItem,
  [ItemCategoryHashes.KineticWeapon]: dmgKinetic,
  [ItemCategoryHashes.EnergyWeapon]: energyWeapon,
  [ItemCategoryHashes.PowerWeapon]: powerWeapon,
  [ItemCategoryHashes.Weapon]: handCannon,
  [ItemCategoryHashes.AutoRifle]: autoRifle,
  [ItemCategoryHashes.HandCannon]: handCannon,
  [ItemCategoryHashes.PulseRifle]: pulseRifle,
  [ItemCategoryHashes.ScoutRifle]: scoutRifle,
  [ItemCategoryHashes.Sidearm]: sidearm,
  [ItemCategoryHashes.Bows]: bow,
  [ItemCategoryHashes.SubmachineGuns]: smg,
  [ItemCategoryHashes.FusionRifle]: fusionRifle,
  [ItemCategoryHashes.SniperRifle]: sniperRifle,
  [ItemCategoryHashes.Shotgun]: shotgun,
  [ItemCategoryHashes.TraceRifles]: traceRifle,
  [ItemCategoryHashes.MachineGun]: machinegun,
  [ItemCategoryHashes.Sword]: sword,
  [ItemCategoryHashes.GrenadeLaunchers]: gLauncher,
  [-ItemCategoryHashes.GrenadeLaunchers]: gLauncherFF,
  [ItemCategoryHashes.RocketLauncher]: rLauncher,
  [ItemCategoryHashes.LinearFusionRifles]: lFusionRifle,
  [ItemCategoryHashes.Hunter]: hunter,
  [ItemCategoryHashes.Titan]: titan,
  [ItemCategoryHashes.Warlock]: warlock,
  [ItemCategoryHashes.Ghost]: ghost,
  [ItemCategoryHashes.Sparrows]: sparrow,
  [ItemCategoryHashes.Ships]: ship,
  [ItemCategoryHashes.Emblems]: emblem,
} as const;

/** A mapping from bucket hash to item category */
export const bucketHashToItemCategoryHash = {
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
