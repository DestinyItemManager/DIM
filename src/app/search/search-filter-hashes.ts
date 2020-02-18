import { energyNamesByEnum, damageNamesByEnum } from 'app/utils/item-utils';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums
// i would like to separate these into a general Knowledge file,
// less specific to search

// typescript doesn't understand array.filter
export const damageTypeNames = Object.values(damageNamesByEnum).filter(
  (d) => ![null, 'raid'].includes(d)
) as string[];

/** these weapons exist in D1&2 */
export const D1CategoryHashes = {
  autorifle: 5,
  handcannon: 6,
  pulserifle: 7,
  scoutrifle: 8,
  fusionrifle: 9,
  sniperrifle: 10,
  shotgun: 11,
  machinegun: 12,
  rocketlauncher: 13,
  sidearm: 14,
  sword: 54
};

/** D2 has these item types but D1 doesn't */
export const D2CategoryHashes = {
  grenadelauncher: 153950757,
  tracerifle: 2489664120,
  linearfusionrifle: 1504945536,
  submachine: 3954685534,
  bow: 3317538576,
  transmat: 208981632,
  weaponmod: 610365472,
  armormod: 4104513227,
  reptoken: 2088636411
};

/** these are checked against default rolls to determine if something's curated */
export const curatedPlugsWhitelist = [
  7906839, // frames
  683359327, // guards
  1041766312, // blades
  1202604782, // tubes
  1257608559, // arrows
  1757026848, // batteries
  1806783418, // magazines
  2619833294, // scopes
  2718120384, // magazines_gl
  2833605196, // barrels
  3809303875 // bowstring
];

/** write something here */
export const lightStats = [
  1480404414, // D2 Attack
  3897883278, // D1 & D2 Defense
  368428387 // D1 Attack
];

/** compare against DimItem.type in EN */
export const cosmeticTypes = [
  'Shader',
  'Shaders',
  'Ornaments',
  'Modifications',
  'Emote',
  'Emotes',
  'Emblem',
  'Emblems',
  'Vehicle',
  'Horn',
  'Ship',
  'Ships',
  'ClanBanners'
];

/** sublime engrams */
export const sublimeEngrams = [
  1986458096, // -gauntlet
  2218811091,
  2672986950, // -body-armor
  779347563,
  3497374572, // -class-item
  808079385,
  3592189221, // -leg-armor
  738642122,
  3797169075, // -helmet
  838904328
];

/** powerful rewards listed in quests or bounties */
// TODO: generate in d2ai
export const powerfulSources = [
  993006552, // InventoryItem "Luminous Crucible Engram"
  1204101093, // InventoryItem "Luminous Vanguard Engram"
  1800172820, // InventoryItem "Luminous Vanguard Engram"
  2481239683, // InventoryItem "Luminous Vanguard Engram"
  2484791497, // InventoryItem "Luminous Planetary Engram"
  2558839803, // InventoryItem "Luminous Planetary Engram"
  2566956006, // InventoryItem "Luminous Crucible Engram"
  2646629159, // InventoryItem "Luminous Engram"
  2770239081, // InventoryItem "Luminous Crucible Engram"
  3829523414, // InventoryItem "Luminous Planetary Engram"
  4143344829, // InventoryItem "Luminous Engram"
  4039143015, // InventoryItem "Powerful Gear"
  4249081773 // InventoryItem "Powerful Armor"
];

/** season 3 swag from rasputin */
export const ikelos = [
  847450546, // InventoryItem "IKELOS_SR_v1.0.1"
  1723472487, // InventoryItem "IKELOS_SMG_v1.0.1"
  1887808042, // InventoryItem "IKELOS_SG_v1.0.1"
  3866356643, // InventoryItem "IKELOS_HC_v1.0.1"
  4036115577 //  InventoryItem "Sleeper Simulant"
];

export const boosts = [
  1043138475, // -black-wax-idol
  1772853454, // -blue-polyphage
  3783295803, // -ether-seeds
  3446457162 // -resupply-codes
];

export const supplies = [
  269776572, // -house-banners
  3632619276, // -silken-codex
  2904517731, // -axiomatic-beads
  1932910919 // -network-keys
];

/** for D1 items: used to calculate which vendor an item could have come from */
export const vendorHashes = {
  required: {
    fwc: [995344558], // SOURCE_VENDOR_FUTURE_WAR_CULT / Future War Cult
    do: [103311758], // SOURCE_VENDOR_DEAD_ORBIT / Dead Orbit
    nm: [3072854931], // SOURCE_VENDOR_NEW_MONARCHY / New Monarchy
    speaker: [4241664776], // SOURCE_VENDOR_SPEAKER / Speaker
    variks: [512830513], // SOURCE_VENDOR_FALLEN / Variks
    shipwright: [3721473564], // SOURCE_VENDOR_SHIPWRIGHT / Shipwright
    vanguard: [1482793537], // SOURCE_VENDOR_VANGUARD /
    osiris: [3378481830], // SOURCE_VENDOR_OSIRIS / Osiris
    xur: [2179714245], // SOURCE_VENDOR_BLACK_MARKET / Shaxx
    shaxx: [4134961255], // SOURCE_VENDOR_CRUCIBLE_HANDLER /
    cq: [1362425043], // SOURCE_VENDOR_CRUCIBLE_QUARTERMASTER / Crucible Quartermaster
    eris: [1374970038], // SOURCE_VENDOR_CROTAS_BANE / Eris Morn
    ev: [3559790162], // SOURCE_VENDOR_SPECIAL_ORDERS / Eververse
    gunsmith: [353834582] // SOURCE_VENDOR_GUNSMITH /
  },
  restricted: {
    fwc: [353834582], // remove motes of light & strange coins
    do: [353834582],
    nm: [353834582],
    speaker: [353834582],
    cq: [353834582, 2682516238] // remove ammo synths and planetary materials
  }
};

/** for D1 items: used to calculate which activity an item could have come from
 * "vanilla" has no hash but checks for year == 1
 */
export const D1ActivityHashes = {
  required: {
    trials: [2650556703], // SOURCE_TRIALS_OF_OSIRIS / Trials
    ib: [1322283879], // SOURCE_IRON_BANNER / Iron Banner
    qw: [1983234046], // SOURCE_QUEENS_EMISSARY_QUEST / Queen's Wrath
    cd: [2775576620], // SOURCE_CRIMSON_DOUBLES / Crimson Doubles
    srl: [1234918199], // SOURCE_SRL / Sparrow Racing League
    vog: [440710167], // SOURCE_VAULT_OF_GLASS / Vault of Glass
    ce: [2585003248], // SOURCE_CROTAS_END / Crota's End
    ttk: [2659839637], // SOURCE_TTK / The Taken King
    kf: [1662673928], // SOURCE_KINGS_FALL / King's Fall
    roi: [2964550958], // SOURCE_RISE_OF_IRON / Rise of Iron
    wotm: [4160622434], // SOURCE_WRATH_OF_THE_MACHINE / Wrath of the Machine
    poe: [2784812137], // SOURCE_PRISON_ELDERS / Prison of Elders
    coe: [1537575125], // SOURCE_POE_ELDER_CHALLENGE / Challenge of Elders
    af: [3667653533], // SOURCE_ARCHON_FORGE / Archon Forge
    dawning: [3131490494], // SOURCE_DAWNING /
    aot: [3068521220, 4161861381, 440710167] // SOURCE_AGES_OF_TRIUMPH && SOURCE_RAID_REPRISE
  },
  restricted: {
    trials: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
    ib: [3602080346], // remove engrams and random blue drops (Strike)
    qw: [3602080346], // remove engrams and random blue drops (Strike)
    cd: [3602080346], // remove engrams and random blue drops (Strike)
    kf: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
    wotm: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
    poe: [3602080346, 2682516238], // remove engrams
    coe: [3602080346, 2682516238], // remove engrams
    af: [2682516238], // remove engrams
    dawning: [2682516238, 1111209135], // remove engrams, planetary materials, & chroma
    aot: [2964550958, 2659839637, 353834582, 560942287] // Remove ROI, TTK, motes, & glimmer items
  }
};

/** if a plug contains these, consider it empty */
export const emptySocketHashes = [
  2323986101, // InventoryItem "Empty Mod Socket"
  2600899007, // InventoryItem "Empty Mod Socket"
  1835369552, // InventoryItem "Empty Mod Socket"
  3851138800, // InventoryItem "Empty Mod Socket"
  791435474 // InventoryItem "Empty Activity Mod Socket"
];

/** these stats actually exist on D2 armor */
const d2ArmorStatHashByName = {
  mobility: 2996146975,
  resilience: 392767087,
  recovery: 1943323491,
  discipline: 1735777505,
  intellect: 144602215,
  strength: 4244567218
};

/**
 * these stats exist on DIM armor. the 6 originals supplemented by a sum total.
 * these are the armor stats that can be looked up by name
 */
const dimArmorStatHashByName = {
  ...d2ArmorStatHashByName,
  total: -1000
};

/** stats names used to create armor-specific filters */
export const armorStatNames = [...Object.keys(dimArmorStatHashByName), 'any'];

/** stat hashes to check in armor "any" filters */
export const anyArmorStatHashes = Object.values(d2ArmorStatHashByName);

/** stats to check the max values of */
export const armorStatHashes = Object.values(dimArmorStatHashByName);

/** all-stat table, for looking up stat hashes given a queried stat name */
export const statHashByName = {
  rpm: 4284893193,
  rof: 4284893193,
  charge: 2961396640,
  impact: 4043523819,
  handling: 943549884,
  range: 1240592695,
  stability: 155624089,
  reload: 4188031367,
  magazine: 3871231066,
  aimassist: 1345609583,
  equipspeed: 943549884,
  velocity: 2523465841,
  blastradius: 3614673599,
  recoildirection: 2715839340,
  drawtime: 447667954,
  zoom: 3555269338,
  inventorysize: 1931675084,
  ...dimArmorStatHashByName
};

/** all-stat list, to generate filters from */
export const allStatNames = [...Object.keys(statHashByName), 'any'];

export const energyCapacityTypes = Object.values(energyNamesByEnum);

export const shaderBucket = 2973005342;
