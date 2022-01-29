import type { D1BucketCategory, DimBucketType } from 'app/inventory-stores/inventory-buckets';

export const D1Categories: {
  [key in D1BucketCategory]: DimBucketType[];
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
