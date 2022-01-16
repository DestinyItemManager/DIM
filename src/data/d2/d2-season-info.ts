export enum D2SeasonEnum {
  RED_WAR = 1,
  CURSE_OF_OSIRIS,
  WARMIND,
  FORSAKEN,
  BLACK_ARMORY,
  JOKERS_WILD,
  PENUMBRA,
  SHADOWKEEP,
  DAWN,
  WORTHY,
  ARRIVAL,
  HUNT,
  CHOSEN,
  SPLICER,
  LOST,
  WITCH_QUEEN,

  __LENGTH__, // This always needs to be last
}

export const D2SeasonInfo = {
  1: {
    DLCName: 'Red War',
    seasonName: 'Red War',
    seasonTag: 'redwar',
    season: 1,
    maxLevel: 20,
    powerFloor: 0,
    softCap: 285,
    powerfulCap: 300,
    pinnacleCap: 300,
    releaseDate: '2017-09-06',
    resetTime: '09:00:00Z',
    numWeeks: 13,
  },
  2: {
    DLCName: 'Curse of Osiris',
    seasonName: 'Curse of Osiris',
    seasonTag: 'osiris',
    season: 2,
    maxLevel: 25,
    powerFloor: 0,
    softCap: 320,
    powerfulCap: 330,
    pinnacleCap: 330,
    releaseDate: '2017-12-05',
    resetTime: '17:00:00Z',
    numWeeks: 22,
  },
  3: {
    DLCName: 'Warmind',
    seasonName: 'Warmind',
    seasonTag: 'warmind',
    season: 3,
    maxLevel: 30,
    powerFloor: 0,
    softCap: 340,
    powerfulCap: 380,
    pinnacleCap: 380,
    releaseDate: '2018-05-08',
    resetTime: '18:00:00Z',
    numWeeks: 17,
  },
  4: {
    DLCName: 'Forsaken',
    seasonName: 'Season of the Outlaw',
    seasonTag: 'outlaw',
    season: 4,
    maxLevel: 50,
    powerFloor: 0,
    softCap: 500,
    powerfulCap: 600,
    pinnacleCap: 600,
    releaseDate: '2018-09-04',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  5: {
    DLCName: 'Black Armory',
    seasonName: 'Season of the Forge',
    seasonTag: 'forge',
    season: 5,
    maxLevel: 50,
    powerFloor: 0,
    softCap: 500,
    powerfulCap: 650,
    pinnacleCap: 650,
    releaseDate: '2018-11-27',
    resetTime: '17:00:00Z',
    numWeeks: 12,
  },
  6: {
    DLCName: "Joker's Wild",
    seasonName: 'Season of the Drifter',
    seasonTag: 'drifter',
    season: 6,
    maxLevel: 50,
    powerFloor: 0,
    softCap: 500,
    powerfulCap: 700,
    pinnacleCap: 700,
    releaseDate: '2019-03-05',
    resetTime: '17:00:00Z',
    numWeeks: 14,
  },
  7: {
    DLCName: 'Penumbra',
    seasonName: 'Season of Opulence',
    seasonTag: 'opulence',
    season: 7,
    maxLevel: 50,
    powerFloor: 0,
    softCap: 500,
    powerfulCap: 750,
    pinnacleCap: 750,
    releaseDate: '2019-06-04',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  8: {
    DLCName: 'Shadowkeep',
    seasonName: 'Season of the Undying',
    seasonTag: 'undying',
    season: 8,
    maxLevel: 50,
    powerFloor: 750,
    softCap: 900,
    powerfulCap: 950,
    pinnacleCap: 960,
    releaseDate: '2019-10-01',
    resetTime: '17:00:00Z',
    numWeeks: 10,
  },
  9: {
    DLCName: '',
    seasonName: 'Season of Dawn',
    seasonTag: 'dawn',
    season: 9,
    maxLevel: 50,
    powerFloor: 750,
    softCap: 900,
    powerfulCap: 960,
    pinnacleCap: 970,
    releaseDate: '2019-12-10',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  10: {
    DLCName: '',
    seasonName: 'Season of the Worthy',
    seasonTag: 'worthy',
    season: 10,
    maxLevel: 50,
    powerFloor: 750,
    softCap: 950,
    powerfulCap: 1000,
    pinnacleCap: 1010,
    releaseDate: '2020-03-10',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  11: {
    DLCName: '',
    seasonName: 'Season of the Arrivals',
    seasonTag: 'arrival',
    season: 11,
    maxLevel: 50,
    powerFloor: 750,
    softCap: 1000,
    powerfulCap: 1050,
    pinnacleCap: 1060,
    releaseDate: '2020-06-09',
    resetTime: '17:00:00Z',
    numWeeks: 15,
  },
  12: {
    DLCName: 'Beyond Light',
    seasonName: 'Season of the Hunt',
    seasonTag: 'hunt',
    season: 12,
    maxLevel: 50,
    powerFloor: 1050,
    softCap: 1200,
    powerfulCap: 1250,
    pinnacleCap: 1260,
    releaseDate: '2020-11-10',
    resetTime: '17:00:00Z',
    numWeeks: 12,
  },
  13: {
    DLCName: '',
    seasonName: 'Season of the Chosen',
    seasonTag: 'chosen',
    season: 13,
    maxLevel: 50,
    powerFloor: 1100,
    softCap: 1250,
    powerfulCap: 1300,
    pinnacleCap: 1310,
    releaseDate: '2021-02-09',
    resetTime: '17:00:00Z',
    numWeeks: 13,
  },
  14: {
    DLCName: '',
    seasonName: 'Season of the Splicer',
    seasonTag: 'splicer',
    season: 14,
    maxLevel: 50,
    powerFloor: 1100,
    softCap: 1250,
    powerfulCap: 1310,
    pinnacleCap: 1320,
    releaseDate: '2021-05-11',
    resetTime: '17:00:00Z',
    numWeeks: 15,
  },
  15: {
    DLCName: '',
    seasonName: 'Season of the Lost',
    seasonTag: 'lost',
    season: 15,
    maxLevel: 50,
    powerFloor: 1100,
    softCap: 1250,
    powerfulCap: 1320,
    pinnacleCap: 1330,
    releaseDate: '2021-08-24',
    resetTime: '17:00:00Z',
    numWeeks: 26,
  },
  16: {
    DLCName: 'Witch Queen',
    seasonName: 'Season of [REDACTED]',
    seasonTag: 'wq',
    season: 16,
    maxLevel: 50,
    powerFloor: 1100,
    softCap: 1250,
    powerfulCap: 1370,
    pinnacleCap: 1380,
    releaseDate: '2022-02-22',
    resetTime: '17:00:00Z',
    numWeeks: 15,
  },
} as Record<
  number,
  {
    DLCName: string;
    seasonName: string;
    seasonTag: string;
    season: number;
    maxLevel: number;
    powerFloor: number;
    softCap: number;
    powerfulCap: number;
    pinnacleCap: number;
    releaseDate: string;
    resetTime: string;
    numWeeks: number;
  }
>;

function getCurrentSeason(): number {
  const CLOSE_TO_RESET_HOURS = 5;
  const today = new Date();
  for (let i = D2SeasonEnum.__LENGTH__ - 1; i > 0; i--) {
    const seasonDate = new Date(`${D2SeasonInfo[i].releaseDate}T${D2SeasonInfo[i].resetTime}`);
    const closeToNewSeason =
      isToday(seasonDate) && numHoursBetween(today, seasonDate) <= CLOSE_TO_RESET_HOURS; // same day and within hours of reset
    if (today >= seasonDate || closeToNewSeason) {
      return D2SeasonInfo[i].season;
    }
  }
  return 0;
}

function numHoursBetween(d1: Date, d2: Date) {
  const MILLISECONDS_PER_HOUR = 3600000;
  return Math.abs(d1.getTime() - d2.getTime()) / MILLISECONDS_PER_HOUR;
}

function isToday(someDate: Date) {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
}

export const D2CalculatedSeason: number = getCurrentSeason();
