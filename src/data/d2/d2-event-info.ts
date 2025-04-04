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
    sources: [464727567, 547767158, 629617846, 2364515524, 3092212681, 3952847349, 4054646289],
    engram: [1170720694, 3151770741, 3488374611],
  },
  2: {
    name: 'Crimson Days',
    shortname: 'crimsondays',
    sources: [2502262376],
    engram: [191363032, 3373123597],
  },
  3: {
    name: 'Solstice',
    shortname: 'solstice',
    sources: [151416041, 641018908, 1666677522, 2050870152, 3724111213],
    engram: [821844118],
  },
  4: {
    name: 'Festival of the Lost',
    shortname: 'fotl',
    sources: [1054169368, 1677921161, 1919933822, 3190938946, 3482766024, 3693722471, 4041583267],
    engram: [1451959506, 1553479004],
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
    sources: [611838069, 1568732528, 2006303146, 2011810450, 2473294025, 3095773956, 3388021959],
    engram: [],
  },
};

export type D2EventIndex = keyof typeof D2EventInfo;

export const D2EventPredicateLookup = {
  dawning: D2EventEnum.DAWNING,
  crimsondays: D2EventEnum.CRIMSON_DAYS,
  solstice: D2EventEnum.SOLSTICE_OF_HEROES,
  fotl: D2EventEnum.FESTIVAL_OF_THE_LOST,
  revelry: D2EventEnum.REVELRY,
  games: D2EventEnum.GUARDIAN_GAMES,
};

export const D2SourcesToEvent = {
  464727567: D2EventEnum.DAWNING,
  547767158: D2EventEnum.DAWNING,
  629617846: D2EventEnum.DAWNING,
  2364515524: D2EventEnum.DAWNING,
  3092212681: D2EventEnum.DAWNING,
  3952847349: D2EventEnum.DAWNING,
  4054646289: D2EventEnum.DAWNING,
  2502262376: D2EventEnum.CRIMSON_DAYS,
  151416041: D2EventEnum.SOLSTICE_OF_HEROES,
  641018908: D2EventEnum.SOLSTICE_OF_HEROES,
  1666677522: D2EventEnum.SOLSTICE_OF_HEROES,
  2050870152: D2EventEnum.SOLSTICE_OF_HEROES,
  3724111213: D2EventEnum.SOLSTICE_OF_HEROES,
  1054169368: D2EventEnum.FESTIVAL_OF_THE_LOST,
  1677921161: D2EventEnum.FESTIVAL_OF_THE_LOST,
  1919933822: D2EventEnum.FESTIVAL_OF_THE_LOST,
  3190938946: D2EventEnum.FESTIVAL_OF_THE_LOST,
  3482766024: D2EventEnum.FESTIVAL_OF_THE_LOST,
  3693722471: D2EventEnum.FESTIVAL_OF_THE_LOST,
  4041583267: D2EventEnum.FESTIVAL_OF_THE_LOST,
  2187511136: D2EventEnum.REVELRY,
  611838069: D2EventEnum.GUARDIAN_GAMES,
  1568732528: D2EventEnum.GUARDIAN_GAMES,
  2006303146: D2EventEnum.GUARDIAN_GAMES,
  2011810450: D2EventEnum.GUARDIAN_GAMES,
  2473294025: D2EventEnum.GUARDIAN_GAMES,
  3095773956: D2EventEnum.GUARDIAN_GAMES,
  3388021959: D2EventEnum.GUARDIAN_GAMES,
};
