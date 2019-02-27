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
export const D2CurrentSeason: number = D2SeasonEnum.JOKERS_WILD;

export const D2SeasonInfo = {
  1: {
    DLCName: 'Red War',
    seasonName: 'Red War',
    season: 1,
    year: 1,
    maxLevel: 20,
    maxPower: 300,
    softCap: 285,
    releaseDate: '2017-09-06',
    resetTime: '09:00:00Z'
  },
  2: {
    DLCName: 'Curse of Osiris',
    seasonName: 'Curse of Osiris',
    season: 2,
    year: 1,
    maxLevel: 25,
    maxPower: 330,
    softCap: 320,
    releaseDate: '2017-12-05',
    resetTime: '17:00:00Z'
  },
  3: {
    DLCName: 'Warmind',
    seasonName: 'Warmind',
    season: 3,
    year: 1,
    maxLevel: 30,
    maxPower: 380,
    softCap: 340,
    releaseDate: '2018-05-08',
    resetTime: '18:00:00Z'
  },
  4: {
    DLCName: 'Forsaken',
    seasonName: 'Season of the Outlaw',
    season: 4,
    year: 2,
    maxLevel: 50,
    maxPower: 600,
    softCap: 500,
    releaseDate: '2018-09-04',
    resetTime: '17:00:00Z'
  },
  5: {
    DLCName: 'Black Armory',
    seasonName: 'Season of the Forge',
    season: 5,
    year: 2,
    maxLevel: 50,
    maxPower: 650,
    softCap: 500,
    releaseDate: '2018-11-27',
    resetTime: '17:00:00Z'
  },
  6: {
    DLCName: "Joker's Wild",
    seasonName: 'Season of the Drifter',
    season: 6,
    year: 2,
    maxLevel: 50,
    maxPower: 700,
    softCap: 500,
    releaseDate: '2019-03-05', // TODO: Update this upon confirmation
    resetTime: '17:00:00Z'
  },
  7: {
    DLCName: 'Penumbra',
    seasonName: 'Season of the _______',
    season: 7,
    year: 2,
    maxLevel: 50,
    maxPower: 750,
    softCap: 500,
    releaseDate: '2019-06-25', // TODO: Update this upon confirmation
    resetTime: '17:00:00Z'
  }
};

function enumLength(enumName: any): number {
  // https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
  let count = 0;
  for (const item in enumName) {
    if (isNaN(Number(item))) {
      count++;
    }
  }
  return count;
}

function getCurrentSeason(): number {
  let seasonDate: Date;
  const today = new Date(Date.now());
  for (let i = enumLength(D2SeasonEnum); i > 0; i--) {
    seasonDate = new Date(`${D2SeasonInfo[i].releaseDate}T${D2SeasonInfo[i].resetTime}`);
    if (today >= seasonDate) {
      return D2SeasonInfo[i].season;
    }
  }
  return 0;
}

export const D2CalculatedSeason: number = getCurrentSeason();
