export const enum D2EventEnum {
  DAWNING = 1,
  CRIMSON_DAYS,
  SOLSTICE_OF_HEROES,
  FESTIVAL_OF_THE_LOST,
  REVELRY,
  GUARDIAN_GAMES,
}

export const D2EventInfo = {
  1: {
    name: 'The Dawning',
    shortname: 'dawning',
    sources: [3952847349, 4054646289],
    engram: [1170720694, 3151770741],
  },
  2: {
    name: 'Crimson Days',
    shortname: 'crimsondays',
    sources: [2502262376],
    engram: [191363032, 3373123597],
  },
  3: {
    name: 'Solstice of Heroes',
    shortname: 'solstice',
    sources: [151416041, 641018908, 3724111213],
    engram: [821844118],
  },
  4: {
    name: 'Festival of the Lost',
    shortname: 'fotl',
    sources: [1677921161, 3190938946],
    engram: [1451959506],
  },
  5: {
    name: 'The Revelry',
    shortname: 'revelry',
    sources: [2187511136],
    engram: [1974821348, 2570200927],
  },
  6: {
    name: 'Guardian Games',
    shortname: 'games',
    sources: [611838069, 3388021959],
    engram: [],
  },
};

export const D2EventPredicateLookup = {
  dawning: D2EventEnum.DAWNING,
  crimsondays: D2EventEnum.CRIMSON_DAYS,
  solstice: D2EventEnum.SOLSTICE_OF_HEROES,
  fotl: D2EventEnum.FESTIVAL_OF_THE_LOST,
  revelry: D2EventEnum.REVELRY,
  games: D2EventEnum.GUARDIAN_GAMES,
};

export const D2SourcesToEvent = {
  3952847349: D2EventEnum.DAWNING,
  4054646289: D2EventEnum.DAWNING,
  2502262376: D2EventEnum.CRIMSON_DAYS,
  151416041: D2EventEnum.SOLSTICE_OF_HEROES,
  641018908: D2EventEnum.SOLSTICE_OF_HEROES,
  3724111213: D2EventEnum.SOLSTICE_OF_HEROES,
  1677921161: D2EventEnum.FESTIVAL_OF_THE_LOST,
  3190938946: D2EventEnum.FESTIVAL_OF_THE_LOST,
  2187511136: D2EventEnum.REVELRY,
  611838069: D2EventEnum.GUARDIAN_GAMES,
  3388021959: D2EventEnum.GUARDIAN_GAMES,
};
