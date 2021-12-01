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
  [ItemCategoryHashes.KineticWeapon]: String.fromCodePoint(FontGlyphs.environment_hazard),
  [ItemCategoryHashes.EnergyWeapon]: energyWeapon,
  [ItemCategoryHashes.PowerWeapon]: powerWeapon,
  [ItemCategoryHashes.Weapon]: String.fromCodePoint(FontGlyphs.hand_cannon),
  [ItemCategoryHashes.AutoRifle]: String.fromCodePoint(FontGlyphs.auto_rifle),
  [ItemCategoryHashes.HandCannon]: String.fromCodePoint(FontGlyphs.hand_cannon),
  [ItemCategoryHashes.PulseRifle]: String.fromCodePoint(FontGlyphs.pulse_rifle),
  [ItemCategoryHashes.ScoutRifle]: String.fromCodePoint(FontGlyphs.scout_rifle),
  [ItemCategoryHashes.Sidearm]: String.fromCodePoint(FontGlyphs.sidearm),
  [ItemCategoryHashes.Bows]: String.fromCodePoint(FontGlyphs.bow),
  [ItemCategoryHashes.SubmachineGuns]: String.fromCodePoint(FontGlyphs.smg),
  [ItemCategoryHashes.FusionRifle]: String.fromCodePoint(FontGlyphs.fusion_rifle),
  [ItemCategoryHashes.SniperRifle]: String.fromCodePoint(FontGlyphs.sniper_rifle),
  [ItemCategoryHashes.Shotgun]: String.fromCodePoint(FontGlyphs.shotgun),
  [ItemCategoryHashes.TraceRifles]: String.fromCodePoint(FontGlyphs.beam_weapon),
  [ItemCategoryHashes.MachineGun]: String.fromCodePoint(FontGlyphs.machinegun),
  [ItemCategoryHashes.Sword]: String.fromCodePoint(FontGlyphs.sword_heavy),
  [ItemCategoryHashes.GrenadeLaunchers]: String.fromCodePoint(FontGlyphs.grenade_launcher),
  [-ItemCategoryHashes.GrenadeLaunchers]: String.fromCodePoint(
    FontGlyphs.grenade_launcher_field_forged
  ),
  [ItemCategoryHashes.RocketLauncher]: String.fromCodePoint(FontGlyphs.rocket_launcher),
  [ItemCategoryHashes.LinearFusionRifles]: String.fromCodePoint(FontGlyphs.wire_rifle),
  [ItemCategoryHashes.Hunter]: hunter,
  [ItemCategoryHashes.Titan]: titan,
  [ItemCategoryHashes.Warlock]: warlock,
  [ItemCategoryHashes.Ghost]: ghost,
} as const;
