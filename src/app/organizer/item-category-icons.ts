import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
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

/**
 * A mapping from known item category hashes to an appropriate icon
 */
export const itemCategoryIcons: { [itemCategoryHash: number]: string } = {
  [ItemCategoryHashes.Helmets]: helmet,
  [ItemCategoryHashes.Arms]: gauntlets,
  [ItemCategoryHashes.Chest]: chest,
  [ItemCategoryHashes.Legs]: legs,
  [ItemCategoryHashes.ClassItems]: classItem,
  [ItemCategoryHashes.KineticWeapon]: String(FontGlyphs.environment_hazard),
  [ItemCategoryHashes.EnergyWeapon]: energyWeapon,
  [ItemCategoryHashes.PowerWeapon]: powerWeapon,
  [ItemCategoryHashes.Weapon]: String(FontGlyphs.hand_cannon),
  [ItemCategoryHashes.AutoRifle]: String(FontGlyphs.auto_rifle),
  [ItemCategoryHashes.HandCannon]: String(FontGlyphs.hand_cannon),
  [ItemCategoryHashes.PulseRifle]: String(FontGlyphs.pulse_rifle),
  [ItemCategoryHashes.ScoutRifle]: String(FontGlyphs.scout_rifle),
  [ItemCategoryHashes.Sidearm]: String(FontGlyphs.sidearm),
  [ItemCategoryHashes.Bows]: String(FontGlyphs.bow),
  [ItemCategoryHashes.SubmachineGuns]: String(FontGlyphs.smg),
  [ItemCategoryHashes.FusionRifle]: String(FontGlyphs.fusion_rifle),
  [ItemCategoryHashes.SniperRifle]: String(FontGlyphs.sniper_rifle),
  [ItemCategoryHashes.Shotgun]: String(FontGlyphs.shotgun),
  [ItemCategoryHashes.TraceRifles]: String(FontGlyphs.beam_weapon),
  [ItemCategoryHashes.MachineGun]: String(FontGlyphs.machinegun),
  [ItemCategoryHashes.Sword]: String(FontGlyphs.sword_heavy),
  [ItemCategoryHashes.GrenadeLaunchers]: String(FontGlyphs.grenade_launcher),
  [-ItemCategoryHashes.GrenadeLaunchers]: String(FontGlyphs.grenade_launcher_field_forged),
  [ItemCategoryHashes.RocketLauncher]: String(FontGlyphs.rocket_launcher),
  [ItemCategoryHashes.LinearFusionRifles]: String(FontGlyphs.wire_rifle),
  [ItemCategoryHashes.Hunter]: hunter,
  [ItemCategoryHashes.Titan]: titan,
  [ItemCategoryHashes.Warlock]: warlock,
  [ItemCategoryHashes.Ghost]: ghost,
} as const;
