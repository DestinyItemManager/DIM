import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { useD2Definitions } from 'app/manifest/selectors';
import { ARMSMASTER_ACTIVITY_MODIFIER } from 'app/search/d2-known-values';
import { DestinyItemSubType, DestinyMilestoneChallengeActivity } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import './ActivityModifier.scss';

/**
 * This table lets us use localized names for ItemSubTypes, since they only exist as enum values.EquipmentSlot definitions.
 * Non-weapons are included but set to the null category so TypeScript will tell us if something is added and we don't map it.
 */
const itemSubTypeToItemCategoryHash: { [key in DestinyItemSubType]: number } = {
  // START useless types
  [DestinyItemSubType.None]: 17,
  [DestinyItemSubType.Crucible]: 17,
  [DestinyItemSubType.Vanguard]: 17,
  [DestinyItemSubType.Exotic]: 17,
  [DestinyItemSubType.Crm]: 17,
  [DestinyItemSubType.HelmetArmor]: 17,
  [DestinyItemSubType.GauntletsArmor]: 17,
  [DestinyItemSubType.ChestArmor]: 17,
  [DestinyItemSubType.LegArmor]: 17,
  [DestinyItemSubType.ClassArmor]: 17,
  [DestinyItemSubType.DummyRepeatableBounty]: 17,
  // END useless types
  [DestinyItemSubType.AutoRifle]: ItemCategoryHashes.AutoRifle,
  [DestinyItemSubType.Shotgun]: ItemCategoryHashes.Shotgun,
  [DestinyItemSubType.Machinegun]: ItemCategoryHashes.MachineGun,
  [DestinyItemSubType.HandCannon]: ItemCategoryHashes.HandCannon,
  [DestinyItemSubType.RocketLauncher]: ItemCategoryHashes.RocketLauncher,
  [DestinyItemSubType.FusionRifle]: ItemCategoryHashes.FusionRifle,
  [DestinyItemSubType.SniperRifle]: ItemCategoryHashes.SniperRifle,
  [DestinyItemSubType.PulseRifle]: ItemCategoryHashes.PulseRifle,
  [DestinyItemSubType.ScoutRifle]: ItemCategoryHashes.ScoutRifle,
  [DestinyItemSubType.Sidearm]: ItemCategoryHashes.Sidearm,
  [DestinyItemSubType.Sword]: ItemCategoryHashes.Sword,
  [DestinyItemSubType.Mask]: ItemCategoryHashes.Mask,
  [DestinyItemSubType.Shader]: ItemCategoryHashes.Shaders,
  [DestinyItemSubType.Ornament]: ItemCategoryHashes.Mods_Ornament,
  [DestinyItemSubType.FusionRifleLine]: ItemCategoryHashes.LinearFusionRifles,
  [DestinyItemSubType.GrenadeLauncher]: ItemCategoryHashes.GrenadeLaunchers,
  [DestinyItemSubType.SubmachineGun]: ItemCategoryHashes.SubmachineGuns,
  [DestinyItemSubType.TraceRifle]: ItemCategoryHashes.TraceRifles,
  [DestinyItemSubType.Bow]: ItemCategoryHashes.Bows,
  [DestinyItemSubType.Glaive]: ItemCategoryHashes.Glaives,
};

/**
 * This table lets us load localized names for equipment slots from the ItemCategory definitions
 * so we don't have to load the EquipmentSlot definitions.
 */
const equipmentSlotHashToItemCategoryHash = {
  1498876634: ItemCategoryHashes.KineticWeapon,
  2465295065: ItemCategoryHashes.EnergyWeapon,
  953998645: ItemCategoryHashes.PowerWeapon,
};

/**
 * Displays an alternate form of the "Armsmaster" activity modifier that's
 * generated from an activity's loadout requirement.
 *
 * Raid activities can have required loadouts, which fall under the "armsmaster" modifier. The
 * actual modifier text doesn't give the right info, so we'll build it ourselves from the loadout
 * data.
 */
export default function LoadoutRequirementModifier({
  activity,
}: {
  activity: DestinyMilestoneChallengeActivity;
}) {
  const defs = useD2Definitions()!;
  if (activity.loadoutRequirementIndex === undefined || activity.loadoutRequirementIndex === null) {
    return null;
  }

  const activityDef = defs.Activity.get(activity.activityHash);
  const modifier = defs.ActivityModifier.get(ARMSMASTER_ACTIVITY_MODIFIER);

  // Raid activities can have required loadouts, which fall under the "armsmaster" modifier. The
  // actual modifier text doesn't give the right info, so we'll build it ourselves from the loadout
  // data.
  const loadout = activityDef.loadouts[activity.loadoutRequirementIndex];
  const requirements = loadout.requirements.map((req) => ({
    slot: defs.ItemCategory.get(equipmentSlotHashToItemCategoryHash[req.equipmentSlotHash])
      .displayProperties.name,
    types: req.allowedWeaponSubTypes.map(
      (sub) => defs.ItemCategory.get(itemSubTypeToItemCategoryHash[sub]).displayProperties.name
    ),
  }));

  const description = () => (
    <>
      {modifier.displayProperties.description.split('\n')[0]}
      <br />
      {requirements.map((requirement) => (
        <div key={requirement.slot}>
          <b>{requirement.slot}:</b> {requirement.types.join(', ')}
        </div>
      ))}
    </>
  );

  const modifierName = modifier.displayProperties.name;
  const modifierIcon = modifier.displayProperties.icon;

  return (
    <div className="milestone-modifier">
      {Boolean(modifierIcon) && <BungieImage src={modifierIcon} />}
      {Boolean(modifierName) && (
        <div className="milestone-modifier-info">
          <PressTip tooltip={description}>
            <div className="milestone-modifier-name">{modifierName}</div>
          </PressTip>
        </div>
      )}
    </div>
  );
}
