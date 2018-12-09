import { DestinyUnlockValueUIStyle } from 'bungie-api-ts/destiny2';

const get = function(identifier: number) {
  if (this.hasOwnProperty(identifier)) {
    return this[identifier];
  }
  return this[0];
};

const getAll = function() {
  return this;
};

export const D2SupplementalManifestDefinitions = {
  InventoryItem: { get, getAll },
  Objective: {
    get,
    getAll,
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
  SandboxPerk: { get, getAll },
  Stat: { get, getAll },
  TalentGrid: { get, getAll },
  Progression: { get, getAll },
  ItemCategory: { get, getAll },
  Activity: { get, getAll },
  ActivityType: { get, getAll },
  ActivityModifier: { get, getAll },
  Vendor: { get, getAll },
  SocketCategory: { get, getAll },
  SocketType: { get, getAll },
  Milestone: { get, getAll },
  Destination: { get, getAll },
  Place: { get, getAll },
  VendorGroup: { get, getAll },
  PlugSet: { get, getAll },
  Collectible: { get, getAll },
  PresentationNode: { get, getAll },
  Record: { get, getAll },

  InventoryBucket: {},
  Class: {},
  Gender: {},
  Race: {},
  Faction: {},
  ItemTierType: {},
  ActivityMode: {}
};
