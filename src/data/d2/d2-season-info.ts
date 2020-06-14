export enum D2SeasonEnum {
  DEBUG,
  RED_WAR,
  CURSE_OF_OSIRIS,
  WARMIND,
  FORSAKEN,
  BLACK_ARMORY,
  JOKERS_WILD,
  PENUMBRA,
  SHADOWKEEP,
  DAWN,
  WORTHY,
  REDACTED_11, // TODO: Update on verification
  REDACTED_12, // TODO: Update on verification

  __LENGTH__, // This always needs to be last
}

export const D2SeasonInfo = {
  0: {
    DLCName: 'Debug',
    seasonName: 'Debug',
    seasonTag: 'debug',
    season: 0,
    year: 0,
    maxLevel: 0,
    maxPower: 0,
    softCap: 0,
    releaseDate: '2017-09-06',
    resetTime: '09:00:00Z',
    numWeeks: 0,
  },
  1: {
    DLCName: 'Red War',
    seasonName: 'Red War',
    seasonTag: 'redwar',
    season: 1,
    year: 1,
    maxLevel: 20,
    maxPower: 300,
    softCap: 285,
    releaseDate: '2017-09-06',
    resetTime: '09:00:00Z',
    numWeeks: 13,
  },
  2: {
    DLCName: 'Curse of Osiris',
    seasonName: 'Curse of Osiris',
    seasonTag: 'osiris',
    season: 2,
    year: 1,
    maxLevel: 25,
    maxPower: 330,
    softCap: 320,
    releaseDate: '2017-12-05',
    resetTime: '17:00:00Z',
    numWeeks: 22,
  },
  3: {
    DLCName: 'Warmind',
    seasonName: 'Warmind',
    seasonTag: 'warmind',
    season: 3,
    year: 1,
    maxLevel: 30,
    maxPower: 380,
    softCap: 340,
    releaseDate: '2018-05-08',
    resetTime: '18:00:00Z',
    numWeeks: 17,
  },
  4: {
    DLCName: 'Forsaken',
    seasonName: 'Season of the Outlaw',
    seasonTag: 'outlaw',
    season: 4,
    year: 2,
    maxLevel: 50,
    maxPower: 600,
    softCap: 500,
    releaseDate: '2018-09-04',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  5: {
    DLCName: 'Black Armory',
    seasonName: 'Season of the Forge',
    seasonTag: 'forge',
    season: 5,
    year: 2,
    maxLevel: 50,
    maxPower: 650,
    softCap: 500,
    releaseDate: '2018-11-27',
    resetTime: '17:00:00Z',
    numWeeks: 12,
  },
  6: {
    DLCName: "Joker's Wild",
    seasonName: 'Season of the Drifter',
    seasonTag: 'drifter',
    season: 6,
    year: 2,
    maxLevel: 50,
    maxPower: 700,
    softCap: 500,
    releaseDate: '2019-03-05',
    resetTime: '17:00:00Z',
    numWeeks: 14,
  },
  7: {
    DLCName: 'Penumbra',
    seasonName: 'Season of Opulence',
    seasonTag: 'opulence',
    season: 7,
    year: 2,
    maxLevel: 50,
    maxPower: 750,
    softCap: 500,
    releaseDate: '2019-06-04',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  8: {
    DLCName: 'Shadowkeep',
    seasonName: 'Season of the Undying',
    seasonTag: 'undying',
    season: 8,
    year: 3,
    maxLevel: 50,
    maxPower: 960,
    softCap: 900,
    releaseDate: '2019-10-01',
    resetTime: '17:00:00Z',
    numWeeks: 10,
  },
  9: {
    DLCName: '',
    seasonName: 'Season of Dawn',
    seasonTag: 'dawn',
    season: 9,
    year: 3,
    maxLevel: 50,
    maxPower: 970,
    softCap: 900,
    releaseDate: '2019-12-10',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  10: {
    DLCName: '',
    seasonName: 'Season of the Worthy',
    seasonTag: 'worthy',
    season: 10,
    year: 3,
    maxLevel: 50,
    maxPower: 1010,
    softCap: 950,
    releaseDate: '2020-03-10',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  11: {
    DLCName: '',
    seasonName: 'Season of the Arrivals',
    seasonTag: 'arrival',
    season: 11,
    year: 3,
    maxLevel: 50,
    maxPower: 1060,
    softCap: 1000,
    releaseDate: '2020-06-09',
    resetTime: '17:00:00Z',
    numWeeks: 15,
  },
  12: {
    DLCName: 'Beyond Light',
    seasonName: 'Season of [the Redacted-12]', // TODO: Update on verification
    seasonTag: 'redacted-12', // TODO: Update on verification
    season: 12,
    year: 4,
    maxLevel: 50,
    maxPower: 1110, // TODO: Update on verification
    softCap: 1050, // TODO: Update on verification
    releaseDate: '2020-09-22',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
} as Record<
  number,
  {
    DLCName: string;
    seasonName: string;
    seasonTag: string;
    season: number;
    year: number;
    maxLevel: number;
    maxPower: number;
    softCap: number;
    releaseDate: string;
    resetTime: string;
    numWeeks: number;
  }
>;

function getCurrentSeason(): number {
  let seasonDate: Date;
  const today = new Date();
  for (let i = D2SeasonEnum.__LENGTH__ - 1; i > 0; i--) {
    seasonDate = new Date(`${D2SeasonInfo[i].releaseDate}T${D2SeasonInfo[i].resetTime}`);
    if (today >= seasonDate) {
      return D2SeasonInfo[i].season;
    }
  }
  return 0;
}

export const D2CalculatedSeason: number = getCurrentSeason();
