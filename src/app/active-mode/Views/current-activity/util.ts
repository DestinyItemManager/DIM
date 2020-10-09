import { DestinyActivityModeType } from 'bungie-api-ts/destiny2';

export const enum Destinations {
  Orbit = 82913930,
  DreamingCity = 2877881518,
  EDZ = 3747705955,
  IO = 4251857532,
  Mars = 2426873752,
  Mercury = 1259908504,
  Moon = 3325508439,
  Nessus = 3526908984,
  TangledShore = 975684424,
  Titan = 386951460,
}

export const enum Vendors {
  AnaBray = 1735426333,
  AsherMir = 3982706173,
  Banshee = 672118013,
  BrotherVance = 2398407866,
  DevrimKay = 396892126,
  ErisMorn = 1616085565,
  EvaLevante = 919809084,
  Failsafe = 1576276905,
  Hawthorne = 3347378076,
  LordSaladin = 895295461,
  Petra = 1841717884, // or 1454616762
  PrismaticRecaster = 3993978686,
  Saint14 = 765357505,
  Shaxx = 3603221665,
  Sloane = 1062861569,
  Spider = 863940356,
  TheDrifter = 248695599,
  Zavala = 69482069,
}

// keys are based on data/d2/ghost-perks.json
export const ghostTypeToPlaceHash = {
  dreaming: Destinations.DreamingCity,
  edz: Destinations.EDZ,
  io: Destinations.IO,
  mars: Destinations.Mars,
  mercury: Destinations.Mercury,
  moon: Destinations.Moon,
  nessus: Destinations.Nessus,
  tangled: Destinations.TangledShore,
  titan: Destinations.Titan,
};

export const ghostTypeToActivityHash = {
  crucible: DestinyActivityModeType.AllPvP,
  gambit: DestinyActivityModeType.Gambit,
  leviathan: DestinyActivityModeType.Raid,
  strikes: DestinyActivityModeType.AllStrikes,
};

export const vendorsByActivityModeType = {
  [DestinyActivityModeType.Social]: [
    Vendors.EvaLevante,
    Vendors.PrismaticRecaster,
    Vendors.Banshee,
  ],
  [DestinyActivityModeType.AllPvP]: [Vendors.Shaxx],
  [DestinyActivityModeType.IronBanner]: [Vendors.LordSaladin],
  [DestinyActivityModeType.TrialsOfOsiris]: [Vendors.Saint14],
  [DestinyActivityModeType.Gambit]: [Vendors.TheDrifter],
  [DestinyActivityModeType.GambitPrime]: [Vendors.TheDrifter],
  [DestinyActivityModeType.Raid]: [Vendors.Hawthorne],
  [DestinyActivityModeType.AllStrikes]: [Vendors.Zavala],
};

export const vendorsByDestinationHash = {
  [Destinations.DreamingCity]: [Vendors.Petra],
  [Destinations.EDZ]: [Vendors.DevrimKay],
  [Destinations.IO]: [Vendors.AsherMir],
  [Destinations.Mars]: [Vendors.AnaBray],
  [Destinations.Mercury]: [Vendors.BrotherVance],
  [Destinations.Moon]: [Vendors.ErisMorn],
  [Destinations.Nessus]: [Vendors.Failsafe],
  [Destinations.TangledShore]: [Vendors.Spider],
  [Destinations.Titan]: [Vendors.Sloane],
};
