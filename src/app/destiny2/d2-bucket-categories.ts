import { DimBucketType } from './d2-buckets';

export const D2Categories: {
  [key in 'Postmaster' | 'Weapons' | 'Armor' | 'General' | 'Inventory']: DimBucketType[];
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
