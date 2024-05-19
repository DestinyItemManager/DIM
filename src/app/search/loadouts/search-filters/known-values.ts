import { DestinyClass } from 'bungie-api-ts/destiny2';

export const subclassHashToElementNames: {
  [key in DestinyClass]: { [hash: number]: string } | undefined;
} = {
  [DestinyClass.Warlock]: {
    2849050827: 'void',
    3941205951: 'solar',
    3168997075: 'arc',
    3291545503: 'stasis',
    4204413574: 'strand',
  },
  [DestinyClass.Hunter]: {
    2453351420: 'void',
    2240888816: 'solar',
    2328211300: 'arc',
    873720784: 'stasis',
    3785442599: 'strand',
  },
  [DestinyClass.Titan]: {
    2842471112: 'void',
    2550323932: 'solar',
    2932390016: 'arc',
    613647804: 'stasis',
    242419885: 'strand',
  },
  [DestinyClass.Unknown]: undefined,
  [DestinyClass.Classified]: undefined,
};
