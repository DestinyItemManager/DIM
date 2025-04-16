export const enum D2EventEnum {
  DAWNING = 1,
  CRIMSON_DAYS,
  SOLSTICE_OF_HEROES,
  FESTIVAL_OF_THE_LOST,
  REVELRY,
  GUARDIAN_GAMES,
}

export const D2EventInfo = {
  [D2EventEnum.DAWNING]: {
    name: 'The Dawning',
    shortname: 'dawning',
    sources: [464727567, 547767158, 629617846, 2364515524, 3092212681, 3952847349, 4054646289],
    engram: [1170720694, 3151770741, 3488374611],
  },
  [D2EventEnum.CRIMSON_DAYS]: {
    name: 'Crimson Days',
    shortname: 'crimsondays',
    sources: [2502262376],
    engram: [191363032, 3373123597],
  },
  [D2EventEnum.SOLSTICE_OF_HEROES]: {
    name: 'Solstice',
    shortname: 'solstice',
    sources: [151416041, 641018908, 1666677522, 2050870152, 3724111213],
    engram: [821844118],
  },
  [D2EventEnum.FESTIVAL_OF_THE_LOST]: {
    name: 'Festival of the Lost',
    shortname: 'fotl',
    sources: [1054169368, 1677921161, 1919933822, 3190938946, 3482766024, 3693722471, 4041583267],
    engram: [1451959506, 1553479004],
  },
  [D2EventEnum.REVELRY]: {
    name: 'The Revelry',
    shortname: 'revelry',
    sources: [2187511136],
    engram: [1974821348, 2570200927],
  },
  [D2EventEnum.GUARDIAN_GAMES]: {
    name: 'Guardian Games',
    shortname: 'games',
    sources: [611838069, 1568732528, 2006303146, 2011810450, 2473294025, 3095773956, 3388021959],
    engram: [],
  },
};
