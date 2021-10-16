import type { DimBucketCategory, DimBucketType } from 'app/inventory/inventory-buckets';

export const D1Categories: {
  [key in DimBucketCategory]: DimBucketType[];
} = {
  Postmaster: ['LostItems', 'SpecialOrders', 'Messages'],
  Weapons: ['Primary', 'Special', 'Heavy'],
  Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
  General: [
    'Class',
    'Artifact',
    'Ghost',
    'Consumable',
    'Material',
    'Ornaments',
    'Emblem',
    'Shader',
    'Emote',
    'Ship',
    'Vehicle',
    'Horn',
  ],
  Progress: ['Bounties', 'Quests', 'Missions'],
};
