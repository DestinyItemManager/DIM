import type { D1BucketCategory } from 'app/inventory/inventory-buckets';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { BucketHashes } from 'data/d2/generated-enums';

export const D1Categories: {
  [key in D1BucketCategory]: (BucketHashes | D1BucketHashes)[];
} = {
  Postmaster: [BucketHashes.LostItems, BucketHashes.SpecialOrders, BucketHashes.Messages],
  Weapons: [BucketHashes.KineticWeapons, BucketHashes.EnergyWeapons, BucketHashes.PowerWeapons],
  Armor: [
    BucketHashes.Helmet,
    BucketHashes.Gauntlets,
    BucketHashes.ChestArmor,
    BucketHashes.LegArmor,
    BucketHashes.ClassArmor,
  ],
  General: [
    BucketHashes.Subclass,
    D1BucketHashes.Artifact,
    BucketHashes.Ghost,
    BucketHashes.Consumables,
    BucketHashes.Materials,
    BucketHashes.Modifications,
    BucketHashes.Emblems,
    D1BucketHashes.Shader,
    BucketHashes.Emotes_Equippable,
    BucketHashes.Ships,
    BucketHashes.Vehicle,
    D1BucketHashes.Horn,
  ],
  Progress: [D1BucketHashes.Bounties, D1BucketHashes.Quests, D1BucketHashes.Missions],
};
