export enum D2SeasonEnum {
  RED_WAR = 1,
  CURSE_OF_OSIRIS,
  WARMIND,
  FORSAKEN,
  BLACK_ARMORY,
  JOKERS_WILD,
  PENUMBRA
}

// TODO: Update on season change
export const D2CurrentSeason: number = D2SeasonEnum.BLACK_ARMORY;

export const D2SeasonInfo = {
  1: {
    DLCName: 'Red War',
    seasonName: 'Red War',
    season: 1,
    year: 1,
    maxLevel: 20,
    maxPower: 300,
    softCap: 285
  },
  2: {
    DLCName: 'Curse of Osiris',
    seasonName: 'Curse of Osiris',
    season: 2,
    year: 1,
    maxLevel: 25,
    maxPower: 330,
    softCap: 320
  },
  3: {
    DLCName: 'Warmind',
    seasonName: 'Warmind',
    season: 3,
    year: 1,
    maxLevel: 30,
    maxPower: 380,
    softCap: 340
  },
  4: {
    DLCName: 'Forsaken',
    seasonName: 'Season of the Outlaw',
    season: 4,
    year: 2,
    maxLevel: 50,
    maxPower: 600,
    softCap: 500
  },
  5: {
    DLCName: 'Black Armory',
    seasonName: 'Season of the Forge',
    season: 5,
    year: 2,
    maxLevel: 50,
    maxPower: 650,
    softCap: 500
  },
  6: {
    DLCName: "Joker's Wild",
    seasonName: 'Season of the Drifter',
    season: 6,
    year: 2,
    maxLevel: 50,
    maxPower: 700,
    softCap: 500
  },
  7: {
    DLCName: 'Penumbra',
    seasonName: 'Season of the _______',
    season: 7,
    year: 2,
    maxLevel: 50,
    maxPower: 750,
    softCap: 500
  }
};
