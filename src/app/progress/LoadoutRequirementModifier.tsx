import React from 'react';
import { DestinyMilestoneChallengeActivity, DestinyItemSubType } from 'bungie-api-ts/destiny2';
import BungieImage from 'app/dim-ui/BungieImage';
import PressTip from 'app/dim-ui/PressTip';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import './ActivityModifier.scss';
import { ARMSMASTER_ACTIVITY_MODIFIER } from 'app/search/d2-known-values';

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
  // END useless types
  [DestinyItemSubType.AutoRifle]: 5,
  [DestinyItemSubType.Shotgun]: 11,
  [DestinyItemSubType.Machinegun]: 12,
  [DestinyItemSubType.HandCannon]: 6,
  [DestinyItemSubType.RocketLauncher]: 13,
  [DestinyItemSubType.FusionRifle]: 9,
  [DestinyItemSubType.SniperRifle]: 10,
  [DestinyItemSubType.PulseRifle]: 7,
  [DestinyItemSubType.ScoutRifle]: 8,
  [DestinyItemSubType.Sidearm]: 14,
  [DestinyItemSubType.Sword]: 54,
  [DestinyItemSubType.Mask]: 0,
  [DestinyItemSubType.Shader]: 0,
  [DestinyItemSubType.Ornament]: 0,
  [DestinyItemSubType.FusionRifleLine]: 1504945536,
  [DestinyItemSubType.GrenadeLauncher]: 153950757,
  [DestinyItemSubType.SubmachineGun]: 3954685534,
  [DestinyItemSubType.TraceRifle]: 2489664120,
  [DestinyItemSubType.Bow]: 3317538576,
};

/**
 * This table lets us load localized names for equipment slots from the ItemCategory definitions
 * so we don't have to load the EquipmentSlot definitions.
 */
const equipmentSlotHashToItemCategoryHash = {
  1498876634: 2, // Kinetic
  2465295065: 3, // Energy
  953998645: 4, // Power
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
  defs,
}: {
  activity: DestinyMilestoneChallengeActivity;
  defs: D2ManifestDefinitions;
}) {
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

  const description = (
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

  return (
    <div className="milestone-modifier">
      <BungieImage src={modifier.displayProperties.icon} />
      <div className="milestone-modifier-info">
        <PressTip tooltip={description}>
          <div className="milestone-modifier-name">{modifier.displayProperties.name}</div>
        </PressTip>
      </div>
    </div>
  );
}
