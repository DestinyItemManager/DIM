// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

import { BucketHashes, ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';

//
// STATS KNOWN VALUES
//

export const enum D1_StatHashes {
  Defense = StatHashes.Defense, // Same as in D2
  Attack = 368428387, // Not the same as in D2
}

/** hashes representing D1 PL stats */
export const D1LightStats = [D1_StatHashes.Defense, D1_StatHashes.Attack];

/** hashes representing D1 Progressions */
export const enum D1ProgressionHashes {
  Prestige = 2030054750,
}

//
// ITEMS / ITEM CATEGORY KNOWN VALUES
//

/** these weapons exist in D1&2 */
export const D1ItemCategoryHashes = {
  autorifle: ItemCategoryHashes.AutoRifle,
  handcannon: ItemCategoryHashes.HandCannon,
  pulserifle: ItemCategoryHashes.PulseRifle,
  scoutrifle: ItemCategoryHashes.ScoutRifle,
  fusionrifle: ItemCategoryHashes.FusionRifle,
  sniperrifle: ItemCategoryHashes.SniperRifle,
  shotgun: ItemCategoryHashes.Shotgun,
  machinegun: ItemCategoryHashes.MachineGun,
  rocketlauncher: ItemCategoryHashes.RocketLauncher,
  sidearm: ItemCategoryHashes.Sidearm,
  sword: ItemCategoryHashes.Sword,
};

export const enum D1BucketHashes {
  Artifact = 434908299,
  RecordBook = 2987185182,
  RecordBookLegacy = 549485690,
  Missions = BucketHashes.Engrams, // D1 missions are D2 engrams
  Quests = 1801258597,
  Bounties = 2197472680,
  Shader = 2973005342,
  Horn = 3796357825,
  D1Emotes = 3054419239,
}

//
// OTHER STUFF
//

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
  838904328,
];

export const boosts = [
  1043138475, // -black-wax-idol
  1772853454, // -blue-polyphage
  3783295803, // -ether-seeds
  3446457162, // -resupply-codes
];

export const supplies = [
  269776572, // -house-banners
  3632619276, // -silken-codex
  2904517731, // -axiomatic-beads
  1932910919, // -network-keys
];

/** for D1 items: used to calculate which vendor an item could have come from */
export const vendorHashes: Record<'required' | 'restricted', NodeJS.Dict<number[]>> = {
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
    gunsmith: [353834582], // SOURCE_VENDOR_GUNSMITH /
  },
  restricted: {
    fwc: [353834582], // remove motes of light & strange coins
    do: [353834582],
    nm: [353834582],
    speaker: [353834582],
    cq: [353834582, 2682516238], // remove ammo synths and planetary materials
  },
};

/** for D1 items: used to calculate which activity an item could have come from
 * "vanilla" has no hash but checks for year == 1
 */
export const D1ActivityHashes: {
  restricted: {
    [keyword: string]: number[] | undefined;
  };
  required: {
    [keyword: string]: number[] | undefined;
  };
} = {
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
    af: [3667653533], // SOURCE_ARCHONS_FORGE / Archons Forge
    dawning: [3131490494], // SOURCE_DAWNING /
    aot: [3068521220, 4161861381, 440710167], // SOURCE_AGES_OF_TRIUMPH && SOURCE_RAID_REPRISE
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
    aot: [2964550958, 2659839637, 353834582, 560942287], // Remove ROI, TTK, motes, & glimmer items
  },
};
