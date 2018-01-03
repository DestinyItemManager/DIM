/**
 * @enum {number}
 *
 * Helpers to give names to the various optional component types in the D2 API.
 *
 * https://destinydevs.github.io/BungieNetPlatform/docs/schemas/Destiny-DestinyComponentType
 */
export const DestinyComponentType = {
  // Profiles is the most basic component, only relevant when calling
  // GetProfile.This returns basic information about the profile,
  // which is almost nothing: a listof characterIds, some information
  // about the last time you logged in, and that mostsobering
  // statistic: how long you've played.
  Profiles: 100,
  // Only applicable for GetProfile, this will return information
  // about receipts for refundablevendor items.
  VendorReceipts: 101,
  // Asking for this will get you the profile-level inventories, such
  // as your Vault buckets(yeah, the Vault is really inventory buckets
  // located on your Profile)
  ProfileInventories: 102,
  // This will get you a summary of items on your Profile that we
  // consider to be "currencies", such as Glimmer. I mean, if there's
  // Glimmer in Destiny 2. I didn't say there was Glimmer.
  ProfileCurrencies: 103,
  // This will get you summary info about each of the characters in
  // the profile.
  Characters: 200,
  // This will get you information about any non-equipped items on the
  // character or character(s) in question, if you're allowed to see
  // it. You have to either be authenticated as that user, or that
  // user must allow anonymous viewing of their non-equipped items in
  // Bungie.Net settingsto actually get results.
  CharacterInventories: 201,
  // This will get you information about the progression (faction,
  // experience, etc... "levels") relevant to each character, if you
  // are the currently authenticated user or the user haselected to
  // allow anonymous viewing of its progression info.
  CharacterProgressions: 202,
  // This will get you just enough information to be able to render
  // the character in 3D if you have written a 3D rendering library
  // for Destiny Characters, or "borrowed" ours. It's okay, I won't
  // tell anyone if you're using it. I'm no snitch. (actually, we
  // don't care if you use it - go to town)
  CharacterRenderData: 203,
  // This will return info about activities that a user can see and
  // gating on it, if you are the currently authenticated user or the
  // user haselected to allow anonymous viewing of its progression
  // info. Note that the data returned by this can be unfortunately
  // problematic and relatively unreliable insome cases. We'll
  // eventually work on making it more consistently reliable.
  CharacterActivities: 204,
  // This will return info about the equipped items on the
  // character(s). Everyone can see this.
  CharacterEquipment: 205,
  // This will return basic info about instanced items - whether they
  // can be equipped, their tracked status, and some info commonly
  // needed in many places (current damage type,primary stat value,
  // etc)
  ItemInstances: 300,
  // Items can have Objectives (DestinyObjectiveDefinition) bound to
  // them. If they do, this willreturn info for items that have such
  // bound objectives.
  ItemObjectives: 301,
  // Items can have perks (DestinyPerkDefinition). If they do, this
  // will return info for what perks are active on items.
  ItemPerks: 302,
  // If you just want to render the weapon, this is just enough info
  // to do that rendering.
  ItemRenderData: 303,
  // Items can have stats, like rate of fire. Asking for this
  // component will return requested item's stats if they have stats.
  ItemStats: 304,
  // Items can have sockets, where plugs can be inserted. Asking for
  // this component will return all info relevant to the sockets on
  // items that have them.
  ItemSockets: 305,
  // Items can have talent grids, though that matters a lot less
  // frequently than it used to. Asking for this component will return
  // all relevant info about activated Nodes and Steps on this talent
  // grid, like the good ol' days.
  ItemTalentGrids: 306,
  // Items that aren't instanced still have important information you
  // need to know: how much of it you have, the itemHash so you can
  // look up their DestinyInventoryItemDefinition, whether they're
  // locked, etc... Both instanced and non-instanced items will have
  // these properties.
  ItemCommonData: 307,
  // Items that are "Plugs" can be inserted into sockets. This returns
  // statuses about those plugs and why they can/can't be inserted. I
  // hear you giggling, there's nothing funny about inserting
  // plugs. Get your head out of the gutter and pay attention!
  ItemPlugStates: 308,
  Vendors: 400,
  VendorCategories: 401,
  VendorSales: 402,
  // Asking for this component will return you the account's Kiosk
  // statuses: that is, what items have been filled out/acquired. But
  // only if you are the currently authenticated user or the user has
  // selected to allow anonymous viewing of its progression info.
  Kiosks: 500
};
