export enum D2EventEnum {
  DAWNING = 1,
  CRIMSON_DAYS,
  SOLSTICE_OF_HEROES,
  FESTIVAL_OF_THE_LOST
}

export const D2EventInfo = {
  1: {
    name: 'The Dawning',
    shortname: 'dawning',
    sources: [4054646289, 3952847349],
    engram: [1170720694, 3151770741]
  },
  2: {
    name: 'Crimson Days',
    shortname: 'crimsondays',
    sources: [2502262376],
    engram: [3373123597]
  },
  3: {
    name: 'Solstice of Heroes',
    shortname: 'solstice',
    sources: [641018908],
    engram: [821844118]
  },
  4: {
    name: 'Festival of the Lost',
    shortname: 'fotl',
    sources: [1677921161],
    engram: [1451959506]
  }
};

export const D2EventPredicateLookup = {
  dawning: D2EventEnum.DAWNING,
  crimsondays: D2EventEnum.CRIMSON_DAYS,
  solstice: D2EventEnum.SOLSTICE_OF_HEROES,
  fotl: D2EventEnum.FESTIVAL_OF_THE_LOST
};

export const D2SourcesToEvent = {
  4054646289: D2EventEnum.DAWNING,
  3952847349: D2EventEnum.DAWNING,
  2502262376: D2EventEnum.CRIMSON_DAYS,
  641018908: D2EventEnum.SOLSTICE_OF_HEROES,
  1677921161: D2EventEnum.FESTIVAL_OF_THE_LOST
};
