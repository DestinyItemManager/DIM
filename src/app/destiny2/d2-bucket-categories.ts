import type { DimBucketCategory, DimBucketType } from 'app/inventory/inventory-buckets';

export const D2Categories: {
  [key in DimBucketCategory]: DimBucketType[];
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
    'Finishers',
    'SeasonalArtifacts',
    'ClanBanners',
  ],
  Inventory: ['Consumables', 'Modifications'],
};
