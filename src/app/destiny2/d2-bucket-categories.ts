import type { D2BucketCategory, DimBucketType } from 'app/inventory/inventory-buckets';

export const D2Categories: {
  [key in D2BucketCategory]: DimBucketType[];
} = {
  Postmaster: ['Engrams', 'LostItems', 'Messages', 'SpecialOrders'],
  Weapons: ['KineticSlot', 'Energy', 'Power'],
  Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
  General: [
    'Class',
    'Ghost',
    'Emblems',
    'Ships',
    'Vehicle',
    'Emotes',
    'Finishers',
    'SeasonalArtifacts',
  ],
  Inventory: ['Consumables', 'Modifications'],
};
