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
    softCap: 285,
    release: 'September 6 2017',
    resetTime: '09:00 UTC'
  },
  2: {
    DLCName: 'Curse of Osiris',
    seasonName: 'Curse of Osiris',
    season: 2,
    year: 1,
    maxLevel: 25,
    maxPower: 330,
    softCap: 320,
    release: 'December 5 2017',
    resetTime: '17:00 UTC'
  },
  3: {
    DLCName: 'Warmind',
    seasonName: 'Warmind',
    season: 3,
    year: 1,
    maxLevel: 30,
    maxPower: 380,
    softCap: 340,
    release: 'May 8 2018',
    resetTime: '18:00 UTC'
  },
  4: {
    DLCName: 'Forsaken',
    seasonName: 'Season of the Outlaw',
    season: 4,
    year: 2,
    maxLevel: 50,
    maxPower: 600,
    softCap: 500,
    release: 'September 4 2018',
    resetTime: '17:00 UTC'
  },
  5: {
    DLCName: 'Black Armory',
    seasonName: 'Season of the Forge',
    season: 5,
    year: 2,
    maxLevel: 50,
    maxPower: 650,
    softCap: 500,
    release: 'November 27 2018',
    resetTime: '17:00 UTC'
  },
  6: {
    DLCName: "Joker's Wild",
    seasonName: 'Season of the Drifter',
    season: 6,
    year: 2,
    maxLevel: 50,
    maxPower: 700,
    softCap: 500,
    release: 'February 26 2019', // TODO: Update this upon confirmation
    resetTime: '17:00 UTC'
  },
  7: {
    DLCName: 'Penumbra',
    seasonName: 'Season of the _______',
    season: 7,
    year: 2,
    maxLevel: 50,
    maxPower: 750,
    softCap: 500,
    release: 'June 25 2019', // TODO: Update this upon confirmation
    resetTime: '17:00 UTC'
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
  for (let i = enumLength(D2SeasonEnum); i--; ) {
    seasonDate = new Date(`${D2SeasonInfo[i].release} ${D2SeasonInfo[i].resetTime}`);
    if (today >= seasonDate) {
      return D2SeasonInfo[i].season;
    }
  }
  return 0;
}

export const D2CalculatedSeason: number = getCurrentSeason();
