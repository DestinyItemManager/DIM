const D2Sources: {
  [key: string]: {
    itemHashes?: number[];
    sourceHashes?: number[];
    aliases?: string[];
    enteredDCV?: number;
  };
} = {
  '30th': {
    sourceHashes: [
      443340273, // Source: Xûr's Treasure Hoard in Eternity
      675740011, // Source: "Grasp of Avarice" Dungeon
      1102533392, // Source: Xûr (Eternity)
      1394793197, // Source: "Magnum Opus" Quest
      2763252588, // Source: "And Out Fly the Wolves" Quest
    ],
  },
  adventure: {
    sourceHashes: [
      194661944, // Source: Adventure "Siren Song" on Saturn's Moon, Titan
      482012099, // Source: Adventure "Thief of Thieves" on Saturn's Moon, Titan
      636474187, // Source: Adventure "Deathless" on Saturn's Moon, Titan
      783399508, // Source: Adventure "Supply and Demand" in the European Dead Zone
      790433146, // Source: Adventure "Dark Alliance" in the European Dead Zone
      1067250718, // Source: Adventure "Arecibo" on Io
      1186140085, // Source: Adventure "Unbreakable" on Nessus
      1289998337, // Source: Adventure "Hack the Planet" on Nessus
      1527887247, // Source: Adventure "Red Legion, Black Oil" in the European Dead Zone
      1736997121, // Source: Adventure "Stop and Go" in the European Dead Zone
      1861838843, // Source: Adventure "A Frame Job" in the European Dead Zone
      2040548068, // Source: Adventure "Release" on Nessus
      2096915131, // Source: Adventure "Poor Reception" in the European Dead Zone
      2345202459, // Source: Adventure "Invitation from the Emperor" on Nessus
      2392127416, // Source: Adventure "Cliffhanger" on Io
      2553369674, // Source: Adventure "Exodus Siege" on Nessus
      3427537854, // Source: Adventure "Road Rage" on Io
      3754173885, // Source: Adventure "Getting Your Hands Dirty" in the European Dead Zone
      4214471686, // Source: Adventure "Unsafe at Any Speed" in the European Dead Zone
    ],
    enteredDCV: 20,
  },
  avalon: {
    sourceHashes: [
      709680645, // Source: "Truly Satisfactory" Triumph
      1476475066, // Source: "Firmware Update" Triumph
      1730197643, // Source: //node.ovrd.AVALON// Exotic Quest
    ],
    enteredDCV: 24,
  },
  battlegrounds: {
    itemHashes: [
      2121785039, // Brass Attacks
      3075224551, // Threaded Needle
    ],
    sourceHashes: [
      3391325445, // Source: Battlegrounds
    ],
    enteredDCV: 24,
  },
  blackarmory: {
    itemHashes: [
      417164956, // Jötunn
      3211806999, // Izanagi's Burden
      3588934839, // Le Monarque
      3650581584, // New Age Black Armory
      3650581585, // Refurbished Black Armory
      3650581586, // Rasmussen Clan
      3650581587, // House of Meyrin
      3650581588, // Satou Tribe
      3650581589, // Bergusian Night
    ],
    sourceHashes: [
      266896577, // Source: Solve the Norse glyph puzzle.
      439994003, // Source: Complete the "Master Smith" Triumph.
      925197669, // Source: Complete a Bergusia Forge ignition.
      948753311, // Source: Found by completing Volundr Forge ignitions.
      1286332045, // Source: Found by completing Izanami Forge ignitions.
      1457456824, // Source: Complete the "Reunited Siblings" Triumph.
      1465990789, // Source: Solve the Japanese glyph puzzle.
      1596507419, // Source: Complete a Gofannon Forge ignition.
      2062058385, // Source: Crafted in a Black Armory forge.
      2384327872, // Source: Solve the French glyph puzzle.
      2541753910, // Source: Complete the "Master Blaster" Triumph.
      2966694626, // Source: Found by solving the mysteries behind the Black Armory's founding families.
      3047033583, // Source: Returned the Obsidian Accelerator.
      3257722699, // Source: Complete the "Clean Up on Aisle Five" Triumph.
      3390164851, // Source: Found by turning in Black Armory bounties.
      3764925750, // Source: Complete an Izanami Forge ignition.
      4101102010, // Source: Found by completing Bergusia Forge ignitions.
      4247521481, // Source: Complete the "Beautiful but Deadly" Triumph.
      4290227252, // Source: Complete a Volundr Forge ignition.
    ],
    aliases: ['ada'],
    enteredDCV: 20,
  },
  brave: {
    itemHashes: [
      205225492, // Hung Jury SR4
      211732170, // Hammerhead
      243425374, // Falling Guillotine
      570866107, // Succession
      2228325504, // Edge Transit
      2480074702, // Forbearance
      2499720827, // Midnight Coup
      2533990645, // Blast Furnace
      3098328572, // The Recluse
      3757612024, // Luna's Howl
      3851176026, // Elsie's Rifle
      4043921923, // The Mountaintop
    ],
    sourceHashes: [
      2952071500, // Source: Into the Light
    ],
  },
  calus: {
    itemHashes: [
      947448544, // Shadow of Earth Shell
      1661191192, // The Tribute Hall
      1661191193, // Crown of Sorrow
      1661191194, // A Hall of Delights
      1661191195, // The Imperial Menagerie
      2027598066, // Imperial Opulence
      2027598067, // Imperial Dress
      2816212794, // Bad Juju
      3176509806, // Árma Mákhēs
      3580904580, // Legend of Acrius
      3841416152, // Golden Empire
      3841416153, // Goldleaf
      3841416154, // Shadow Gilt
      3841416155, // Cinderchar
      3875444086, // The Emperor's Chosen
    ],
    enteredDCV: 20,
    sourceHashes: [
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      2399751101, // Acquired from the raid "Crown of Sorrow."
      2511152325, // Acquired from the Menagerie aboard the Leviathan.
      2653618435, // Source: Leviathan raid.
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
      2937902448, // Source: Leviathan, Eater of Worlds raid lair.
      3147603678, // Acquired from the raid "Crown of Sorrow."
      4009509410, // Source: Complete challenges in the Leviathan raid.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
    ],
  },
  campaign: {
    sourceHashes: [
      13912404, // Source: Unlock Your Arc Subclass
      100617404, // Requires Titan Class
      286427063, // Source: Fallen Empire Campaign
      409652252, // Source: The Witch Queen Campaign
      460742691, // Requires Guardian Rank 6: Masterwork Weapons
      569214265, // Source: Red War Campaign
      677167936, // Source: Complete the campaign as a Warlock.
      736336644, // Source: "A Spark of Hope" Quest
      901482731, // Source: Lightfall Campaign
      918840100, // Source: Shadowkeep Campaign
      923708784, // Requires Guardian Rank 7: Threats and Surges
      958460845, // Source: The Final Shape Campaign
      1076222895, // Source: Defeat bosses in Flashpoints.
      1103518848, // Source: Earned over the course of the Warmind campaign.
      1118966764, // Source: Dismantle an item with this shader applied to it.
      1281387702, // Source: Unlock Your Void Subclass
      1701477406, // Source: Flashpoint milestones; Legendary engrams.
      2242939082, // Requires Hunter Class
      2278847330, // Requires Guardian Rank 5
      2308290458, // Requires 1,000 Warlock Kills
      2552784968, // Requires Guardian Rank 2
      2744321951, // Source: Complete a heroic Public Event.
      2892963218, // Source: Earned while leveling.
      2895784523, // Source: Pledge to all factions on a single character.
      2929562373, // Source: Unlock Your Solar Subclass
      2988465950, // Source: Planetary faction chests.
      3099553329, // Source: Complete the campaign as a Titan.
      3126774631, // Requires 1,000 Hunter Kills
      3174947771, // Requires Guardian Rank 6: Powerful Rewards
      3431853656, // Achieved a Grimoire score of over 5000 in Destiny.
      3532642391, // Source: Forsaken Campaign
      3704442923, // Source: Curse of Osiris Campaign
      3936473457, // Requires Warlock Class
      4288102251, // Requires 1,000 Titan Kills
      4290499613, // Source: Complete the campaign as a Hunter.
    ],
  },
  cayde6: {
    sourceHashes: [
      2206233229, // Source: Follow treasure maps.
    ],
    enteredDCV: 20,
  },
  compass: {
    sourceHashes: [
      164083100, // Source: Display of Supremacy, Weekly Challenge
      3100439379, // Source: Mission "Exorcism"
    ],
    enteredDCV: 20,
  },
  contact: {
    sourceHashes: [
      2039343154, // Source: Contact Public Event
    ],
    enteredDCV: 20,
  },
  crotasend: {
    sourceHashes: [
      1897187034, // Source: "Crota's End" Raid
    ],
    aliases: ['crota'],
  },
  crownofsorrow: {
    itemHashes: [
      947448544, // Shadow of Earth Shell
      1661191193, // Crown of Sorrow
      2027598066, // Imperial Opulence
      2027598067, // Imperial Dress
    ],
    sourceHashes: [
      2399751101, // Acquired from the raid "Crown of Sorrow."
      3147603678, // Acquired from the raid "Crown of Sorrow."
    ],
    aliases: ['cos'],
    enteredDCV: 20,
  },
  crucible: {
    itemHashes: [
      2307365, // The Inquisitor (Adept)
      161675590, // Whistler's Whim (Adept)
      501345268, // Shayura's Wrath (Adept)
      548809020, // Exalted Truth
      627188188, // Eye of Sol
      711889599, // Whistler's Whim (Adept)
      769099721, // Devil in the Details
      825554997, // The Inquisitor (Adept)
      854379020, // Astral Horizon (Adept)
      874623537, // Cataphract GL3 (Adept)
      906840740, // Unwavering Duty
      1141586039, // Unexpected Resurgence (Adept)
      1230660649, // Victory's Wreath
      1292594730, // The Summoner (Adept)
      1321626661, // Eye of Sol (Adept)
      1401300690, // Eye of Sol
      1574601402, // Whistler's Whim
      1661191197, // Disdain for Glitter
      1705843397, // Exalted Truth (Adept)
      1711056134, // Incisor
      1820994983, // The Summoner
      1968410628, // The Prophet
      1973107014, // Igneous Hammer
      2022294213, // Shayura's Wrath
      2059255495, // Eye of Sol (Adept)
      2185327324, // The Inquisitor
      2314610827, // Igneous Hammer (Adept)
      2414564781, // Punctuation Marks
      2420153991, // Made Shaxx Proud
      2421180981, // Incisor (Adept)
      2588739576, // Crucible Solemnity
      2588739578, // Crucible Legacy
      2588739579, // Crucible Metallic
      2632846356, // Rain of Ashes
      2653171212, // The Inquisitor
      2653171213, // Astral Horizon
      2738601016, // Cataphract GL3
      2759251821, // Unwavering Duty (Adept)
      2839600459, // Incisor (Adept)
      3001205424, // Ecliptic Distaff
      3019024381, // The Prophet (Adept)
      3102421004, // Exalted Truth
      3165143747, // Whistler's Whim
      3193598749, // The Immortal (Adept)
      3332125295, // Aisha's Care (Adept)
      3444632029, // Unwavering Duty (Adept)
      3624844116, // Unwavering Duty
      3920882229, // Exalted Truth (Adept)
      3928440584, // Crucible Carmine
      3928440585, // Crucible Redjack
      3969379530, // Aisha's Care
      4005780578, // Unexpected Resurgence
      4039572196, // The Immortal
      4060882456, // Rubicund Wrap (Ornament)
      4248997900, // Incisor
    ],
    sourceHashes: [
      454115234, // Source: Associated Crucible Quest
      598662729, // Source: Reach Glory Rank "Legend" in the Crucible.
      745186842, // Source: Associated Crucible Quest
      897576623, // Source: Complete Crucible matches and earn rank-up packages from Lord Shaxx.
      929025440, // Acquired by competing in the Crucible during the Prismatic Inferno.
      1217831333, // Source: Associated Crucible Quest
      1223492644, // Source: Complete the "Reconnaissance by Fire" quest.
      1465057711, // Source: Standard Ritual Playlist. (Vanguard Ops, Crucible, Gambit)
      1494513645, // Source: Glory Matches in Crucible
      2055470113, // Source: Chance to acquire when completing Crucible Survival matches after reaching Glory Rank "Mythic."
      2537301256, // Source: Glory Rank of "Fabled" in Crucible
      2558941813, // Source: Place Silver III Division or Higher in Ranked Crucible Playlists
      2622122683, // Source: Lord Shaxx Rank Up Reputation
      2641169841, // Source: Purchase from Lord Shaxx
      2658055900, // Source: Complete the "Season 8: Battle Drills" quest.
      2669524419, // Source: Crucible
      2821852478, // Source: Complete this weapon's associated Crucible quest.
      2915991372, // Source: Crucible
      3020288414, // Source: Crucible
      3226099405, // Source: Crucible Seasonal Ritual Rank Reward
      3299964501, // Source: Earn Ranks in Vanguard, Crucible, or Gambit Playlists
      3348906688, // Source: Ranks in Vanguard Strikes, Crucible, or Gambit
      3466789677, // Source: Place Ascendant III Division or Higher in Ranked Crucible Playlists
      3656787928, // Source: Crucible Salvager's Salvo Armament
    ],
    aliases: ['shaxx'],
  },
  deepstonecrypt: {
    sourceHashes: [
      866530798, // Source: "Not a Scratch" Triumph
      1405897559, // Source: "Deep Stone Crypt" Raid
      1692165595, // Source: "Rock Bottom" Triumph
    ],
    aliases: ['dsc'],
  },
  deluxe: {
    sourceHashes: [
      639650067, // Source: Limited Edition of Destiny 2.
      1358645302, // Source: Unlocked by a special offer.
      1412777465, // Source: Forsaken Refer-a-Friend
      1743434737, // Source: Destiny 2 "Forsaken" preorder bonus gift.
      1866448829, // Source: Deluxe Edition Bonus
      2968206374, // Source: Earned as a Deluxe Edition bonus.
      2985242208, // Source: Earned from a charity promotion.
      3173463761, // Source: Pre-order Bonus
      3212282221, // Source: Forsaken Annual Pass
      3672287903, // Source: The Witch Queen Digital Deluxe Edition
      4069355515, // Source: Handed out at US events in 2019.
      4166998204, // Source: Earned as a pre-order bonus.
    ],
    aliases: ['limited'],
  },
  do: {
    sourceHashes: [
      146504277, // Source: Earn rank-up packages from Arach Jalaal.
    ],
    enteredDCV: 20,
  },
  dreaming: {
    itemHashes: [
      185321779, // Ennead
      3352019292, // Secret Victories
    ],
    sourceHashes: [
      2559145507, // Source: Complete activities in the Dreaming City.
      3874934421, // Source: Complete Nightfall strike "The Corrupted."
    ],
  },
  duality: {
    sourceHashes: [
      1282207663, // Source: Dungeon "Duality"
    ],
  },
  dungeon: {
    sourceHashes: [
      506073192, // Source: "Prophecy" Dungeon
      613435025, // Source: "Warlord's Ruin" Dungeon
      675740011, // Source: "Grasp of Avarice" Dungeon
      1282207663, // Source: Dungeon "Duality"
      1597738585, // Source: "Spire of the Watcher" Dungeon
      1745960977, // Source: "Pit of Heresy" Dungeon
      3288974535, // Source: "Ghosts of the Deep" Dungeon
    ],
    itemHashes: [
      185321778, // The Eternal Return
      814876684, // Wish-Ender
      2844014413, // Pallas Galliot
    ],
  },
  echoes: {
    sourceHashes: [
      536806855, // Source: Episode: Echoes
      2306801178, // Source: Episode: Echoes Activities
      2514060836, // Source: Episode: Echoes Enigma Protocol Activity
      2631398023, // Source: Radiolite Bay Deposits
    ],
  },
  edz: {
    sourceHashes: [
      783399508, // Source: Adventure "Supply and Demand" in the European Dead Zone
      790433146, // Source: Adventure "Dark Alliance" in the European Dead Zone
      1373723300, // Source: Complete activities and earn rank-up packages in the EDZ.
      1527887247, // Source: Adventure "Red Legion, Black Oil" in the European Dead Zone
      1736997121, // Source: Adventure "Stop and Go" in the European Dead Zone
      1861838843, // Source: Adventure "A Frame Job" in the European Dead Zone
      2096915131, // Source: Adventure "Poor Reception" in the European Dead Zone
      3754173885, // Source: Adventure "Getting Your Hands Dirty" in the European Dead Zone
      4214471686, // Source: Adventure "Unsafe at Any Speed" in the European Dead Zone
      4292996207, // Source: World Quest "Enhance!" in the European Dead Zone.
    ],
  },
  eow: {
    sourceHashes: [
      2937902448, // Source: Leviathan, Eater of Worlds raid lair.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
    ],
    enteredDCV: 20,
  },
  ep: {
    sourceHashes: [
      4137108180, // Source: Escalation Protocol on Mars.
    ],
    enteredDCV: 20,
  },
  europa: {
    sourceHashes: [
      286427063, // Source: Fallen Empire Campaign
      1148859274, // Source: Exploring Europa
      1492981395, // Source: "The Stasis Prototype" Quest
      2171520631, // Source: "Lost Lament" Exotic Quest
      3125456997, // Source: Europan Tour
      3965815470, // Source: Higher Difficulty Empire Hunts
    ],
  },
  events: {
    itemHashes: [
      495940989, // Avalanche
      586671776, // Something New
      1280894514, // Mechabre
      2326578623, //
      2812100428, // Stay Frosty
      2814093983, // Cold Front
      3240434620, // Something New
      3400256755, // Zephyr
      3559361670, // The Title
      3573686365, // Glacioclasm
      4106757302, // Crowning Duologue
      4169225313, // Compass Rose
    ],
    sourceHashes: [
      32323943, // Source: Moments of Triumph
      151416041, // Source: Solstice
      464727567, // Source: Dawning 2021
      547767158, // Source: Dawning 2018
      611838069, // Source: Guardian Games
      629617846, // Source: Dawning 2020
      641018908, // Source: Solstice 2018
      772619302, // Completed all 8 Moments of Triumph in Destiny's second year.
      923678151, // Source: Upgraded Event Card Reward
      1054169368, // Source: Festival of the Lost 2021
      1225476079, // Source: Moments of Triumph 2022
      1360005982, // Completed a Moment of Triumph in Destiny's second year.
      1397119901, // Completed a Moment of Triumph in Destiny's first year.
      1416471099, // Source: Moments of Triumph 2023
      1462687159, // Reached level 5 in the Ages of Triumph record book.
      1568732528, // Source: Guardian Games 2024
      1666677522, // Source: Solstice
      1677921161, // Source: Festival of the Lost 2018.
      1919933822, // Source: Festival of the Lost 2020
      2006303146, // Source: Guardian Games 2022
      2011810450, // Source: Season 13 Guardian Games
      2187511136, // Source: Earned during the seasonal Revelry event.
      2364515524, // Source: Dawning 2022
      2473294025, // Source: Guardian Games 2023
      2502262376, // Source: Earned during the seasonal Crimson Days event.
      2797674516, // Source: Moments of Triumph 2021
      3092212681, // Source: Dawning 2019
      3112857249, // Completed all 10 Moments of Triumph in Destiny's first year.
      3190938946, // Source: Festival of the Lost 2019
      3388021959, // Source: Guardian Games
      3693722471, // Source: Festival of the Lost 2020
      3724111213, // Source: Solstice 2019
      3736521079, // Reached level 1 in the Ages of Triumph record book.
      3952847349, // Source: The Dawning.
      4041583267, // Source: Festival of the Lost
      4054646289, // Source: Earned during the seasonal Dawning event.
    ],
  },
  eververse: {
    sourceHashes: [
      269962496, // Source: Eververse
      860688654, // Source: Eververse
      2882367429, // Source: Eververse\nComplete the "Vault of Glass" raid to unlock this in Eververse.
      4036739795, // Source: Bright Engrams
    ],
  },
  evidenceboard: {
    sourceHashes: [
      1309588429, // Source: "Chief Investigator" Triumph
      2055289873, // Source: "The Evidence Board" Exotic Quest
    ],
    aliases: ['enclave'],
  },
  exoticquest: {
    sourceHashes: [
      210885364, // Source: Flawless "Presage" Exotic Quest on Master Difficulty
      281362298, // Source: Strider Exotic Quest
      454251931, // Source: "What Remains" Exotic Quest
      483798855, // Source: "The Final Strand" Exotic Quest
      709680645, // Source: "Truly Satisfactory" Triumph
      1141831282, // Source: "Of Queens and Worms" Exotic Quest
      1302157812, // Source: Wild Card Exotic Quest
      1388323447, // Source: Exotic Mission "The Whisper"
      1476475066, // Source: "Firmware Update" Triumph
      1730197643, // Source: //node.ovrd.AVALON// Exotic Quest
      1823766625, // Source: "Vox Obscura" Exotic Quest
      1957611613, // Source: An Exotic quest or challenge.
      2055289873, // Source: "The Evidence Board" Exotic Quest
      2068312112, // Source: Exotic Mission "Zero Hour"
      2171520631, // Source: "Lost Lament" Exotic Quest
      2745272818, // Source: "Presage" Exotic Quest
      2856954949, // Source: "Let Loose Thy Talons" Exotic Quest
      3597879858, // Source: "Presage" Exotic Quest
    ],
  },
  fwc: {
    sourceHashes: [
      3569603185, // Source: Earn rank-up packages from Lakshmi-2.
    ],
    enteredDCV: 20,
  },
  gambit: {
    itemHashes: [
      180108390, // Kit and Kaboodle
      180108391, // Dance the Demons Away
      1335424933, // Gambit Suede
      1335424934, // Gambit Chrome
      1335424935, // Gambit Leather
      1661191187, // Mistrust of Gifts
      2026755633, // Breakneck
      2224920148, // Gambit Blackguard
      2224920149, // Gambit Steel
      2394866220, // Keep on Drifting
      2588647363, // Live for the Hustle
      3001205424, // Ecliptic Distaff
      3217477988, // Gambit Duds
      4060882457, // Snakeskin Wrap (Ornament)
    ],
    sourceHashes: [
      186854335, // Source: Gambit
      571102497, // Source: Associated Gambit Quest
      594786771, // Source: Complete this weapon's associated Gambit quest.
      887452441, // Source: Gambit Salvager's Salvo Armament
      1127923611, // Source: 3 Gambit Rank Resets in a Season
      1162859311, // Source: Complete the "Clean Getaway" quest.
      1465057711, // Source: Standard Ritual Playlist. (Vanguard Ops, Crucible, Gambit)
      2170269026, // Source: Complete Gambit matches and earn rank-up packages from the Drifter.
      2364933290, // Source: Gambit Seasonal Ritual Rank Reward
      2601524261, // Source: Associated Gambit Quest
      2843045413, // Source: Gambit
      2883838366, // Source: Complete the "Breakneck" quest from the Drifter.
      3299964501, // Source: Earn Ranks in Vanguard, Crucible, or Gambit Playlists
      3348906688, // Source: Ranks in Vanguard Strikes, Crucible, or Gambit
      3422985544, // Source: Associated Gambit Quest
      3494247523, // Source: Complete the "Season 8: Keepin' On" quest.
      3522070610, // Source: Gambit
      3942778906, // Source: Drifter Rank Up Reputation
    ],
    aliases: ['drifter'],
  },
  gambitprime: {
    itemHashes: [
      2868525740, // The Collector
      2868525741, // The Invader
      2868525742, // The Reaper
      2868525743, // The Sentry
      3808901541, // Viper Strike
    ],
    sourceHashes: [
      1952675042, // Source: Complete Gambit Prime matches and increase your rank.
    ],
    enteredDCV: 20,
  },
  gardenofsalvation: {
    itemHashes: [
      4103414242, // Divinity
    ],
    sourceHashes: [
      1491707941, // Source: "Garden of Salvation" Raid
    ],
    aliases: ['gos', 'garden'],
  },
  ghostsofthedeep: {
    sourceHashes: [
      3288974535, // Source: "Ghosts of the Deep" Dungeon
    ],
    aliases: ['gotd'],
  },
  grasp: {
    sourceHashes: [
      675740011, // Source: "Grasp of Avarice" Dungeon
    ],
  },
  gunsmith: {
    sourceHashes: [
      1459595344, // Source: Purchase from Banshee-44 or Ada-1
      1788267693, // Source: Earn rank-up packages from Banshee-44.
      2986841134, // Source: Salvager's Salvo Armament Quest
      3512613235, // Source: "A Sacred Fusion" Quest
    ],
    aliases: ['banshee'],
  },
  harbinger: {
    sourceHashes: [
      2856954949, // Source: "Let Loose Thy Talons" Exotic Quest
    ],
  },
  haunted: {
    itemHashes: [
      1478986057, // Without Remorse
      2778013407, // Firefright
    ],
    sourceHashes: [
      620369433, // Source: Season of the Haunted Triumph
      976328308, // Source: The Derelict Leviathan
      1283862526, // Source: Season of the Haunted Nightfall Grandmaster
      2273761598, // Source: Season of the Haunted Activities
      2676881949, // Source: Season of the Haunted
    ],
    enteredDCV: 20,
  },
  ikora: {
    sourceHashes: [
      3075817319, // Source: Earn rank-up packages from Ikora Rey.
    ],
  },
  intothelight: {
    itemHashes: [
      205225492, // Hung Jury SR4
      211732170, // Hammerhead
      243425374, // Falling Guillotine
      570866107, // Succession
      2228325504, // Edge Transit
      2480074702, // Forbearance
      2499720827, // Midnight Coup
      2533990645, // Blast Furnace
      3098328572, // The Recluse
      3757612024, // Luna's Howl
      3851176026, // Elsie's Rifle
      4043921923, // The Mountaintop
    ],
    sourceHashes: [
      1388323447, // Source: Exotic Mission "The Whisper"
      1902517582, // Source: Where's Archie?
      2068312112, // Source: Exotic Mission "Zero Hour"
      2952071500, // Source: Into the Light
    ],
    aliases: ['itl'],
  },
  io: {
    sourceHashes: [
      315474873, // Source: Complete activities and earn rank-up packages on Io.
      1067250718, // Source: Adventure "Arecibo" on Io
      1832642406, // Source: World Quest "Dynasty" on Io.
      2392127416, // Source: Adventure "Cliffhanger" on Io
      2717017239, // Source: Complete Nightfall strike "The Pyramidion."
      3427537854, // Source: Adventure "Road Rage" on Io
    ],
    enteredDCV: 20,
  },
  ironbanner: {
    itemHashes: [
      231533811, // Iron Strength
      487361141, // Gunnora's Axe
      540880995, // Dark Decider
      888872889, // Point of the Stag
      1161561386, // The Guiding Sight
      1162929425, // The Golden Standard
      1448664466, // Iron Bone
      1448664467, // Iron Gold
      1661191199, // Grizzled Wolf
      1764868900, // Riiswalker
      1987234560, // Iron Ruby
      1999697514, // The Wizened Rebuke
      2189073092, // Lethal Abundance
      2448092902, // Rusted Iron
      2488587246, // The Hero's Burden
      4009352833, // Roar of the Bear
    ],
    sourceHashes: [
      561111210, // Source: Iron Banner Salvager's Salvo Armament
      1027607603, // Source: Associated Iron Banner Quest
      1312894505, // Source: Iron Banner
      1828622510, // Source: Chance to acquire when you win Iron Banner matches.
      1926923633, // Source: Lord Saladin Rank Up Reputation
      2520862847, // Source: Iron Banner Iron-Handed Diplomacy
      2648408612, // Acquired by competing in the Iron Banner when the wolves were loud.
      3072862693, // Source: Complete Iron Banner matches and earn rank-up packages from Lord Saladin.
      3966667255, // Source: Iron Banner's Season 9 Seasonal Quest
    ],
  },
  kingsfall: {
    sourceHashes: [
      160129377, // Source: "King's Fall" Raid
    ],
    aliases: ['kf'],
  },
  lastwish: {
    itemHashes: [
      70083888, // Nation of Beasts
      424291879, // Age-Old Bond
      501329015, // Chattering Bone
      1851777734, // Apex Predator
      2884596447, // The Supremacy
      3388655311, // Tyranny of Heaven
      3591141932, // Techeun Force
      3668669364, // Dreaming Spectrum
      3885259140, // Transfiguration
    ],
    sourceHashes: [
      2455011338, // Source: Last Wish raid.
    ],
    aliases: ['lw'],
  },
  legendaryengram: {
    sourceHashes: [
      3334812276, // Source: Open Legendary engrams and earn faction rank-up packages.
    ],
  },
  leviathan: {
    itemHashes: [
      3580904580, // Legend of Acrius
    ],
    sourceHashes: [
      2653618435, // Source: Leviathan raid.
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      4009509410, // Source: Complete challenges in the Leviathan raid.
    ],
    enteredDCV: 20,
  },
  lost: {
    sourceHashes: [
      164083100, // Source: Display of Supremacy, Weekly Challenge
      3094114967, // Source: Season of the Lost Ritual Playlists
    ],
    enteredDCV: 20,
  },
  mars: {
    sourceHashes: [
      1036506031, // Source: Complete activities and earn rank-up packages on Mars.
      1299614150, // Source: [REDACTED] on Mars.
      1924238751, // Source: Complete Nightfall strike "Will of the Thousands."
      2310754348, // Source: World Quest "Data Recovery" on Mars.
      2926805810, // Source: Complete Nightfall strike "Strange Terrain."
      4137108180, // Source: Escalation Protocol on Mars.
    ],
    enteredDCV: 20,
  },
  menagerie: {
    itemHashes: [
      1661191194, // A Hall of Delights
      1661191195, // The Imperial Menagerie
      3176509806, // Árma Mákhēs
      3841416152, // Golden Empire
      3841416153, // Goldleaf
      3841416154, // Shadow Gilt
      3841416155, // Cinderchar
      3875444086, // The Emperor's Chosen
    ],
    sourceHashes: [
      2511152325, // Acquired from the Menagerie aboard the Leviathan.
    ],
    enteredDCV: 20,
  },
  mercury: {
    sourceHashes: [
      148542898, // Source: Equip the full Mercury destination set on a Warlock.
      1175566043, // Source: Complete Nightfall strike "A Garden World."
      1400219831, // Source: Equip the full Mercury destination set on a Hunter.
      1411886787, // Source: Equip the full Mercury destination set on a Titan.
      1581680964, // Source: Complete Nightfall strike "Tree of Probabilities."
      1618754228, // Source: Sundial Activity on Mercury
      1654120320, // Source: Complete activities and earn rank-up packages on Mercury.
      2487203690, // Source: Complete Nightfall strike "Tree of Probabilities."
      3079246067, // Source: Complete Osiris' Lost Prophecies for Brother Vance on Mercury.
      3964663093, // Source: Rare drop from high-scoring Nightfall strikes on Mercury.
      4263201695, // Source: Complete Nightfall strike "A Garden World."
    ],
    enteredDCV: 20,
  },
  moon: {
    sourceHashes: [
      1253026984, // Source: Among the lost Ghosts of the Moon.
      1999000205, // Source: Exploring the Moon
      3589340943, // Source: Altars of Sorrow
    ],
  },
  neomuna: {
    itemHashes: [
      1123421440, // Epochal Integration
      1311684613, // Dimensional Hypotrochoid
      3635821806, // Phyllotactic Spiral
      3920310144, // Volta Bracket
    ],
    sourceHashes: [
      281362298, // Source: Strider Exotic Quest
      454251931, // Source: "What Remains" Exotic Quest
      483798855, // Source: "The Final Strand" Exotic Quest
      1750523507, // Source: Terminal Overload (Ahimsa Park)
      2697389955, // Source: "Neomuna Sightseeing" Triumph
      3041847664, // Source: Exploring Neomuna
      3773376290, // Source: Terminal Overload (Zephyr Concourse)
      4006434081, // Source: Terminal Overload
      4110186790, // Source: Terminal Overload (Límíng Harbor)
    ],
  },
  nessus: {
    sourceHashes: [
      164571094, // Source: World Quest "Exodus Black" on Nessus.
      817015032, // Source: Complete Nightfall strike "The Inverted Spire."
      1186140085, // Source: Adventure "Unbreakable" on Nessus
      1289998337, // Source: Adventure "Hack the Planet" on Nessus
      1906492169, // Source: Complete activities and earn rank-up packages on Nessus.
      2040548068, // Source: Adventure "Release" on Nessus
      2345202459, // Source: Adventure "Invitation from the Emperor" on Nessus
      2553369674, // Source: Adventure "Exodus Siege" on Nessus
      3022766747, // Source: Complete Nightfall strike "The Insight Terminus."
      3067146211, // Source: Complete Nightfall strike "Exodus Crash."
    ],
  },
  nightfall: {
    itemHashes: [
      42874240, // Uzume RR4
      192784503, // Pre Astyanax IV
      213264394, // Buzzard
      267089201, // Warden's Law (Adept)
      496556698, // Pre Astyanax IV (Adept)
      555148853, // Wendigo GL3 (Adept)
      566740455, // THE SWARM (Adept)
      672957262, // Undercurrent (Adept)
      772231794, // Hung Jury SR4
      817909300, // Undercurrent (Adept)
      912222548, // Soldier On
      927835311, // Buzzard (Adept)
      959037361, // Wild Style (Adept)
      1056103557, // Shadow Price (Adept)
      1064132738, // BrayTech Osprey (Adept)
      1151688091, // Undercurrent
      1332123064, // Wild Style
      1354727549, // The Slammer (Adept)
      1492522228, // Scintillation (Adept)
      1586231351, // Mindbender's Ambition
      1821529912, // Warden's Law
      1854753404, // Wendigo GL3
      1854753405, // The Militia's Birthright
      1891996599, // Uzume RR4 (Adept)
      1987790789, // After the Nightfall
      2063217087, // Pre Astyanax IV (Adept)
      2074041946, // Mindbender's Ambition (Adept)
      2152484073, // Warden's Law
      2322926844, // Shadow Price
      2450917538, // Uzume RR4
      2591257541, // Scintillation
      2759590322, // THE SWARM
      2883684343, // Hung Jury SR4 (Adept)
      2889501828, // The Slammer
      2914913838, // Loaded Question (Adept)
      2932922810, // Pre Astyanax IV
      3125454907, // Loaded Question
      3183283212, // Wendigo GL3
      3250744600, // Warden's Law (Adept)
      3610521673, // Uzume RR4 (Adept)
      3667553455, // BrayTech Osprey
      3686538757, // Undercurrent
      3832743906, // Hung Jury SR4
      3915197957, // Wendigo GL3 (Adept)
      4074251943, // Hung Jury SR4 (Adept)
      4162642204, // The Militia's Birthright (Adept)
    ],
    sourceHashes: [
      110159004, // Source: Complete Nightfall strike "Warden of Nothing."
      277706045, // Source: Season of the Splicer Nightfall Grandmaster
      354493557, // Source: Complete Nightfall strike "Savathûn's Song."
      817015032, // Source: Complete Nightfall strike "The Inverted Spire."
      827839814, // Source: Flawless Chest in Trials of Osiris or Grandmaster Nightfalls
      860666126, // Source: Nightfall
      1175566043, // Source: Complete Nightfall strike "A Garden World."
      1283862526, // Source: Season of the Haunted Nightfall Grandmaster
      1516560855, // Source: Season of the Seraph Grandmaster Nightfall
      1581680964, // Source: Complete Nightfall strike "Tree of Probabilities."
      1596489410, // Source: Season of the Risen Nightfall Grandmaster
      1618699950, // Source: Season of the Lost Nightfall Grandmaster
      1749037998, // Source: Nightfall
      1850609592, // Source: Nightfall
      1924238751, // Source: Complete Nightfall strike "Will of the Thousands."
      1992319882, // Source: Grandmaster Nightfalls
      2347293565, // Source: Complete Nightfall strike "The Arms Dealer."
      2376909801, // Source: "Master" Triumph in Nightfalls
      2487203690, // Source: Complete Nightfall strike "Tree of Probabilities."
      2717017239, // Source: Complete Nightfall strike "The Pyramidion."
      2805208672, // Source: Complete Nightfall strike "The Hollowed Lair."
      2851783112, // Source: Complete Nightfall strike "Lake of Shadows."
      2926805810, // Source: Complete Nightfall strike "Strange Terrain."
      2982642634, // Source: Season of Plunder Grandmaster Nightfall
      3022766747, // Source: Complete Nightfall strike "The Insight Terminus."
      3067146211, // Source: Complete Nightfall strike "Exodus Crash."
      3142874552, // Source: Nightfall
      3229688794, // Source: Grandmaster Nightfall
      3528789901, // Source: Season of the Chosen Nightfall Grandmaster
      3874934421, // Source: Complete Nightfall strike "The Corrupted."
      3964663093, // Source: Rare drop from high-scoring Nightfall strikes on Mercury.
      4208190159, // Source: Complete a Nightfall strike.
      4263201695, // Source: Complete Nightfall strike "A Garden World."
    ],
  },
  nightmare: {
    sourceHashes: [
      550270332, // Source: Complete all Nightmare Hunt time trials on Master difficulty.
      2778435282, // Source: Nightmare Hunts
      3190710249, // Source: "Root of Nightmares" Raid
    ],
  },
  nm: {
    sourceHashes: [
      1464399708, // Source: Earn rank-up packages from Executor Hideo.
    ],
    enteredDCV: 20,
  },
  paleheart: {
    sourceHashes: [
      2327253880, // Source: Exploring the Pale Heart
      3614199681, // Source: Pale Heart Triumph
    ],
  },
  'pinnacle-weapon': {
    itemHashes: [
      578459533, // Wendigo GL3
      654608616, // Revoker
      1050806815, // The Recluse
      1584643826, // Hush
      1600633250, // 21% Delirium
      3098328572, // The Recluse
      3354242550, // The Recluse
      3907337522, // Oxygen SR3
      3962575203, // Hush
    ],
    sourceHashes: [
      598662729, // Source: Reach Glory Rank "Legend" in the Crucible.
      1162859311, // Source: Complete the "Clean Getaway" quest.
      1244908294, // Source: Complete the "Loaded Question" quest from Zavala.
      2317365255, // Source: Complete the "A Loud Racket" quest.
      2883838366, // Source: Complete the "Breakneck" quest from the Drifter.
    ],
  },
  pit: {
    sourceHashes: [
      1745960977, // Source: "Pit of Heresy" Dungeon
    ],
  },
  plunder: {
    itemHashes: [
      820890091, // Planck's Stride
      1298815317, // Brigand's Law
    ],
    sourceHashes: [
      790152021, // Source: Season of Plunder Triumph
      2982642634, // Source: Season of Plunder Grandmaster Nightfall
      3265560237, // Source: Cryptic Quatrains III
      3308438907, // Source: Season of Plunder
      3740731576, // Source: "A Rising Tide" Mission
      4199401779, // Source: Season of Plunder Activities
    ],
    enteredDCV: 20,
  },
  presage: {
    sourceHashes: [
      210885364, // Source: Flawless "Presage" Exotic Quest on Master Difficulty
      2745272818, // Source: "Presage" Exotic Quest
      3597879858, // Source: "Presage" Exotic Quest
    ],
  },
  prestige: {
    sourceHashes: [
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
    ],
    enteredDCV: 20,
  },
  prophecy: {
    sourceHashes: [
      506073192, // Source: "Prophecy" Dungeon
    ],
  },
  psiops: {
    itemHashes: [
      2097055732, // Piece of Mind
      4067556514, // Thoughtless
    ],
    sourceHashes: [
      450719423, // Source: Season of the Risen
      2075569025, // PsiOps
      2363489105, // Source: Season of the Risen Vendor or Triumphs
      3563833902, // Source: Season of the Risen Triumphs
    ],
    enteredDCV: 24,
  },
  rahool: {
    sourceHashes: [
      4011186136, // Exotic Armor Focusing
    ],
  },
  raid: {
    sourceHashes: [
      160129377, // Source: "King's Fall" Raid
      557146120, // Source: Complete a Guided Game as a guide or seeker.
      654652973, // Guide 25 Last Wish encounters
      707740602, // Guide 10 Last Wish encounters
      866530798, // Source: "Not a Scratch" Triumph
      1007078046, // Source: "Vow of the Disciple" Raid
      1405897559, // Source: "Deep Stone Crypt" Raid
      1483048674, // Source: Complete the "Scourge of the Past" raid.
      1491707941, // Source: "Garden of Salvation" Raid
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      1692165595, // Source: "Rock Bottom" Triumph
      1897187034, // Source: "Crota's End" Raid
      2065138144, // Source: "Vault of Glass" Raid
      2085016678, // Source: Complete the "Scourge of the Past" raid within the first 24 hours after its launch.
      2399751101, // Acquired from the raid "Crown of Sorrow."
      2455011338, // Source: Last Wish raid.
      2653618435, // Source: Leviathan raid.
      2700267533, // Source: "Salvation's Edge" Raid
      2723305286, // Source: Raid Ring Promotional Event
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
      2882367429, // Source: Eververse\nComplete the "Vault of Glass" raid to unlock this in Eververse.
      2937902448, // Source: Leviathan, Eater of Worlds raid lair.
      3098906085, // Source: Complete a Guided Game raid as a guide.
      3147603678, // Acquired from the raid "Crown of Sorrow."
      3190710249, // Source: "Root of Nightmares" Raid
      3390269646, // Source: Guided Games Final Encounters
      3807243511, // Source: Raid Chests
      4009509410, // Source: Complete challenges in the Leviathan raid.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
      4246883461, // Source: Found in the "Scourge of the Past" raid.
    ],
    itemHashes: [
      70083888, // Nation of Beasts
      424291879, // Age-Old Bond
      501329015, // Chattering Bone
      947448544, // Shadow of Earth Shell
      1661191193, // Crown of Sorrow
      1851777734, // Apex Predator
      2027598066, // Imperial Opulence
      2027598067, // Imperial Dress
      2557722678, // Midnight Smith
      2884596447, // The Supremacy
      3388655311, // Tyranny of Heaven
      3580904580, // Legend of Acrius
      3591141932, // Techeun Force
      3668669364, // Dreaming Spectrum
      3885259140, // Transfiguration
      4103414242, // Divinity
    ],
  },
  rasputin: {
    sourceHashes: [
      504657809, // Source: Season of the Seraph Activities
      1126234343, // Source: Witness Rasputin's Full Power
      1497107113, // Source: Seasonal Quest, "Seraph Warsat Network"
      1516560855, // Source: Season of the Seraph Grandmaster Nightfall
      2230358252, // Source: End-of-Season Event
      2422551147, // Source: "Operation Seraph's Shield" Mission
      3492941398, // Source: "The Lie" Quest
      3567813252, // Source: Season of the Seraph Triumph
      3574140916, // Source: Season of the Seraph
      3937492340, // Source: Seraph Bounties
    ],
    enteredDCV: 20,
  },
  'ritual-weapon': {
    itemHashes: [
      805677041, // Buzzard
      838556752, // Python
      847329160, // Edgewise
      1179141605, // Felwinter's Lie
      1644680957, // Null Composure
      2060863616, // Salvager's Salvo
      2697058914, // Komodo-4FR
      3001205424, // Ecliptic Distaff
      3434944005, // Point of the Stag
      3535742959, // Randy's Throwing Knife
      4184808992, // Adored
      4227181568, // Exit Strategy
    ],
    sourceHashes: [
      3299964501, // Source: Earn Ranks in Vanguard, Crucible, or Gambit Playlists
      3348906688, // Source: Ranks in Vanguard Strikes, Crucible, or Gambit
    ],
  },
  rivenslair: {
    itemHashes: [
      2563668388, // Scalar Potential
      4153087276, // Appetence
    ],
    sourceHashes: [
      561126969, // Source: "Starcrossed" Mission
      1664308183, // Source: Season of the Wish Activities
      4278841194, // Source: Season of the Wish Triumphs
    ],
    aliases: ['coil'],
    enteredDCV: 24,
  },
  rootofnightmares: {
    sourceHashes: [
      3190710249, // Source: "Root of Nightmares" Raid
    ],
    aliases: ['root', 'ron'],
  },
  saint14: {
    sourceHashes: [
      2607739079, // Source: A Matter of Time
      3404977524, // Source: Contribute to the Empyrean Restoration Effort
      4046490681, // Source: Complete the "Global Resonance" Triumph
      4267157320, // Source: ???????
    ],
    enteredDCV: 20,
  },
  salvationsedge: {
    sourceHashes: [
      2700267533, // Source: "Salvation's Edge" Raid
    ],
  },
  scourgeofthepast: {
    itemHashes: [
      2557722678, // Midnight Smith
    ],
    sourceHashes: [
      1483048674, // Source: Complete the "Scourge of the Past" raid.
      2085016678, // Source: Complete the "Scourge of the Past" raid within the first 24 hours after its launch.
      4246883461, // Source: Found in the "Scourge of the Past" raid.
    ],
    aliases: ['scourge', 'sotp'],
    enteredDCV: 20,
  },
  seasonpass: {
    sourceHashes: [
      450719423, // Source: Season of the Risen
      794422188, // Source: Season of the Witch
      813075729, // Source: Season of the Deep Vendor Reputation Reward
      927967626, // Source: Season of the Deep
      1560428737, // Source: Season of Defiance
      1593696611, // Source: Season Pass Reward
      1763998430, // Source: Season Pass
      1838401392, // Source: Earned as a Season Pass reward.
      2257836668, // Source: Season of the Deep Fishing
      2379344669, // Source: Season Pass
      2676881949, // Source: Season of the Haunted
      2986594962, // Source: Season of the Wish
      3308438907, // Source: Season of Plunder
      3574140916, // Source: Season of the Seraph
    ],
  },
  servitor: {
    itemHashes: [
      599895591, // Sojourner's Tale
      2434225986, // Shattered Cipher
    ],
    sourceHashes: [
      139160732, // Source: Season of the Splicer
      277706045, // Source: Season of the Splicer Nightfall Grandmaster
      1600754038, // Source: Season of the Splicer Activities
      2040801502, // Source: Season of the Splicer Triumph
      2694738712, // Source: Season of the Splicer Quest
      2967385539, // Source: Season of the Splicer Seasonal Challenges
    ],
    enteredDCV: 20,
  },
  shatteredthrone: {
    itemHashes: [
      185321778, // The Eternal Return
      814876684, // Wish-Ender
      2844014413, // Pallas Galliot
    ],
  },
  shipwright: {
    sourceHashes: [
      96303009, // Source: Purchased from Amanda Holliday.
    ],
    enteredDCV: 20,
  },
  sonar: {
    itemHashes: [
      1081724548, // Rapacious Appetite
      1769847435, // A Distant Pull
      3016891299, // Different Times
      3890055324, // Targeted Redaction
      4066778670, // Thin Precipice
    ],
    sourceHashes: [
      813075729, // Source: Season of the Deep Vendor Reputation Reward
      927967626, // Source: Season of the Deep
      2257836668, // Source: Season of the Deep Fishing
      2671038131, // Season of the Deep - WEAPONS
      2755511565, // Source: Season of the Deep Triumph
      2811716495, // Source: Season of the Deep Activities
      2959452483, // Season of the Deep - WEAPONS
    ],
    enteredDCV: 24,
  },
  spireofstars: {
    sourceHashes: [
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
    ],
    aliases: ['sos'],
    enteredDCV: 20,
  },
  spireofthewatcher: {
    sourceHashes: [
      1597738585, // Source: "Spire of the Watcher" Dungeon
    ],
    aliases: ['sotw', 'watcher'],
  },
  strikes: {
    itemHashes: [
      42874240, // Uzume RR4
      192784503, // Pre Astyanax IV
      213264394, // Buzzard
      274843196, // Vanguard Unyielding
      772231794, // Hung Jury SR4
      781498181, // Persuader
      1151688091, // Undercurrent
      1296429091, // Deadpan Delivery
      1332123064, // Wild Style
      1661191186, // Disdain for Gold
      1821529912, // Warden's Law
      1854753404, // Wendigo GL3
      1854753405, // The Militia's Birthright
      1974641289, // Nightshade
      1999754402, // The Showrunner
      2152484073, // Warden's Law
      2322926844, // Shadow Price
      2450917538, // Uzume RR4
      2523776412, // Vanguard Burnished Steel
      2523776413, // Vanguard Steel
      2588647361, // Consequence of Duty
      2591257541, // Scintillation
      2759590322, // THE SWARM
      2788911997, // Vanguard Divide
      2788911998, // Vanguard Metallic
      2788911999, // Vanguard Veteran
      2889501828, // The Slammer
      2932922810, // Pre Astyanax IV
      3001205424, // Ecliptic Distaff
      3125454907, // Loaded Question
      3183283212, // Wendigo GL3
      3215252549, // Determination
      3667553455, // BrayTech Osprey
      3686538757, // Undercurrent
      3832743906, // Hung Jury SR4
      4060882458, // Balistraria Wrap (Ornament)
    ],
    sourceHashes: [
      288436121, // Source: Associated Vanguard Quest
      351235593, // Source: Eliminate Prison of Elders escapees found in strikes.
      412991783, // Source: Strikes
      539840256, // Source: Associated Vanguard Quest
      681989555, // Source: 3 Crossplay Beta Vanguard Strikes
      1144274899, // Source: Complete this weapon's associated Vanguard quest.
      1216155659, // Source: Complete the "Season 8: First Watch" quest.
      1244908294, // Source: Complete the "Loaded Question" quest from Zavala.
      1433518193, // Source: Vanguard Salvager's Salvo Armament Quest
      1465057711, // Source: Standard Ritual Playlist. (Vanguard Ops, Crucible, Gambit)
      1564061133, // Source: Associated Vanguard Quest
      2124937714, // Source: Zavala Rank Up Reputation
      2317365255, // Source: Complete the "A Loud Racket" quest.
      2335095658, // Source: Strikes
      2527168932, // Source: Complete strikes and earn rank-up packages from Commander Zavala.
      3299964501, // Source: Earn Ranks in Vanguard, Crucible, or Gambit Playlists
      3348906688, // Source: Ranks in Vanguard Strikes, Crucible, or Gambit
    ],
    aliases: ['zavala'],
  },
  sundial: {
    sourceHashes: [
      1618754228, // Source: Sundial Activity on Mercury
      2627087475, // Source: Obelisk Bounties and Resonance Rank Increases Across the System
    ],
    enteredDCV: 20,
  },
  tangled: {
    itemHashes: [
      1226584228, // Tangled Rust
      1226584229, // Tangled Bronze
      4085986809, // Secret Treasure
    ],
    sourceHashes: [
      110159004, // Source: Complete Nightfall strike "Warden of Nothing."
      798957490, // Source: Complete wanted escapee bounties for the Spider.
      1771326504, // Source: Complete activities and earn rank-up packages on the Tangled Shore.
      2805208672, // Source: Complete Nightfall strike "The Hollowed Lair."
      4140654910, // Source: Eliminate all Barons on the Tangled Shore.
    ],
    enteredDCV: 20,
  },
  throneworld: {
    itemHashes: [
      2721157927, // Tarnation
    ],
    sourceHashes: [
      1141831282, // Source: "Of Queens and Worms" Exotic Quest
      1823766625, // Source: "Vox Obscura" Exotic Quest
      3954922099, // Source: Exploring the Throne World
    ],
  },
  titan: {
    sourceHashes: [
      194661944, // Source: Adventure "Siren Song" on Saturn's Moon, Titan
      354493557, // Source: Complete Nightfall strike "Savathûn's Song."
      482012099, // Source: Adventure "Thief of Thieves" on Saturn's Moon, Titan
      636474187, // Source: Adventure "Deathless" on Saturn's Moon, Titan
      3534706087, // Source: Complete activities and earn rank-up packages on Saturn's Moon, Titan.
    ],
    enteredDCV: 20,
  },
  trials: {
    itemHashes: [
      2307365, // The Inquisitor (Adept)
      711889599, // Whistler's Whim (Adept)
      1401300690, // Eye of Sol
      1574601402, // Whistler's Whim
      1983519830, // Hardened by Trial
      2059255495, // Eye of Sol (Adept)
      2071635914, // Light for the Lost
      2071635915, // Flawless Empyrean
      2185327324, // The Inquisitor
      2421180981, // Incisor (Adept)
      2759251821, // Unwavering Duty (Adept)
      3102421004, // Exalted Truth
      3624844116, // Unwavering Duty
      3920882229, // Exalted Truth (Adept)
      4248997900, // Incisor
    ],
    sourceHashes: [
      139599745, // Source: Earn seven wins on a single Trials ticket.
      550270332, // Source: Complete all Nightmare Hunt time trials on Master difficulty.
      613791463, // Source: Saint-14 Rank Up Reputation
      752988954, // Source: Flawless Chest in Trials of Osiris
      827839814, // Source: Flawless Chest in Trials of Osiris or Grandmaster Nightfalls
      1607607347, // Source: Complete Trials tickets and earn rank-up packages from the Emissary of the Nine.
      2857787138, // Source: Trials of Osiris
      3390015730, // Source: Trials of Osiris Challenges
      3471208558, // Source: Trials of Osiris Wins
      3543690049, // Source: Complete a flawless Trials ticket.
      3564069447, // Source: Flawless Win with a "Flight of the Pigeon" Medal
    ],
  },
  umbral: {
    sourceHashes: [
      287889699, // Source: Umbral Engram Tutorial
      1286883820, // Source: Prismatic Recaster
    ],
    enteredDCV: 20,
  },
  vaultofglass: {
    sourceHashes: [
      2065138144, // Source: "Vault of Glass" Raid
    ],
    aliases: ['vog'],
  },
  vexoffensive: {
    itemHashes: [
      351285766, // Substitutional Alloy Greaves
      377757362, // Substitutional Alloy Hood
      509561140, // Substitutional Alloy Gloves
      509561142, // Substitutional Alloy Gloves
      509561143, // Substitutional Alloy Gloves
      695795213, // Substitutional Alloy Helm
      844110491, // Substitutional Alloy Gloves
      1137424312, // Substitutional Alloy Cloak
      1137424314, // Substitutional Alloy Cloak
      1137424315, // Substitutional Alloy Cloak
      1348357884, // Substitutional Alloy Gauntlets
      1584183805, // Substitutional Alloy Cloak
      1721943440, // Substitutional Alloy Boots
      1721943441, // Substitutional Alloy Boots
      1721943442, // Substitutional Alloy Boots
      1855720513, // Substitutional Alloy Vest
      1855720514, // Substitutional Alloy Vest
      1855720515, // Substitutional Alloy Vest
      2096778461, // Substitutional Alloy Strides
      2096778462, // Substitutional Alloy Strides
      2096778463, // Substitutional Alloy Strides
      2468603405, // Substitutional Alloy Plate
      2468603406, // Substitutional Alloy Plate
      2468603407, // Substitutional Alloy Plate
      2657028416, // Substitutional Alloy Vest
      2687273800, // Substitutional Alloy Grips
      2690973101, // Substitutional Alloy Hood
      2690973102, // Substitutional Alloy Hood
      2690973103, // Substitutional Alloy Hood
      2742760292, // Substitutional Alloy Plate
      2761292744, // Substitutional Alloy Bond
      2815379657, // Substitutional Alloy Bond
      2815379658, // Substitutional Alloy Bond
      2815379659, // Substitutional Alloy Bond
      2903026872, // Substitutional Alloy Helm
      2903026873, // Substitutional Alloy Helm
      2903026874, // Substitutional Alloy Helm
      2942269704, // Substitutional Alloy Gauntlets
      2942269705, // Substitutional Alloy Gauntlets
      2942269707, // Substitutional Alloy Gauntlets
      3166926328, // Substitutional Alloy Robes
      3166926330, // Substitutional Alloy Robes
      3166926331, // Substitutional Alloy Robes
      3192738009, // Substitutional Alloy Greaves
      3192738010, // Substitutional Alloy Greaves
      3192738011, // Substitutional Alloy Greaves
      3364258850, // Substitutional Alloy Strides
      3680920565, // Substitutional Alloy Robes
      3757338780, // Substitutional Alloy Mark
      3757338782, // Substitutional Alloy Mark
      3757338783, // Substitutional Alloy Mark
      3911047865, // Substitutional Alloy Mark
      4013678605, // Substitutional Alloy Boots
      4026120124, // Substitutional Alloy Grips
      4026120125, // Substitutional Alloy Grips
      4026120127, // Substitutional Alloy Grips
      4070722289, // Substitutional Alloy Mask
      4078925540, // Substitutional Alloy Mask
      4078925541, // Substitutional Alloy Mask
      4078925542, // Substitutional Alloy Mask
    ],
    sourceHashes: [
      4122810030, // Source: Complete seasonal activities during Season of the Undying.
    ],
    enteredDCV: 20,
  },
  vowofthedisciple: {
    sourceHashes: [
      1007078046, // Source: "Vow of the Disciple" Raid
    ],
    aliases: ['vow', 'votd'],
  },
  warlordsruin: {
    sourceHashes: [
      613435025, // Source: "Warlord's Ruin" Dungeon
    ],
  },
  wartable: {
    sourceHashes: [
      2653840925, // Source: Challenger's Proving VII Quest
      3818317874, // Source: War Table Reputation Reset
      4079816474, // Source: War Table
    ],
    enteredDCV: 24,
  },
  wellspring: {
    sourceHashes: [
      82267399, // Source: "Warden of the Spring" Triumph
      502279466, // Source: Wellspring Boss Vezuul, Lightflayer
      2917218318, // Source: Wellspring Boss Golmag, Warden of the Spring
      3359853911, // Source: Wellspring Boss Zeerik, Lightflayer
      3411812408, // Source: "All the Spring's Riches" Triumph
      3450213291, // Source: Wellspring Boss Bor'gong, Warden of the Spring
    ],
  },
  wrathborn: {
    itemHashes: [
      197764097, // Wild Hunt Boots
      238284968, // Wild Hunt Strides
      251310542, // Wild Hunt Hood
      317220729, // Wild Hunt Vestment
      1148770067, // Wild Hunt Cloak
      1276513983, // Wild Hunt Gloves
      1458739906, // Wild Hunt Vest
      2025716654, // Wild Hunt Grasps
      2055947316, // Wild Hunt Bond
      2279193565, // Wild Hunt Mark
      2453357042, // Blast Battue
      2545401128, // Wild Hunt Gauntlets
      2776503072, // Royal Chase
      3180809346, // Wild Hunt Greaves
      3351935136, // Wild Hunt Plate
      3887272785, // Wild Hunt Helm
      4079117607, // Wild Hunt Mask
    ],
    sourceHashes: [
      841568343, // Source: "Hunt for the Wrathborn" Quest
      3107094548, // Source: "Coup de Grâce" Mission
    ],
    enteredDCV: 20,
  },
};

export default D2Sources;
