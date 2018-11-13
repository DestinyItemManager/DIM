import { DestinyUnlockValueUIStyle } from 'bungie-api-ts/destiny2';

const get = function(identifier: number) {
  if (this.hasOwnProperty(identifier)) {
    return this[identifier];
  }
  return this[0];
};

export const D2SupplementalManifestDefinitions = {
  InventoryItem: { get },
  Objective: {
    get,
    // dummy objective
    0: {
      minimumVisibilityThreshold: Number.MAX_VALUE,
      progressDescription: '',
      valueStyle: DestinyUnlockValueUIStyle.Automatic,
      displayProperties: {
        hasIcon: false,
        icon: ''
      },
      completionValue: 0
    },
    // Encrypted Cache Key
    1: {
      minimumVisibilityThreshold: 0,
      progressDescription: '',
      valueStyle: DestinyUnlockValueUIStyle.Automatic,
      displayProperties: {
        hasIcon: false,
        icon: ''
      },
      completionValue: 7
    }
  },
  SandboxPerk: { get },
  Stat: { get },
  TalentGrid: { get },
  Progression: { get },
  ItemCategory: { get },
  Activity: { get },
  ActivityType: { get },
  ActivityModifier: { get },
  Vendor: { get },
  SocketCategory: { get },
  SocketType: { get },
  Milestone: { get },
  Destination: { get },
  Place: { get },
  VendorGroup: { get },
  PlugSet: { get },
  Collectible: { get },
  PresentationNode: { get },
  Record: { get },

  InventoryBucket: {},
  Class: {},
  Gender: {},
  Race: {},
  Faction: {},
  ItemTierType: {},
  ActivityMode: {}
};
