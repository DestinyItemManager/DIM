export const D2Categories = $featureFlags.newArrangement
  ? {
      Postmaster: ['Engrams', 'LostItems', 'Messages', 'SpecialOrders'],
      Weapons: ['Kinetic', 'Energy', 'Power'],
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
      Inventory: ['Consumables', 'Modifications', 'Shaders'],
    }
  : {
      Postmaster: ['Engrams', 'LostItems', 'Messages', 'SpecialOrders'],
      Weapons: ['Class', 'Kinetic', 'Energy', 'Power', 'SeasonalArtifacts'],
      Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
      General: ['Ghost', 'ClanBanners', 'Vehicle', 'Ships', 'Emblems', 'Finishers'],
      Inventory: ['Consumables', 'Modifications', 'Shaders'],
    };
