const D2Sources: {
  [key: string]: { itemHashes: number[]; sourceHashes: number[]; searchString: string[] };
} = {
  '30th': {
    itemHashes: [],
    sourceHashes: [
      443340273, // Source: Xûr's Treasure Hoard in Eternity
      675740011, // Source: "Grasp of Avarice" Dungeon
      1102533392, // Source: Xûr (Eternity)
      1394793197, // Source: "Magnum Opus" Quest
      2763252588, // Source: "And Out Fly the Wolves" Quest
    ],
    searchString: [],
  },
  ada: {
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
    searchString: [],
  },
  adventure: {
    itemHashes: [],
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
    searchString: [],
  },
  avalon: {
    itemHashes: [],
    sourceHashes: [
      709680645, // Source: "Truly Satisfactory" Triumph
      1476475066, // Source: "Firmware Update" Triumph
      1730197643, // Source: //node.ovrd.AVALON// Exotic Quest
    ],
    searchString: [],
  },
  banshee: {
    itemHashes: [],
    sourceHashes: [
      1459595344, // Source: Purchase from Banshee-44 or Ada-1
      1788267693, // Source: Earn rank-up packages from Banshee-44.
      2986841134, // Source: Salvager's Salvo Armament Quest
      3512613235, // Source: "A Sacred Fusion" Quest
    ],
    searchString: [],
  },
  battlegrounds: {
    itemHashes: [
      2121785039, // Brass Attacks
      3075224551, // Threaded Needle
    ],
    sourceHashes: [
      3391325445, // Source: Battlegrounds
    ],
    searchString: [],
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
    searchString: [],
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
    searchString: [],
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
    searchString: [],
  },
  campaign: {
    itemHashes: [],
    sourceHashes: [
      13912404, // Source: Unlock Your Arc Subclass
      100617404, // Requires Titan Class
      286427063, // Source: Fallen Empire Campaign
      409652252, // Source: The Witch Queen Campaign
      431243768, // Source: The Edge of Fate Campaign
      460742691, // Requires Guardian Rank 6: Masterwork Weapons
      569214265, // Source: Red War Campaign
      633667627, // Requires Tier 4 or 5 Weapon
      677167936, // Source: Complete the campaign as a Warlock.
      712662541, // Requires Season 27 Tier 5 Weapon
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
      3174947771, // Requires Guardian Rank 6: Vendor Challenges
      3431853656, // Achieved a Grimoire score of over 5000 in Destiny.
      3532642391, // Source: Forsaken Campaign
      3704442923, // Source: Curse of Osiris Campaign
      3936473457, // Requires Warlock Class
      4008954452, // Requires Shaped or Enhanced Weapon
      4288102251, // Requires 1,000 Titan Kills
      4290499613, // Source: Complete the campaign as a Hunter.
    ],
    searchString: [],
  },
  cayde6: {
    itemHashes: [],
    sourceHashes: [
      2206233229, // Source: Follow treasure maps.
    ],
    searchString: [],
  },
  coil: {
    itemHashes: [
      2563668388, // Scalar Potential
      4153087276, // Appetence
    ],
    sourceHashes: [
      561126969, // Source: "Starcrossed" Mission
      1664308183, // Source: Season of the Wish Activities
      4278841194, // Source: Season of the Wish Triumphs
    ],
    searchString: [],
  },
  compass: {
    itemHashes: [],
    sourceHashes: [
      164083100, // Source: Display of Supremacy, Weekly Challenge
      3100439379, // Source: Mission "Exorcism"
    ],
    searchString: [],
  },
  contact: {
    itemHashes: [],
    sourceHashes: [
      2039343154, // Source: Contact Public Event
    ],
    searchString: [],
  },
  cos: {
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
    searchString: [],
  },
  crota: {
    itemHashes: [],
    sourceHashes: [
      1897187034, // Source: "Crota's End" Raid
    ],
    searchString: [],
  },
  crotasend: {
    itemHashes: [],
    sourceHashes: [
      1897187034, // Source: "Crota's End" Raid
    ],
    searchString: [],
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
    searchString: [],
  },
  crucible: {
    itemHashes: [
      2307365, // The Inquisitor (Adept)
      51129316, // The Inquisitor
      161675590, // Whistler's Whim (Adept)
      303107619, // Tomorrow's Answer (Adept)
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
      1201528146, // Exalted Truth (Adept)
      1230660649, // Victory's Wreath
      1292594730, // The Summoner (Adept)
      1321626661, // Eye of Sol (Adept)
      1401300690, // Eye of Sol
      1574601402, // Whistler's Whim
      1661191197, // Disdain for Glitter
      1705843397, // Exalted Truth (Adept)
      1711056134, // Incisor
      1820994983, // The Summoner
      1893967086, // Keen Thistle
      1968410628, // The Prophet
      1973107014, // Igneous Hammer
      2022294213, // Shayura's Wrath
      2059255495, // Eye of Sol (Adept)
      2185327324, // The Inquisitor
      2300143112, // Yesterday's Question
      2314610827, // Igneous Hammer (Adept)
      2330860573, // The Inquisitor (Adept)
      2378785953, // Yesterday's Question (Adept)
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
      3009199534, // Tomorrow's Answer
      3019024381, // The Prophet (Adept)
      3102421004, // Exalted Truth
      3165143747, // Whistler's Whim
      3193598749, // The Immortal (Adept)
      3332125295, // Aisha's Care (Adept)
      3436626079, // Exalted Truth
      3444632029, // Unwavering Duty (Adept)
      3503560035, // Keen Thistle (Adept)
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
      164083100, // Source: Display of Supremacy, Weekly Challenge
      454115234, // Source: Associated Crucible Quest
      598662729, // Source: Reach Glory Rank "Legend" in the Crucible.
      705363737, // Source: Heavy Metal: Supremacy
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
      2602565384, // Source: Win competitive matches while at Ascendant 0 Rank.
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
    searchString: [],
  },
  dcv: {
    itemHashes: [
      197764097, // Wild Hunt Boots
      238284968, // Wild Hunt Strides
      251310542, // Wild Hunt Hood
      317220729, // Wild Hunt Vestment
      351285766, // Substitutional Alloy Greaves
      377757362, // Substitutional Alloy Hood
      417164956, // Jötunn
      509561140, // Substitutional Alloy Gloves
      509561142, // Substitutional Alloy Gloves
      509561143, // Substitutional Alloy Gloves
      695795213, // Substitutional Alloy Helm
      820890091, // Planck's Stride
      844110491, // Substitutional Alloy Gloves
      947448544, // Shadow of Earth Shell
      1137424312, // Substitutional Alloy Cloak
      1137424314, // Substitutional Alloy Cloak
      1137424315, // Substitutional Alloy Cloak
      1148770067, // Wild Hunt Cloak
      1226584228, // Tangled Rust
      1226584229, // Tangled Bronze
      1276513983, // Wild Hunt Gloves
      1298815317, // Brigand's Law
      1348357884, // Substitutional Alloy Gauntlets
      1458739906, // Wild Hunt Vest
      1478986057, // Without Remorse
      1584183805, // Substitutional Alloy Cloak
      1661191192, // The Tribute Hall
      1661191193, // Crown of Sorrow
      1661191194, // A Hall of Delights
      1661191195, // The Imperial Menagerie
      1721943440, // Substitutional Alloy Boots
      1721943441, // Substitutional Alloy Boots
      1721943442, // Substitutional Alloy Boots
      1855720513, // Substitutional Alloy Vest
      1855720514, // Substitutional Alloy Vest
      1855720515, // Substitutional Alloy Vest
      2025716654, // Wild Hunt Grasps
      2027598066, // Imperial Opulence
      2027598067, // Imperial Dress
      2055947316, // Wild Hunt Bond
      2096778461, // Substitutional Alloy Strides
      2096778462, // Substitutional Alloy Strides
      2096778463, // Substitutional Alloy Strides
      2279193565, // Wild Hunt Mark
      2453357042, // Blast Battue
      2468603405, // Substitutional Alloy Plate
      2468603406, // Substitutional Alloy Plate
      2468603407, // Substitutional Alloy Plate
      2545401128, // Wild Hunt Gauntlets
      2557722678, // Midnight Smith
      2657028416, // Substitutional Alloy Vest
      2687273800, // Substitutional Alloy Grips
      2690973101, // Substitutional Alloy Hood
      2690973102, // Substitutional Alloy Hood
      2690973103, // Substitutional Alloy Hood
      2742760292, // Substitutional Alloy Plate
      2761292744, // Substitutional Alloy Bond
      2776503072, // Royal Chase
      2778013407, // Firefright
      2815379657, // Substitutional Alloy Bond
      2815379658, // Substitutional Alloy Bond
      2815379659, // Substitutional Alloy Bond
      2816212794, // Bad Juju
      2868525740, // The Collector
      2868525741, // The Invader
      2868525742, // The Reaper
      2868525743, // The Sentry
      2903026872, // Substitutional Alloy Helm
      2903026873, // Substitutional Alloy Helm
      2903026874, // Substitutional Alloy Helm
      2942269704, // Substitutional Alloy Gauntlets
      2942269705, // Substitutional Alloy Gauntlets
      2942269707, // Substitutional Alloy Gauntlets
      3166926328, // Substitutional Alloy Robes
      3166926330, // Substitutional Alloy Robes
      3166926331, // Substitutional Alloy Robes
      3176509806, // Árma Mákhēs
      3180809346, // Wild Hunt Greaves
      3192738009, // Substitutional Alloy Greaves
      3192738010, // Substitutional Alloy Greaves
      3192738011, // Substitutional Alloy Greaves
      3211806999, // Izanagi's Burden
      3351935136, // Wild Hunt Plate
      3364258850, // Substitutional Alloy Strides
      3580904580, // Legend of Acrius
      3588934839, // Le Monarque
      3650581584, // New Age Black Armory
      3650581585, // Refurbished Black Armory
      3650581586, // Rasmussen Clan
      3650581587, // House of Meyrin
      3650581588, // Satou Tribe
      3650581589, // Bergusian Night
      3680920565, // Substitutional Alloy Robes
      3757338780, // Substitutional Alloy Mark
      3757338782, // Substitutional Alloy Mark
      3757338783, // Substitutional Alloy Mark
      3808901541, // Viper Strike
      3841416152, // Golden Empire
      3841416153, // Goldleaf
      3841416154, // Shadow Gilt
      3841416155, // Cinderchar
      3875444086, // The Emperor's Chosen
      3887272785, // Wild Hunt Helm
      3911047865, // Substitutional Alloy Mark
      4013678605, // Substitutional Alloy Boots
      4026120124, // Substitutional Alloy Grips
      4026120125, // Substitutional Alloy Grips
      4026120127, // Substitutional Alloy Grips
      4070722289, // Substitutional Alloy Mask
      4078925540, // Substitutional Alloy Mask
      4078925541, // Substitutional Alloy Mask
      4078925542, // Substitutional Alloy Mask
      4079117607, // Wild Hunt Mask
      4085986809, // Secret Treasure
    ],
    sourceHashes: [
      96303009, // Source: Purchased from Amanda Holliday.
      110159004, // Source: Complete Nightfall strike "Warden of Nothing."
      146504277, // Source: Earn rank-up packages from Arach Jalaal.
      148542898, // Source: Equip the full Mercury destination set on a Warlock.
      164083100, // Source: Display of Supremacy, Weekly Challenge
      194661944, // Source: Adventure "Siren Song" on Saturn's Moon, Titan
      266896577, // Source: Solve the Norse glyph puzzle.
      315474873, // Source: Complete activities and earn rank-up packages on Io.
      354493557, // Source: Complete Nightfall strike "Savathûn's Song."
      439994003, // Source: Complete the "Master Smith" Triumph.
      482012099, // Source: Adventure "Thief of Thieves" on Saturn's Moon, Titan
      620369433, // Source: Season of the Haunted Triumph
      636474187, // Source: Adventure "Deathless" on Saturn's Moon, Titan
      783399508, // Source: Adventure "Supply and Demand" in the European Dead Zone
      790152021, // Source: Season of Plunder Triumph
      790433146, // Source: Adventure "Dark Alliance" in the European Dead Zone
      798957490, // Source: Complete wanted escapee bounties for the Spider.
      841568343, // Source: "Hunt for the Wrathborn" Quest
      925197669, // Source: Complete a Bergusia Forge ignition.
      948753311, // Source: Found by completing Volundr Forge ignitions.
      976328308, // Source: The Derelict Leviathan
      1036506031, // Source: Complete activities and earn rank-up packages on Mars.
      1067250718, // Source: Adventure "Arecibo" on Io
      1175566043, // Source: Complete Nightfall strike "A Garden World."
      1186140085, // Source: Adventure "Unbreakable" on Nessus
      1283862526, // Source: Season of the Haunted Nightfall Grandmaster
      1286332045, // Source: Found by completing Izanami Forge ignitions.
      1289998337, // Source: Adventure "Hack the Planet" on Nessus
      1299614150, // Source: [REDACTED] on Mars.
      1400219831, // Source: Equip the full Mercury destination set on a Hunter.
      1411886787, // Source: Equip the full Mercury destination set on a Titan.
      1457456824, // Source: Complete the "Reunited Siblings" Triumph.
      1464399708, // Source: Earn rank-up packages from Executor Hideo.
      1465990789, // Source: Solve the Japanese glyph puzzle.
      1483048674, // Source: Complete the "Scourge of the Past" raid.
      1527887247, // Source: Adventure "Red Legion, Black Oil" in the European Dead Zone
      1581680964, // Source: Complete Nightfall strike "Tree of Probabilities."
      1596507419, // Source: Complete a Gofannon Forge ignition.
      1618754228, // Source: Sundial Activity on Mercury
      1654120320, // Source: Complete activities and earn rank-up packages on Mercury.
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      1736997121, // Source: Adventure "Stop and Go" in the European Dead Zone
      1771326504, // Source: Complete activities and earn rank-up packages on the Tangled Shore.
      1832642406, // Source: World Quest "Dynasty" on Io.
      1861838843, // Source: Adventure "A Frame Job" in the European Dead Zone
      1924238751, // Source: Complete Nightfall strike "Will of the Thousands."
      1952675042, // Source: Complete Gambit Prime matches and increase your rank.
      2039343154, // Source: Contact Public Event
      2040548068, // Source: Adventure "Release" on Nessus
      2062058385, // Source: Crafted in a Black Armory forge.
      2085016678, // Source: Complete the "Scourge of the Past" raid within the first 24 hours after its launch.
      2096915131, // Source: Adventure "Poor Reception" in the European Dead Zone
      2206233229, // Source: Follow treasure maps.
      2273761598, // Source: Season of the Haunted Activities
      2310754348, // Source: World Quest "Data Recovery" on Mars.
      2345202459, // Source: Adventure "Invitation from the Emperor" on Nessus
      2384327872, // Source: Solve the French glyph puzzle.
      2392127416, // Source: Adventure "Cliffhanger" on Io
      2399751101, // Acquired from the raid "Crown of Sorrow."
      2487203690, // Source: Complete Nightfall strike "Tree of Probabilities."
      2511152325, // Acquired from the Menagerie aboard the Leviathan.
      2541753910, // Source: Complete the "Master Blaster" Triumph.
      2553369674, // Source: Adventure "Exodus Siege" on Nessus
      2627087475, // Source: Obelisk Bounties and Resonance Rank Increases Across the System
      2653618435, // Source: Leviathan raid.
      2676881949, // Source: Season of the Haunted
      2717017239, // Source: Complete Nightfall strike "The Pyramidion."
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      2805208672, // Source: Complete Nightfall strike "The Hollowed Lair."
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
      2926805810, // Source: Complete Nightfall strike "Strange Terrain."
      2937902448, // Source: Leviathan, Eater of Worlds raid lair.
      2966694626, // Source: Found by solving the mysteries behind the Black Armory's founding families.
      2982642634, // Source: Season of Plunder Grandmaster Nightfall
      3047033583, // Source: Returned the Obsidian Accelerator.
      3079246067, // Source: Complete Osiris' Lost Prophecies for Brother Vance on Mercury.
      3094114967, // Source: Season of the Lost Ritual Playlists
      3107094548, // Source: "Coup de Grâce" Mission
      3147603678, // Acquired from the raid "Crown of Sorrow."
      3257722699, // Source: Complete the "Clean Up on Aisle Five" Triumph.
      3265560237, // Source: Cryptic Quatrains III
      3308438907, // Source: Season of Plunder
      3390164851, // Source: Found by turning in Black Armory bounties.
      3427537854, // Source: Adventure "Road Rage" on Io
      3534706087, // Source: Complete activities and earn rank-up packages on Saturn's Moon, Titan.
      3569603185, // Source: Earn rank-up packages from Lakshmi-2.
      3740731576, // Source: "A Rising Tide" Mission
      3754173885, // Source: Adventure "Getting Your Hands Dirty" in the European Dead Zone
      3764925750, // Source: Complete an Izanami Forge ignition.
      3964663093, // Source: Rare drop from high-scoring Nightfall strikes on Mercury.
      4009509410, // Source: Complete challenges in the Leviathan raid.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
      4101102010, // Source: Found by completing Bergusia Forge ignitions.
      4122810030, // Source: Complete seasonal activities during Season of the Undying.
      4137108180, // Source: Escalation Protocol on Mars.
      4140654910, // Source: Eliminate all Barons on the Tangled Shore.
      4199401779, // Source: Season of Plunder Activities
      4214471686, // Source: Adventure "Unsafe at Any Speed" in the European Dead Zone
      4246883461, // Source: Found in the "Scourge of the Past" raid.
      4247521481, // Source: Complete the "Beautiful but Deadly" Triumph.
      4263201695, // Source: Complete Nightfall strike "A Garden World."
      4290227252, // Source: Complete a Volundr Forge ignition.
    ],
    searchString: [
      'mercury',
      'mars',
      'titan',
      'io',
      'leviathan',
      'ep',
      'blackarmory',
      'menagerie',
      'eow',
      'sos',
      'scourge',
      'crownofsorrow',
    ],
  },
  deepstonecrypt: {
    itemHashes: [],
    sourceHashes: [
      866530798, // Source: "Not a Scratch" Triumph
      1405897559, // Source: "Deep Stone Crypt" Raid
      1692165595, // Source: "Rock Bottom" Triumph
    ],
    searchString: [],
  },
  deluxe: {
    itemHashes: [],
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
    searchString: [],
  },
  desertperpetual: {
    itemHashes: [],
    sourceHashes: [
      596084342, // Source: "The Desert Perpetual" Raid
      2127551856, // Source: "The Desert Perpetual" Epic Raid
    ],
    searchString: [],
  },
  do: {
    itemHashes: [],
    sourceHashes: [
      146504277, // Source: Earn rank-up packages from Arach Jalaal.
    ],
    searchString: [],
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
    searchString: [],
  },
  drifter: {
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
    searchString: [],
  },
  dsc: {
    itemHashes: [],
    sourceHashes: [
      866530798, // Source: "Not a Scratch" Triumph
      1405897559, // Source: "Deep Stone Crypt" Raid
      1692165595, // Source: "Rock Bottom" Triumph
    ],
    searchString: [],
  },
  duality: {
    itemHashes: [],
    sourceHashes: [
      1282207663, // Source: Dungeon "Duality"
    ],
    searchString: [],
  },
  dungeon: {
    itemHashes: [
      14929251, // Long Arm
      185321778, // The Eternal Return
      189194532, // No Survivors (Adept)
      233402416, // New Pacific Epitaph (Adept)
      291447487, // Cold Comfort
      492673102, // New Pacific Epitaph
      749483159, // Prosecutor (Adept)
      814876684, // Wish-Ender
      1050582210, // Greasy Luck (Adept)
      1066598837, // Relentless (Adept)
      1157220231, // No Survivors (Adept)
      1303313141, // Unsworn
      1460079227, // Liminal Vigil
      1685406703, // Greasy Luck
      1773934241, // Judgment
      1817605554, // Cold Comfort (Adept)
      1904170910, // A Sudden Death
      1987644603, // Judgment (Adept)
      2059741649, // New Pacific Epitaph
      2126543269, // Cold Comfort (Adept)
      2129814338, // Prosecutor
      2477408004, // Wilderflight (Adept)
      2730671571, // Terminus Horizon
      2760833884, // Cold Comfort
      2764074355, // A Sudden Death (Adept)
      2844014413, // Pallas Galliot
      2934305134, // Greasy Luck
      2982006965, // Wilderflight
      3185151619, // New Pacific Epitaph (Adept)
      3210739171, // Greasy Luck (Adept)
      3329218848, // Judgment (Adept)
      3421639790, // Liminal Vigil (Adept)
      3681280908, // Relentless
      3692140710, // Long Arm (Adept)
      4193602194, // No Survivors
      4228149269, // No Survivors
      4267192886, // Terminus Horizon (Adept)
    ],
    sourceHashes: [
      506073192, // Source: "Prophecy" Dungeon
      613435025, // Source: "Warlord's Ruin" Dungeon
      675740011, // Source: "Grasp of Avarice" Dungeon
      877404349, // Source: Rite of the Nine
      1282207663, // Source: Dungeon "Duality"
      1597738585, // Source: "Spire of the Watcher" Dungeon
      1745960977, // Source: "Pit of Heresy" Dungeon
      2463956052, // Source: Vesper's Host
      2607970476, // Source: Sundered Doctrine
      3288974535, // Source: "Ghosts of the Deep" Dungeon
    ],
    searchString: [],
  },
  echoes: {
    itemHashes: [],
    sourceHashes: [
      536806855, // Source: Episode: Echoes
      2306801178, // Source: Episode: Echoes Activities
      2514060836, // Source: Episode: Echoes Enigma Protocol Activity
      2631398023, // Source: Radiolite Bay Deposits
    ],
    searchString: [],
  },
  edgeoffate: {
    itemHashes: [],
    sourceHashes: [
      431243768, // Source: The Edge of Fate Campaign
      4034415948, // Source: The Edge of Fate Activities
    ],
    searchString: [],
  },
  edz: {
    itemHashes: [],
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
    searchString: [],
  },
  enclave: {
    itemHashes: [],
    sourceHashes: [
      1309588429, // Source: "Chief Investigator" Triumph
      2055289873, // Source: "The Evidence Board" Exotic Quest
    ],
    searchString: [],
  },
  eow: {
    itemHashes: [],
    sourceHashes: [
      2937902448, // Source: Leviathan, Eater of Worlds raid lair.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
    ],
    searchString: [],
  },
  ep: {
    itemHashes: [],
    sourceHashes: [
      4137108180, // Source: Escalation Protocol on Mars.
    ],
    searchString: [],
  },
  europa: {
    itemHashes: [],
    sourceHashes: [
      286427063, // Source: Fallen Empire Campaign
      1148859274, // Source: Exploring Europa
      1492981395, // Source: "The Stasis Prototype" Quest
      2171520631, // Source: "Lost Lament" Exotic Quest
      3125456997, // Source: Europan Tour
      3965815470, // Source: Higher Difficulty Empire Hunts
    ],
    searchString: [],
  },
  events: {
    itemHashes: [
      425681240, // Acosmic
      495940989, // Avalanche
      601948197, // Zephyr
      689294985, // Jurassic Green
      1123433952, // Stay Frosty
      1183116657, // Glacioclasm
      1280894514, // Mechabre
      1845372864, // Albedo Wing
      1845978721, // Avalanche
      2477980485, // Mechabre
      2603335652, // Jurassic Green
      2812100428, // Stay Frosty
      2814093983, // Cold Front
      2869466318, // BrayTech Werewolf
      3400256755, // Zephyr
      3558681245, // BrayTech Werewolf
      3559361670, // The Title
      3573686365, // Glacioclasm
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
      894030814, // Source: Heavy Metal Event
      923678151, // Source: Upgraded Event Card Reward
      1054169368, // Source: Festival of the Lost 2021
      1225476079, // Source: Moments of Triumph 2022
      1232863328, // Source: Moments of Triumph 2024
      1360005982, // Completed a Moment of Triumph in Destiny's second year.
      1397119901, // Completed a Moment of Triumph in Destiny's first year.
      1416471099, // Source: Moments of Triumph 2023
      1462687159, // Reached level 5 in the Ages of Triumph record book.
      1568732528, // Source: Guardian Games 2024
      1666677522, // Source: Solstice
      1677921161, // Source: Festival of the Lost 2018.
      1919933822, // Source: Festival of the Lost 2020
      1953779156, // Source: Events
      2006303146, // Source: Guardian Games 2022
      2011810450, // Source: Season 13 Guardian Games
      2045032171, // Source: Arms Week Event
      2050870152, // Source: Solstice
      2187511136, // Source: Earned during the seasonal Revelry event.
      2364515524, // Source: Dawning 2022
      2473294025, // Source: Guardian Games 2023
      2502262376, // Source: Earned during the seasonal Crimson Days event.
      2797674516, // Source: Moments of Triumph 2021
      3092212681, // Source: Dawning 2019
      3095773956, // Source: Guardian Games 2025
      3112857249, // Completed all 10 Moments of Triumph in Destiny's first year.
      3190938946, // Source: Festival of the Lost 2019
      3388021959, // Source: Guardian Games
      3482766024, // Source: Festival of the Lost 2024
      3693722471, // Source: Festival of the Lost 2020
      3724111213, // Source: Solstice 2019
      3736521079, // Reached level 1 in the Ages of Triumph record book.
      3952847349, // Source: The Dawning.
      4041583267, // Source: Festival of the Lost
      4054646289, // Source: Earned during the seasonal Dawning event.
    ],
    searchString: ['dawning', 'crimsondays', 'solstice', 'fotl', 'revelry', 'games'],
  },
  eververse: {
    itemHashes: [],
    sourceHashes: [
      269962496, // Source: Eververse
      860688654, // Source: Eververse
      2882367429, // Source: Eververse\nComplete the "Vault of Glass" raid to unlock this in Eververse.
      4036739795, // Source: Bright Engrams
    ],
    searchString: [],
  },
  evidenceboard: {
    itemHashes: [],
    sourceHashes: [
      1309588429, // Source: "Chief Investigator" Triumph
      2055289873, // Source: "The Evidence Board" Exotic Quest
    ],
    searchString: [],
  },
  exoticquest: {
    itemHashes: [],
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
      2296534980, // Source: Exotic Mission Encore
      2745272818, // Source: "Presage" Exotic Quest
      2856954949, // Source: "Let Loose Thy Talons" Exotic Quest
      3597879858, // Source: "Presage" Exotic Quest
    ],
    searchString: [],
  },
  fwc: {
    itemHashes: [],
    sourceHashes: [
      3569603185, // Source: Earn rank-up packages from Lakshmi-2.
    ],
    searchString: [],
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
    searchString: [],
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
    searchString: [],
  },
  garden: {
    itemHashes: [
      4103414242, // Divinity
    ],
    sourceHashes: [
      1491707941, // Source: "Garden of Salvation" Raid
    ],
    searchString: [],
  },
  gardenofsalvation: {
    itemHashes: [
      4103414242, // Divinity
    ],
    sourceHashes: [
      1491707941, // Source: "Garden of Salvation" Raid
    ],
    searchString: [],
  },
  ghostsofthedeep: {
    itemHashes: [
      189194532, // No Survivors (Adept)
      233402416, // New Pacific Epitaph (Adept)
      291447487, // Cold Comfort
      492673102, // New Pacific Epitaph
      1050582210, // Greasy Luck (Adept)
      1157220231, // No Survivors (Adept)
      1685406703, // Greasy Luck
      1817605554, // Cold Comfort (Adept)
      2059741649, // New Pacific Epitaph
      2126543269, // Cold Comfort (Adept)
      2760833884, // Cold Comfort
      2934305134, // Greasy Luck
      3185151619, // New Pacific Epitaph (Adept)
      3210739171, // Greasy Luck (Adept)
      4193602194, // No Survivors
      4228149269, // No Survivors
    ],
    sourceHashes: [
      3288974535, // Source: "Ghosts of the Deep" Dungeon
    ],
    searchString: [],
  },
  gos: {
    itemHashes: [
      4103414242, // Divinity
    ],
    sourceHashes: [
      1491707941, // Source: "Garden of Salvation" Raid
    ],
    searchString: [],
  },
  gotd: {
    itemHashes: [
      189194532, // No Survivors (Adept)
      233402416, // New Pacific Epitaph (Adept)
      291447487, // Cold Comfort
      492673102, // New Pacific Epitaph
      1050582210, // Greasy Luck (Adept)
      1157220231, // No Survivors (Adept)
      1685406703, // Greasy Luck
      1817605554, // Cold Comfort (Adept)
      2059741649, // New Pacific Epitaph
      2126543269, // Cold Comfort (Adept)
      2760833884, // Cold Comfort
      2934305134, // Greasy Luck
      3185151619, // New Pacific Epitaph (Adept)
      3210739171, // Greasy Luck (Adept)
      4193602194, // No Survivors
      4228149269, // No Survivors
    ],
    sourceHashes: [
      3288974535, // Source: "Ghosts of the Deep" Dungeon
    ],
    searchString: [],
  },
  grasp: {
    itemHashes: [],
    sourceHashes: [
      675740011, // Source: "Grasp of Avarice" Dungeon
    ],
    searchString: [],
  },
  gunsmith: {
    itemHashes: [],
    sourceHashes: [
      1459595344, // Source: Purchase from Banshee-44 or Ada-1
      1788267693, // Source: Earn rank-up packages from Banshee-44.
      2986841134, // Source: Salvager's Salvo Armament Quest
      3512613235, // Source: "A Sacred Fusion" Quest
    ],
    searchString: [],
  },
  harbinger: {
    itemHashes: [],
    sourceHashes: [
      2856954949, // Source: "Let Loose Thy Talons" Exotic Quest
    ],
    searchString: [],
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
    searchString: [],
  },
  heresy: {
    itemHashes: [],
    sourceHashes: [
      21494224, // Source: Offer the correct final answer in an uncharted space.
      745481267, // Source: Intrinsic Iteration Triumph
      1341921330, // Source: Episode: Heresy Activities
      1792957897, // Source: "Efficient Challenger" Triumph
      2607970476, // Source: Sundered Doctrine
      2869564842, // Source: "Vengeful Knife" Triumph
      3310034131, // Source: "Crossed Blades" Triumph
      3358334503, // Source: "Boon Ghost Mod Collector" Triumph
      3507911332, // Source: Episode: Heresy
    ],
    searchString: [],
  },
  ikora: {
    itemHashes: [],
    sourceHashes: [
      3075817319, // Source: Earn rank-up packages from Ikora Rey.
    ],
    searchString: [],
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
    searchString: [],
  },
  io: {
    itemHashes: [],
    sourceHashes: [
      315474873, // Source: Complete activities and earn rank-up packages on Io.
      1067250718, // Source: Adventure "Arecibo" on Io
      1832642406, // Source: World Quest "Dynasty" on Io.
      2392127416, // Source: Adventure "Cliffhanger" on Io
      2717017239, // Source: Complete Nightfall strike "The Pyramidion."
      3427537854, // Source: Adventure "Road Rage" on Io
    ],
    searchString: [],
  },
  ironbanner: {
    itemHashes: [
      231533811, // Iron Strength
      1162929425, // The Golden Standard
      1448664466, // Iron Bone
      1448664467, // Iron Gold
      1661191199, // Grizzled Wolf
      1987234560, // Iron Ruby
      2448092902, // Rusted Iron
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
    ],
    searchString: [],
  },
  itl: {
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
    searchString: [],
  },
  kepler: {
    itemHashes: [],
    sourceHashes: [
      4284811963, // Source: Exploring Kepler
    ],
    searchString: [],
  },
  kf: {
    itemHashes: [],
    sourceHashes: [
      160129377, // Source: "King's Fall" Raid
    ],
    searchString: [],
  },
  kingsfall: {
    itemHashes: [],
    sourceHashes: [
      160129377, // Source: "King's Fall" Raid
    ],
    searchString: [],
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
    searchString: [],
  },
  legendaryengram: {
    itemHashes: [],
    sourceHashes: [
      3334812276, // Source: Open Legendary engrams and earn faction rank-up packages.
    ],
    searchString: [],
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
    searchString: [],
  },
  limited: {
    itemHashes: [],
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
    searchString: [],
  },
  lost: {
    itemHashes: [],
    sourceHashes: [
      164083100, // Source: Display of Supremacy, Weekly Challenge
      3094114967, // Source: Season of the Lost Ritual Playlists
    ],
    searchString: [],
  },
  lostsectors: {
    itemHashes: [],
    sourceHashes: [
      2203185162, // Source: Solo Expert and Master Lost Sectors
    ],
    searchString: [],
  },
  lw: {
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
    searchString: [],
  },
  mars: {
    itemHashes: [],
    sourceHashes: [
      1036506031, // Source: Complete activities and earn rank-up packages on Mars.
      1299614150, // Source: [REDACTED] on Mars.
      1924238751, // Source: Complete Nightfall strike "Will of the Thousands."
      2310754348, // Source: World Quest "Data Recovery" on Mars.
      2926805810, // Source: Complete Nightfall strike "Strange Terrain."
      4137108180, // Source: Escalation Protocol on Mars.
    ],
    searchString: [],
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
    searchString: [],
  },
  mercury: {
    itemHashes: [],
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
    searchString: [],
  },
  moon: {
    itemHashes: [],
    sourceHashes: [
      1253026984, // Source: Among the lost Ghosts of the Moon.
      1999000205, // Source: Exploring the Moon
      3589340943, // Source: Altars of Sorrow
    ],
    searchString: [],
  },
  neomuna: {
    itemHashes: [
      4425887, // The Time-Worn Spire
      6857689, // Annual Skate
      14194600, // Edge of Intent
      17096506, // Dragon's Breath
      19024058, // Prometheus Lens
      20025671, // Tango-45 XK5094
      20935540, // Arctic Haze
      35794111, // Temptation's Hook
      40394833, // The Militia's Birthright
      42351395, // Subzero Salvo
      42435996, // Mint Retrograde
      46125926, // Dead Messenger
      46524085, // Osteo Striga
      47772649, // THE SWARM
      48361212, // Controlling Vision
      48361213, // Eleventh Hour
      48643186, // Ancient Gospel
      53159280, // Traveler's Chosen
      53159281, // Traveler's Chosen (Damaged)
      64236626, // Good Bone Structure
      65611680, // The Fool's Remedy
      66875353, // Avalanche
      72775246, // Gunburn
      79075821, // Drang (Baroque)
      93253474, // The Ringing Nail
      94729174, // Gunnora's Axe
      105567493, // Hard Truths
      108221785, // Riiswalker
      136525518, // Shining Sphere
      137879537, // Curtain Call
      153979396, // Luna's Howl
      153979397, // Better Devils
      153979399, // Not Forgotten
      159056377, // Requiem-45
      161537636, // Machina Dei 4
      161537637, // Infinite Paths 8
      174192097, // CALUS Mini-Tool
      174804902, // The Long Walk
      188882152, // Last Perdition
      190747610, // Qua Nilus II
      191996029, // Redrix's Claymore
      195440257, // Play of the Game
      204878059, // Malfeasance
      208088207, // Premonition
      210065223, // Magnum Shepherd
      211938782, // Whispering Slab
      216983039, // Horror's Least
      217140611, // The Deicide
      218335759, // Edge Transit
      219145368, // The Manticore
      227548887, // Interregnum XVI
      228424224, // Impromptu-49
      233423981, // Warden's Law
      235827225, // Eyasluna
      253196586, // Main Ingredient
      254156943, // Dead Zone Rifle
      273396910, // Frontier Justice
      276080079, // Exile's Curse (Adept)
      276918162, // Hagakure
      287042892, // Negative Space
      287042893, // Complex Solution
      287042894, // Unspoken Promise
      293505772, // The Vision
      299665907, // Outlast
      301362380, // Terran Wind
      301362381, // Through Fire and Flood
      304659313, // Ignition Code
      308332265, // Roar of the Bear
      310708513, // Survivor's Epitaph
      311852248, // Bushwhacker
      324382200, // Breakneck
      325519402, // Darkest Before
      331231237, // Finality's Auger
      334171687, // Waking Vigil
      339163900, // Nightshade
      339343290, // Nergal PR4
      339343291, // Cadenza-43
      346136302, // Retold Tale
      347366834, // Ace of Spades
      358190158, // Drang
      364665267, // The Messenger (Adept)
      367772693, // Precipial
      370712896, // Salvation's Grip
      372212741, // Weaver-C
      372697604, // Cantata-57
      374573733, // Delicate Tomb
      378498222, // Punching Out
      400096939, // Outbreak Perfected
      407150808, // Ribbontail
      407150809, // Ribbontail
      407150810, // Ribbontail
      407150811, // Ribbontail
      407621213, // Berenger's Memory
      408440598, // True Prophecy
      409551876, // The Keening
      410996590, // Jack Queen King 3
      417164956, // Jötunn
      417474224, // Hoosegow
      417474225, // Mos Epoch III
      417474226, // Blue Shift
      421573768, // The Spiteful Fang
      427899681, // Red Death Reformed
      432476743, // The Palindrome
      432716552, // Shining Sphere
      435216110, // Duty Bound
      468276817, // Nature of the Beast
      471518543, // Corrective Measure
      471764396, // Pre Astyanax IV
      472169727, // Garden Progeny 1
      472847207, // Guiding Star
      507038823, // The Last Breath
      515224227, // First In, Last Out
      516243773, // Beidenhander
      525750263, // Black Scorpion-4sr
      528834068, // BrayTech Werewolf
      531591352, // Forte-15
      531591353, // Daystar SMG2
      532746994, // Astral Horizon (Adept)
      534775659, // PLUG ONE.1 (Adept)
      541053086, // Telemachus-C
      541188001, // Farewell
      542203595, // Edge of Concurrence
      548958835, // Retraced Path
      566976652, // Resonance-42
      566976653, // Antiope-D
      566976654, // Phosphorus MG4
      568515759, // Chattering Bone
      569799273, // Throne-Cleaver
      569799274, // Death's Razor
      569799275, // Goldtusk
      575830664, // D.F.A.
      577528837, // Contingency Plan
      578459533, // Wendigo GL3
      580961571, // Loaded Question
      582335600, // Dire Promise
      591672323, // Fortunate Star
      599895591, // Sojourner's Tale
      601592879, // Age-Old Bond
      602618796, // Scathelocke
      603242241, // Hammerhead
      603721696, // Cryosthesia 77K
      607191995, // Hollow Words
      614426548, // Falling Guillotine
      617501162, // Gallu RR3
      618554398, // Proelium FR3
      622058944, // Jorum's Claw
      625672050, // Jian 7 Rifle
      631439337, // Found Verdict (Timelost)
      636912560, // Dust Rock Blues
      640114618, // Tigerspite
      648595258, // Graviton Spike
      653875712, // Ballyhoo Mk.27
      653875713, // Lamia HC2
      653875714, // Azimuth DSu
      653875715, // Allegro-34
      654370424, // Nation of Beasts
      654608616, // Revoker
      679281855, // Exile's Curse
      681067419, // Hung Jury SR4 (Adept)
      686951703, // The Supremacy
      688593230, // Lance Ephemeral
      689453941, // The Frigid Jackal
      690668916, // Vision of Confluence (Timelost)
      701922966, // Finite Impactor
      702001725, // Auric Disabler
      705774642, // Restoration VIII
      711899772, // Vinegaroon-2si
      711899773, // Roderic-C
      711899774, // Requiem SI2
      711899775, // Dissonance-34
      715338174, // Just in Case
      717150101, // BrayTech RWP Mk. II
      720351794, // No Turning Back
      720351795, // Arsenic Bite-4b
      725408022, // Ascendancy
      731147177, // Hawthorne's Field-Forged Shotgun
      731147178, // Good Bone Structure
      731147179, // Baligant
      736901634, // Doomsday
      738446555, // Unfall
      755130877, // Last Man Standing
      766323545, // Seventh Seraph VY-7
      772531208, // Etude-12
      776191470, // Tommy's Matchbook
      792755504, // Nightshade
      805677041, // Buzzard
      806021398, // Peace by Consensus
      807192446, // The Day's Fury
      814876684, // Wish-Ender
      814876685, // Trinity Ghoul
      819358961, // Spoiler Alert
      819441402, // Misfit
      821154603, // Gnawing Hunger
      829330711, // Peacebond
      834081972, // Service Revolver
      838556752, // Python
      847329160, // Edgewise
      847450546, // IKELOS_SR_v1.0.1
      852228780, // Uzume RR4 (Adept)
      852551895, // Occluded Finality
      875848769, // Borrowed Time
      882778888, // Rose
      893527433, // Far Future
      896923850, // Acantha-D
      905092001, // Anniella
      912150785, // Mindbender's Ambition (Adept)
      925326392, // Tango-45
      925326393, // Manannan SR4
      925326394, // Black Scorpion-4sr
      930590127, // The Wizened Rebuke
      933455006, // Burden of Guilt
      940371471, // Wicked Implement
      946443267, // Line in the Sand
      958384347, // Tomorrow's Answer
      962412079, // Last Perdition
      970034755, // Giver's Blessing
      976459525, // Burden of Guilt
      981718087, // Deafening Whisper
      982229638, // Allied Demand
      990416096, // Silicon Neuroma
      991314988, // Bad Omens
      1006783454, // Timelines' Vertex
      1016668089, // One Small Step
      1018072983, // It Stared Back
      1018777295, // Motion to Vacate
      1028582252, // The Comedian
      1030895163, // Glacioclasm
      1034055198, // Necrochasm
      1046651176, // Bottom Dollar
      1047932517, // Slayer's Fang
      1048266744, // Better Devils
      1071542914, // Horror's Least
      1076810832, // Forge's Pledge
      1079872540, // Ulterior Observation
      1084788061, // Swift Solstice
      1090936013, // The When and Where
      1094005544, // Mindbender's Ambition
      1096206669, // IKELOS_SG_v1.0.2
      1097616550, // Extraordinary Rendition
      1099433612, // The Doubt
      1107446438, // Servant Leader
      1111334348, // Ice Breaker
      1115104187, // Sole Survivor
      1119734784, // Chroma Rush
      1120843238, // Plemusa-B
      1120843239, // Stampede Mk.32
      1128225405, // Midnight Coup
      1135050595, // Duty Bound (Adept)
      1137768695, // Foregone Conclusion
      1159252500, // Vacuna SR4
      1161276682, // Redrix's Broadsword
      1162247618, // Jian 7 Rifle
      1167153950, // Adhortative
      1173780905, // The Messenger (Adept)
      1175295126, // Hushed Whisper
      1177293325, // Tongeren-LR3
      1177293326, // Damietta-LR2
      1177293327, // Aachen-LR2
      1178397318, // Agrona PR4
      1178397319, // Battle Scar
      1178886909, // Thin Line
      1179141605, // Felwinter's Lie
      1180270692, // Quickfang
      1180270693, // Eternity's Edge
      1180270694, // Crown-Splitter
      1187594590, // Relentless
      1189790632, // The Steady Hand
      1193318082, // Shoreline Dissident
      1195725817, // Sondok-C
      1195725818, // Whip Scorpion-3mg
      1195725819, // Sorrow MG2
      1197073834, // Forced Memorializer
      1197486957, // High Albedo
      1200414607, // The Showrunner
      1200824700, // IKELOS_HC_v1.0.2
      1201830623, // Truth
      1202007252, // Whirling Ovation
      1216130969, // Cold Denial
      1216319404, // Fatebringer (Timelost)
      1234150730, // Trespasser
      1251729046, // Steelfeather Repeater
      1253087083, // IKELOS_SR_v1.0.2
      1270948323, // Nasreddin
      1271343896, // Widow's Bite
      1277015089, // Gravity Slingshot
      1280933460, // Claws of the Wolf
      1281822856, // Protostar CSu
      1281822857, // Philippis-B
      1281822858, // Furina-2mg
      1281822859, // Harmony-21
      1286686760, // Gahlran's Right Hand
      1289000550, // PLUG ONE.1
      1289324202, // Pyroclastic Flow
      1289997971, // Breachlight
      1291586825, // Eystein-D
      1310413524, // Recital-17
      1310413525, // Victoire SI2
      1313528549, // Sola's Scar
      1325579289, // Retrofuturist
      1327264046, // Badlander
      1327432221, // Perseverance
      1331482397, // MIDA Multi-Tool
      1337707096, // Chrysura Melo
      1339362514, // Stochastic Variable
      1342668638, // Pleiades Corrector
      1345867570, // Sweet Business
      1345867571, // Coldheart
      1350102270, // Niflheim Frost
      1351035691, // Daedalus Code
      1357080535, // Breath of the Dragon
      1363238943, // Ruinous Effigy
      1363886209, // Gjallarhorn
      1364093401, // The Last Word
      1366917989, // Tomorrow's Answer (Adept)
      1369487074, // Orimund's Anvil
      1386601612, // Swift Ride XE8375
      1387987271, // Silicon Neuroma (Adept)
      1392429335, // Broadsword Launcher
      1392919471, // Trustee
      1393021133, // Equinox Tsu
      1393021134, // Nox Reve II
      1393021135, // Nox Calyx II
      1395261499, // Xenophage
      1399243961, // Reed's Regret
      1402766122, // Retrofuturist
      1406475890, // Agamid
      1411084669, // Zenobia-D
      1411560894, // Ahab Char
      1435808083, // Antedate
      1441805468, // The Navigator
      1443049976, // Interference VI
      1447973650, // Rest for the Wicked
      1447973651, // Future Imperfect
      1449922174, // Tatara Gaze
      1457394908, // Fussed Dark Mk.21
      1457394910, // Botheration Mk.28
      1457394911, // Badlands Mk.24
      1457979868, // Duty Bound
      1459443448, // Escape Velocity
      1476654960, // Judgment
      1481594633, // Barrow-Dyad
      1481892490, // The Palindrome (Adept)
      1489452902, // Courageous Surrender
      1490571337, // Future Safe 10
      1496419775, // Bane of Sorrow
      1502662697, // King Cobra-4fr
      1503609584, // The Last Breath
      1506719573, // Cold Front
      1508896098, // The Wardcliff Coil
      1513927136, // Swift Ride
      1513927137, // Disrespectful Stare
      1513927138, // Lincoln Green
      1513927139, // Agenda 5
      1513993763, // Friction Fire
      1518042134, // Halfdan-D
      1518042135, // Valakadyn
      1523647826, // Eternal Slumber
      1524387902, // Seraphine Haze
      1529450902, // Mos Epoch III
      1531295694, // Adverse Possession IX
      1532276803, // Allied Demand
      1533499360, // Athelflad-D
      1533499361, // Etana SI4
      1533499362, // Urchin-3si
      1541131350, // Cerberus+1
      1552443158, // Forgiveness
      1553681400, // Opaque Hourglass
      1561006927, // Seventh Seraph Carbine
      1584643826, // Hush
      1587439031, // Three Graves
      1587779165, // Radiant Stardust
      1594120904, // No Time to Explain
      1595336070, // Guseva-C
      1595336071, // Presto-48
      1600633250, // 21% Delirium
      1619016919, // Khvostov 7G-02
      1621558458, // Gridskipper
      1621657423, // Biting Winds
      1622998472, // Vulpecula
      1626503676, // A Swift Verdict
      1641430382, // The Guiding Sight
      1642384931, // Fixed Odds
      1644160541, // Abide the Return
      1644162710, // Origin Story
      1644680957, // Null Composure
      1645386487, // Tranquility
      1648316470, // Timecard
      1650442173, // Loquitor IV
      1650626964, // Armillary PSu
      1650626965, // Black Tiger-2sr
      1650626966, // Trax Lysis II
      1650626967, // Madrugada SR2
      1663482635, // Faustus Decline
      1664372054, // Threat Level
      1665952087, // The Fourth Horseman
      1669771780, // Encore-25
      1669771781, // Agrona PR2
      1669771782, // Psi Cirrus II
      1669771783, // Bayesian MSu
      1674692344, // Sublimation
      1674742470, // Autumn Wind
      1678957656, // Bayesian MSu
      1678957657, // Psi Cirrus II
      1678957658, // Agrona PR2
      1678957659, // Encore-25
      1679868061, // Wastelander M5
      1681583613, // Ergo Sum
      1684914716, // Fate Cries Foul
      1690783811, // The Forward Path
      1697682876, // Astral Horizon
      1699493316, // The Last Dance
      1706206669, // Gallant Charge
      1706536806, // The Old Fashioned
      1720373217, // The Permanent Truth
      1723380073, // Enigma's Draw
      1723472487, // IKELOS_SMG_v1.0.1
      1724104236, // Submersion
      1736135946, // New Malpais
      1744115122, // Legend of Acrius
      1752585070, // BrayTech Winter Wolf
      1753923263, // Wolfsbane
      1757129747, // Acantha-D XK8434
      1760543913, // Legal Action II
      1763584999, // Grand Overture
      1766088024, // Thermal Erosion
      1773600468, // Critical Sass
      1775804198, // Galliard-42 XN7568
      1786797708, // Escape Velocity
      1789347249, // Hazard of the Cast
      1796949035, // Razor's Edge
      1798874854, // 18 Kelvins
      1802135586, // Touch of Malice
      1807343361, // Hawthorne's Field-Forged Shotgun
      1813474267, // Arcane Embrace
      1813667283, // Dead-Ender
      1821724780, // Seventh Seraph CQC-12
      1823308496, // Synanceia
      1825472717, // The End
      1833195496, // Ager's Scepter
      1835747805, // Nature of the Beast
      1839565992, // Ether Doctor
      1842303080, // Hollow Earth
      1843044398, // Translation Theory
      1843044399, // Smuggler's Word
      1852863732, // Wavesplitter
      1853180924, // Traveler's Chosen
      1864563948, // Worldline Zero
      1865351684, // The Hero's Burden
      1866778462, // The Hothead (Adept)
      1870979911, // Orewing's Maul
      1873270090, // Elegy-49
      1877183764, // Reginar-B
      1877183765, // Cup-Bearer SA/2
      1879212552, // A Sudden Death
      1885753220, // Seven-Six-Five
      1885753222, // Call to Serve
      1885753223, // Tone Patrol
      1887808042, // IKELOS_SG_v1.0.1
      1891561814, // Whisper of the Worm
      1907698332, // The Summoner
      1909527966, // Prosecutor
      1911843788, // The Rattler
      1911843789, // Minimum Distance
      1911843790, // Dead Man Walking
      1911843791, // Last Hope
      1912669214, // Centrifuse
      1917334929, // Finite Impactor
      1921159786, // Hezen Vengeance (Timelost)
      1924276978, // Horror's Least (Adept)
      1927800278, // Eternal Blazon
      1929278169, // BrayTech Osprey
      1931556011, // No Feelings
      1940885628, // Archimedes Truth
      1942069133, // Dark Decider
      1946491241, // Truthteller
      1952163498, // Pluperfect
      1956186483, // Pure Recollection
      1960218487, // Nameless Midnight
      1967303408, // Archon's Thunder
      1972985595, // Swarm of the Raven
      1977926913, // Stubborn Oak
      1982711279, // Talons of the Eagle
      1983149589, // Whisper of the Worm
      1983332560, // Flash and Thunder
      1983332561, // Orthrus
      1983332562, // Berenger's Memory
      1987769101, // Praedyth's Revenge (Timelost)
      1988218406, // Unification VII
      1995011456, // Badlands Mk.24
      1995011457, // Botheration Mk.28
      1995011459, // Fussed Dark Mk.21
      2002522739, // Burden of Guilt (Adept)
      2006308129, // D.F.A. (Adept)
      2009106091, // The Vow
      2009277538, // The Last Dance
      2014642399, // The Forward Path
      2034817450, // Distant Relation
      2035738085, // Deadlock
      2037589099, // Butler RS/2
      2044500762, // The Queenbreaker
      2050789284, // Stars in Shadow
      2060863616, // Salvager's Salvo
      2065081837, // Uzume RR4
      2066434718, // Canis Major
      2069224589, // One Thousand Voices
      2071412133, // A Cold Sweat
      2073794990, // Mercurial Overreach
      2084611899, // Last of the Legion
      2084878005, // Heir Apparent
      2091737595, // Traveler's Judgment 5
      2094938673, // Adjudicator
      2105827099, // Bad Reputation
      2108920981, // Orewing's Maul
      2111625436, // Aurora Dawn
      2112909414, // Duke Mk. 44
      2112909415, // Ten Paces
      2121785039, // Brass Attacks
      2130065553, // Arbalest
      2138599001, // Optative
      2139640995, // Hero of Ages
      2145476620, // Bad News
      2145476622, // Shattered Peace
      2145476623, // Annual Skate
      2147010335, // Shadow Price (Adept)
      2149166938, // Classical-42
      2149166939, // Countess SA/2
      2154059444, // The Long Goodbye
      2155534128, // Haliaetus
      2164448701, // Apostate
      2168486467, // Wicked Sister
      2171006181, // Service Revolver
      2171478765, // Fatebringer
      2179048386, // Forerunner
      2186258845, // Bellowing Giant
      2188764214, // Dead Man's Tale
      2199171672, // Lonesome
      2208405142, // Telesto
      2209003210, // Zealot's Reward
      2209451511, // Pariah
      2213848860, // Psi Termina II
      2213848861, // Cadenza-11
      2213848862, // Standing Tall
      2213848863, // Psi Ferox II
      2217366863, // Parcel of Stardust
      2220884262, // The Steady Hand
      2222560548, // IKELOS_SMG_v1.0.2
      2232171099, // Deathbringer
      2233545123, // Fugue-55
      2248667690, // Perfect Paradox
      2257180473, // Interference VI
      2261046232, // Jurassic Green
      2272470786, // Stochastic Variable
      2276266837, // Honor's Edge
      2278995296, // Does Not Compute
      2286143274, // The Huckleberry
      2290863050, // Persuader
      2295941920, // Belfry Bounty
      2295941921, // Maestro-46
      2313726158, // Belisarius-D
      2314999489, // Imperative
      2326716489, // Gunnora's Axe
      2338088853, // Calusea Noblesse
      2342054803, // Ogma PR6
      2345794502, // Forgiveness
      2350354266, // Alethonym
      2351180975, // Igneous Hammer
      2351747816, // Cuboid ARu
      2351747817, // Refrain-23
      2351747818, // Sand Wasp-3au
      2351747819, // Ros Lysis II
      2357297366, // Witherhoard
      2362471600, // Drang
      2362471601, // Rat King
      2376481550, // Anarchy
      2378101424, // The Militia's Birthright (Adept)
      2386979999, // The Scholar (Adept)
      2398848320, // Erentil FR4
      2399110176, // Eyes of Tomorrow
      2405619467, // Forgiveness (Adept)
      2408405461, // Sacred Provenance
      2414141462, // The Vision
      2414612776, // New City
      2414612777, // Atalanta-D
      2415517654, // Bastion
      2422664927, // Atalanta-D XG1992
      2423071981, // Lionfish-4fr
      2429822976, // Rose
      2429822977, // Austringer
      2433826056, // The Quickstep
      2434225986, // Shattered Cipher
      2443900757, // The Comedian (Adept)
      2448907086, // Royal Entry
      2453357042, // Blast Battue
      2475355656, // Reed's Regret (Adept)
      2478247171, // Quitclaim Shotgun III
      2478792241, // The Scholar
      2481758391, // Darkest Before
      2481881293, // Cartesian Coordinate
      2492081469, // The Number
      2496242052, // Code Duello
      2496875173, // Sorrow's Verse
      2502422772, // Cartesian Coordinate
      2502422773, // Shock and Awe
      2502422774, // Nox Echo III
      2502422775, // Tarantula
      2505533224, // Ghost Primus
      2516360525, // Purpose
      2517599010, // Death Adder
      2527666306, // Igneous Hammer (Adept)
      2535142413, // Edge of Action
      2535939781, // The Mornin' Comes
      2544285846, // Scipio-D
      2545083870, // Apex Predator
      2553946496, // Headstrong
      2553946497, // Helios HC1
      2561659919, // Antiope-D
      2563012876, // Matador 64
      2575506895, // Kindled Orchid
      2579693381, // Cusp Sempiternal
      2581162758, // Enigma's Draw
      2581676735, // New Land Beyond
      2582755344, // Seventh Seraph SAW
      2588048270, // Spoiler Alert
      2591111628, // Compass Rose
      2591586260, // Allegro-34
      2591586261, // Azimuth DSu
      2591586262, // Lamia HC2
      2591586263, // Ballyhoo Mk.27
      2591746970, // Leviathan's Breath
      2603483885, // Cloudstrike
      2605790032, // Troubadour
      2605790033, // Luna Nullis II
      2605790034, // Trondheim-LR2
      2611861926, // Imminent Storm
      2621637518, // Play of the Game
      2625782212, // Haunted Earth
      2625782213, // Contingency Plan
      2631466936, // Fortunate Star
      2633186522, // Shadow Price
      2638190703, // Aisha's Embrace
      2653316158, // Pillager
      2660862359, // Gentleman Vagabond
      2663204025, // Subjunctive
      2681395357, // Trackless Waste
      2683682446, // Traitor's Fate
      2683682447, // Traitor's Fate
      2693941407, // Older Sister III
      2694044460, // Home Again
      2694044461, // Cydonia-AR1
      2694044462, // SUROS Throwback
      2694044463, // Jiangshi AR1
      2694576561, // Two-Tailed Fox
      2697058914, // Komodo-4FR
      2699423382, // MIDA Macro-Tool
      2700862856, // Foggy Notion
      2700862858, // Out of Options
      2700862859, // Red Mamba
      2703340117, // Somerled-D
      2707464805, // Zenith of Your Kind
      2708806099, // BxR-55 Battler
      2712244741, // Bygones
      2714022207, // Corsair's Wrath
      2721249463, // Tyranny of Heaven
      2723241847, // Patron of Lost Causes
      2723909519, // Arc Logic
      2725426834, // Intercalary
      2725894221, // Folded Root
      2734369894, // Stay Away
      2738174948, // Distant Tumulus
      2742490609, // Death Adder
      2742838700, // True Prophecy
      2742838701, // Dire Promise
      2744715540, // Bug-Out Bag
      2753269585, // Tempered Dynamo
      2765451288, // Synanceia
      2765451289, // Synanceia
      2765451290, // Synanceia
      2765451291, // Synanceia
      2776503072, // Royal Chase
      2782325300, // Quickfang
      2782325301, // Eternity's Edge
      2782325302, // Crown-Splitter
      2782847179, // Blasphemer
      2792181427, // Tiebreaker
      2807687156, // Distant Tumulus
      2812324400, // Parasite
      2812324401, // Dead Messenger
      2812672356, // Vertical Orbit QSm
      2812672357, // Eulogy SI4
      2816212794, // Bad Juju
      2817798849, // Hoosegow XE5837
      2817949113, // The Defiant
      2824241403, // Bad News XF4354
      2838279629, // Mercury-A
      2842493170, // Sonata-48
      2842493171, // Trax Dynia
      2850415209, // Judgment
      2855157553, // A Sudden Death
      2856514843, // Syncopation-53
      2856683562, // SUROS Regime
      2857348871, // Honor's Edge
      2857870254, // Everburning Glitz
      2860172148, // Refrain-23
      2860172149, // Cuboid ARu
      2860172150, // Ros Lysis II
      2860172151, // Sand Wasp-3au
      2870169846, // Hailing Confusion
      2888021252, // Trachinus
      2888021253, // Trachinus
      2888021254, // Trachinus
      2888021255, // Trachinus
      2891672170, // Xenoclast IV
      2891976012, // Future Imperfect
      2891976013, // Rest for the Wicked
      2903592984, // Lionheart
      2903592986, // Rebuke AX-GL
      2903592987, // Yellowjacket-3au
      2905188646, // Still Hunt
      2907129556, // Sturm
      2907129557, // Sunshot
      2909905776, // The Hero's Burden
      2910326942, // Wish-Keeper
      2919334548, // Imperial Decree
      2928437919, // Basilisk
      2931957300, // Dream Breaker
      2936850733, // Harsh Language
      2936850734, // Gareth-C
      2936850735, // Penumbra GSm
      2957367743, // Toil and Trouble
      2957542878, // Living Memory
      2961807684, // The Wizened Rebuke
      2965080304, // Yeartide Apex
      2973900274, // Third Iteration
      2979965244, // Romantic Death
      2979965245, // Romantic Death
      2979965246, // Romantic Death
      2979965247, // Romantic Death
      2990047042, // Succession
      3005104939, // Frostmire's Hex
      3005879472, // Conjecture TSc
      3005879473, // Crooked Fang-4fr
      3027844940, // Proelium FR3
      3027844941, // Erentil FR4
      3037520408, // Seventh Seraph Officer Revolver
      3040742682, // Nameless Midnight
      3044460004, // Iota Draconis
      3055192515, // Timelines' Vertex
      3067821200, // Heretic
      3075224551, // Threaded Needle
      3089417788, // MIDA Mini-Tool
      3089417789, // Riskrunner
      3100452337, // Dreaded Venture
      3110698812, // Tarrabah
      3116356268, // Spare Rations
      3117873459, // Exitus Mk.I
      3118061005, // Vexcalibur
      3141979346, // D.A.R.C.I.
      3141979347, // Borealis
      3143732432, // False Promises
      3164743584, // Eye of Sol
      3165547384, // Memory Interdict
      3169616514, // Bite of the Fox
      3177074192, // The Ever-Present
      3184457500, // Folded Root
      3184457501, // Folded Root
      3184457502, // Folded Root
      3184457503, // Folded Root
      3184681056, // Fractethyst
      3185293912, // Mos Ultima II
      3185293913, // One Earth
      3185293914, // Minuet-12
      3185293915, // Picayune Mk. 33
      3186018373, // Vision of Confluence
      3188460622, // Null Calamity 9
      3190698551, // Wishbringer
      3197270240, // Found Verdict
      3199662972, // Eystein-D
      3211806999, // Izanagi's Burden
      3216383791, // Home for the Lost
      3218364298, // Redrix's Estoc
      3222518097, // Anonymous Autumn
      3233390913, // Infinite Paths 8
      3239754990, // Maxim XI
      3241217409, // Finite Maybe
      3242168339, // Vouchsafe
      3245493570, // Aisha's Embrace (Adept)
      3246523828, // Hadrian-A
      3246523829, // Resilient People
      3246523831, // Para Torus I
      3252697558, // Truthteller
      3257091166, // Half-Truths
      3257091167, // The Other Half
      3258665412, // Trinary System
      3260753130, // Ticuu's Divination
      3272713429, // Eye of Foresight
      3281285075, // Posterity
      3284383335, // Euphony
      3285365666, // Jack Queen King 3
      3285365667, // West of Sunfall 7
      3293207827, // Yeartide Apex
      3297863558, // Twilight Oath
      3312073052, // A Single Clap
      3312073053, // Shepherd's Watch
      3312073054, // Show of Force
      3312073055, // Widow's Bite
      3319810952, // Husk of the Pit
      3325463374, // Thunderlord
      3325744914, // Inaugural Address
      3325778512, // A Fine Memorial
      3326850591, // The Long Walk
      3328019216, // Arcane Embrace
      3329842376, // Memory Interdict
      3334276332, // Vestian Dynasty
      3334276333, // Death by Scorn
      3335343363, // Tarantula
      3336215727, // Martyr's Make
      3354242550, // The Recluse
      3355385170, // Silicon Neuroma
      3356526253, // Wishbringer
      3361694400, // Trax Arda II
      3361694401, // Fare-Thee-Well
      3361694402, // Sea Scorpion-1sr
      3361694403, // Inverness-SR2
      3366545721, // Bequest
      3369545945, // Temporal Clause
      3371017761, // Conditional Finality
      3376406418, // Right Side of Wrong
      3380742308, // Alone as a god
      3383958216, // Harmony-21
      3383958217, // Furina-2mg
      3383958218, // Philippis-B
      3383958219, // Protostar CSu
      3385326721, // Reckless Oracle
      3393130645, // Positive Outlook
      3393519051, // Perfect Paradox
      3400256755, // Zephyr
      3409645497, // Legal Action II
      3410721600, // Subtle Calamity
      3413074534, // Polaris Lance
      3413860062, // The Chaperone
      3413860063, // Lord of Wolves
      3419149443, // Crooked Fang-4fr
      3424403076, // The Fool's Remedy
      3425561386, // Motion to Compel
      3431536253, // Gunburn
      3434507093, // Occluded Finality
      3434629515, // Metronome-52
      3434944005, // Point of the Stag
      3435238842, // Song of Justice VI
      3435238843, // Good Counsel IX
      3437746471, // Crimson
      3441197112, // Nox Cordis II
      3441197113, // Nox Lumen II
      3441197115, // Parsec TSu
      3445437901, // Main Ingredient
      3454326177, // Omniscient Eye
      3460122497, // Imperial Needle
      3460576091, // Duality
      3461377698, // Baligant XU7743
      3472875143, // Wolftone Draw
      3473290087, // Frozen Orbit
      3487253372, // The Lament
      3489054606, // Unwavering Duty
      3493948734, // Stampede Mk.32
      3493948735, // Plemusa-B
      3496887154, // Phoneutria Fera
      3501969491, // The Cut and Run
      3504336176, // Night Watch
      3505113722, // Collective Obligation
      3512014804, // Lumina
      3512349612, // Coriolis Force
      3514096004, // Eternal Blazon
      3514144928, // The Summoner (Adept)
      3524313097, // Eriana's Vow
      3524386983, // Submersion
      3529780349, // The Marine
      3535742959, // Randy's Throwing Knife
      3549153978, // Fighting Lion
      3549153979, // The Prospector
      3550697748, // Thistle and Yew
      3551104348, // Double-Edged Answer
      3556971406, // Requiem-43
      3556999246, // Pleiades Corrector
      3561203890, // Tessellation
      3565520715, // Crowd Pleaser
      3568377122, // Typhon GL5
      3569802112, // The Old Fashioned
      3569842567, // Lost and Found
      3574168117, // Hushed Whisper
      3576134513, // Ribbontail
      3580904580, // Legend of Acrius
      3580904581, // Tractor Cannon
      3582424018, // Deadpan Delivery
      3588934839, // Le Monarque
      3593598010, // The Time-Worn Spire
      3602242905, // Stars in Shadow
      3616586446, // First In, Last Out
      3622137132, // Last Hope
      3627718344, // Triumph DX-PR
      3627718345, // Nanty Narker
      3628991658, // Graviton Lance
      3628991659, // Vigilance Wing
      3629968765, // Negative Space
      3635232671, // Trachinus
      3637570176, // Eye of Sol (Adept)
      3649055823, // Crimil's Dagger
      3651075426, // Holless-IV
      3653573172, // Praedyth's Revenge
      3654674561, // Dead Man's Tale
      3658188704, // The Messenger
      3659414143, // Verglas Curve
      3662200188, // Nox Lumen II
      3662200189, // Nox Cordis II
      3662200190, // Parsec TSu
      3664831848, // Heartshadow
      3666954561, // Copperhead-4sn
      3666954562, // Veleda-D
      3666954563, // Elegy-49
      3669616453, // Hoosegow
      3682803680, // Shayura's Wrath
      3690523502, // Love and Death
      3691881271, // Sins of the Past
      3698448090, // Choir of One
      3704653637, // Stryker's Sure-Hand
      3709368142, // Aisha's Embrace
      3717177717, // Multimach CCX
      3725585710, // Lodestar
      3738678140, // Dead Weight
      3740842661, // Sleepless
      3743729616, // Shepherd's Watch
      3745974521, // The Militia's Birthright
      3745990145, // Long Shadow
      3748713778, // Pentatonic-48
      3748713779, // Morrigan-D
      3751622019, // Dead Man Walking XX7463
      3754408118, // The Riposte
      3761898871, // Lorentz Driver
      3762467076, // Uriel's Gift
      3762467077, // Solemn Hymn
      3762467078, // Scathelocke
      3762467079, // Valakadyn
      3766045777, // Black Talon
      3776129137, // Zenobia-D
      3778520449, // Jiangshi AR4
      3778520450, // Halfdan-D
      3778520451, // Galliard-42
      3792720684, // Spiderbite-1si
      3796510434, // Corrective Measure (Timelost)
      3796795102, // The Messenger
      3799980700, // Transfiguration
      3804242792, // Phoneutria Fera
      3804242793, // Phoneutria Fera
      3804242794, // Phoneutria Fera
      3804242795, // Phoneutria Fera
      3809805228, // Dissonance-34
      3809805229, // Requiem SI2
      3809805230, // Roderic-C
      3809805231, // Vinegaroon-2si
      3813153080, // Finite Impactor
      3813721211, // Last Thursday
      3821409356, // Ex Diris
      3824106094, // Devil's Ruin
      3824673936, // Outbreak Perfected
      3826803617, // The Dream
      3829285960, // Horror Story
      3836861464, // THE SWARM (Adept)
      3843477312, // Blast Furnace
      3844694310, // The Jade Rabbit
      3847137620, // Sola's Scar (Adept)
      3849810018, // Pardon Our Dust
      3850168899, // Martyr's Retribution
      3854037061, // A Swift Verdict
      3854359821, // The Number
      3856705927, // Hawkmoon
      3860697508, // Minuet-42
      3860697509, // Pribina-D
      3860697510, // Imset HC4
      3861448240, // Emperor's Courtesy
      3863882743, // Uriel's Gift
      3866356643, // IKELOS_HC_v1.0.1
      3868973291, // Starscape Null
      3870811754, // Night Terror
      3886263130, // I Am Alive
      3886719505, // Buried Bloodline
      3889907763, // Royal Dispensation II
      3890960908, // The Guiding Sight
      3899270607, // The Colony
      3906357376, // Madrugada SR2
      3906357377, // Trax Lysis II
      3906357378, // Black Tiger-2sr
      3906357379, // Armillary PSu
      3906942101, // Conspirator
      3907337522, // Oxygen SR3
      3909683950, // Man o' War
      3920811074, // Medley-45
      3924212056, // Loud Lullaby
      3926153598, // Boomslang-4fr
      3929685100, // The Deicide
      3937866388, // Seventh Seraph SI-2
      3946054154, // MIDA Mini-Tool
      3950088638, // Motion to Suppress
      3954531357, // Mob Justice
      3957603605, // Wrong Side of Right
      3967155859, // The Last Dance
      3973202132, // Thorn
      3977654524, // Festival Flight
      3981920134, // Aureus Neutralizer
      3991544422, // Sol Pariah 6
      3991544423, // The Conqueror 2
      3993415705, // The Mountaintop
      4014434381, // Kibou AR3
      4017959782, // Symmetry
      4019651319, // Festival Flight
      4019668921, // Staccato-46
      4020742303, // Prophet of Doom
      4023807721, // Shayura's Wrath (Adept)
      4024037919, // Origin Story
      4036115577, // Sleeper Simulant
      4037745684, // Bonechiller
      4041111172, // The Button
      4049127142, // Returned Memory
      4050645223, // Hezen Vengeance
      4068264807, // Monte Carlo
      4077196130, // Trust
      4083045006, // Persuader
      4090134063, // Jurisprudent
      4094657108, // Techeun Force
      4095462486, // Pit Launcher
      4095896073, // Accrued Redemption
      4103414242, // Divinity
      4105447486, // Nox Veneris II
      4105447487, // Elatha FR4
      4106983932, // Elatha FR4
      4114929480, // Snorri FR5
      4116518582, // Solemn Remembrance
      4117693024, // Mindbender's Ambition
      4124357815, // The Epicurean
      4124362340, // Agape
      4124984448, // Hard Light
      4129629253, // Khvostov 7G-0X
      4138174248, // Go Figure
      4138415948, // Hand in Hand
      4138415949, // Ded Acumen II
      4138415950, // Ded Nemoris II
      4145119417, // Heart of Time
      4146673634, // Outrageous Fortune
      4146673635, // Theodolite
      4146702548, // Outrageous Fortune
      4148143418, // Show of Force XF4865
      4149758318, // Traveler's Judgment 5
      4156253727, // The Third Axiom
      4157959956, // Tongeren-LR3
      4157959958, // Aachen-LR2
      4157959959, // Damietta-LR2
      4164201232, // 1000 Yard Stare
      4166221755, // Trophy Hunter
      4169082039, // Romantic Death
      4174431791, // Hierarchy of Needs
      4174481098, // Steel Sybil Z-14
      4184808992, // Adored
      4190156464, // Merciless
      4190932264, // Beloved
      4193877020, // Does Not Compute
      4203034886, // Zephyr
      4207066264, // Microcosm
      4211534763, // Pribina-D
      4213221671, // Sunrise GL4
      4221925398, // Cup-Bearer SA/2
      4221925399, // Reginar-B
      4227181568, // Exit Strategy
      4230965989, // Commemoration
      4230993599, // Steel Sybil Z-14
      4238497225, // D.F.A.
      4248569242, // Heritage
      4255171531, // The Hothead
      4255268456, // Skyburner's Oath
      4255586669, // Empty Vessel
      4265183314, // Multimach CCX
      4272442416, // The Domino
      4277547616, // Every Waking Moment
      4281371574, // Hung Jury SR4
      4288031461, // The Emperor's Envy
      4289226715, // Vex Mythoclast
      4292849692, // Crimil's Dagger
      4293613902, // Quicksilver Storm
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
    searchString: [],
  },
  nessus: {
    itemHashes: [],
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
    searchString: [],
  },
  nightfall: {
    itemHashes: [
      42874240, // Uzume RR4
      192784503, // Pre Astyanax IV
      213264394, // Buzzard
      233635202, // Cruel Mercy
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
      2298039571, // Rake Angle
      2322926844, // Shadow Price
      2347178967, // Cruel Mercy (Adept)
      2450917538, // Uzume RR4
      2591257541, // Scintillation
      2697143634, // Lotus-Eater (Adept)
      2759590322, // THE SWARM
      2876244791, // The Palindrome
      2883684343, // Hung Jury SR4 (Adept)
      2889501828, // The Slammer
      2914913838, // Loaded Question (Adept)
      2932922810, // Pre Astyanax IV
      3106557243, // PLUG ONE.1 (Adept)
      3125454907, // Loaded Question
      3183283212, // Wendigo GL3
      3250744600, // Warden's Law (Adept)
      3293524502, // PLUG ONE.1
      3610521673, // Uzume RR4 (Adept)
      3667553455, // BrayTech Osprey
      3686538757, // Undercurrent
      3832743906, // Hung Jury SR4
      3915197957, // Wendigo GL3 (Adept)
      3922217119, // Lotus-Eater
      3997086838, // Rake Angle (Adept)
      4074251943, // Hung Jury SR4 (Adept)
      4077588826, // The Palindrome (Adept)
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
    searchString: [],
  },
  nightmare: {
    itemHashes: [],
    sourceHashes: [
      550270332, // Source: Complete all Nightmare Hunt time trials on Master difficulty.
      2778435282, // Source: Nightmare Hunts
    ],
    searchString: [],
  },
  nm: {
    itemHashes: [],
    sourceHashes: [
      1464399708, // Source: Earn rank-up packages from Executor Hideo.
    ],
    searchString: [],
  },
  paleheart: {
    itemHashes: [],
    sourceHashes: [
      941123623, // Pale Heart - Cayde's Stash
      2327253880, // Source: Exploring the Pale Heart
      3614199681, // Source: Pale Heart Triumph
    ],
    searchString: [],
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
    searchString: [],
  },
  pinnacleops: {
    itemHashes: [],
    sourceHashes: [
      1232061833, // Source: Pinnacle Ops
    ],
    searchString: [],
  },
  pit: {
    itemHashes: [],
    sourceHashes: [
      1745960977, // Source: "Pit of Heresy" Dungeon
    ],
    searchString: [],
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
    searchString: [],
  },
  presage: {
    itemHashes: [],
    sourceHashes: [
      210885364, // Source: Flawless "Presage" Exotic Quest on Master Difficulty
      2745272818, // Source: "Presage" Exotic Quest
      3597879858, // Source: "Presage" Exotic Quest
    ],
    searchString: [],
  },
  prestige: {
    itemHashes: [],
    sourceHashes: [
      2765304727, // Source: Leviathan raid on Prestige difficulty.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
      4066007318, // Source: Leviathan, Eater of Worlds raid lair on Prestige difficulty.
    ],
    searchString: [],
  },
  prophecy: {
    itemHashes: [],
    sourceHashes: [
      506073192, // Source: "Prophecy" Dungeon
    ],
    searchString: [],
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
    searchString: [],
  },
  rahool: {
    itemHashes: [],
    sourceHashes: [
      4011186136, // Exotic Armor Focusing
    ],
    searchString: [],
  },
  raid: {
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
    sourceHashes: [
      160129377, // Source: "King's Fall" Raid
      557146120, // Source: Complete a Guided Game as a guide or seeker.
      596084342, // Source: "The Desert Perpetual" Raid
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
      2127551856, // Source: "The Desert Perpetual" Epic Raid
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
    searchString: [],
  },
  rasputin: {
    itemHashes: [],
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
    searchString: [],
  },
  revenant: {
    itemHashes: [],
    sourceHashes: [
      792439255, // Source: Tonic Laboratory in the Last City
      1605890568, // Source: Episode Revenant Seasonal Activities
      2463956052, // Source: Vesper's Host
      3906217258, // Source: Revenant Fortress
    ],
    searchString: [],
  },
  riteofthenine: {
    itemHashes: [
      14929251, // Long Arm
      492673102, // New Pacific Epitaph
      749483159, // Prosecutor (Adept)
      1050582210, // Greasy Luck (Adept)
      1066598837, // Relentless (Adept)
      1157220231, // No Survivors (Adept)
      1460079227, // Liminal Vigil
      1685406703, // Greasy Luck
      1773934241, // Judgment
      1904170910, // A Sudden Death
      1987644603, // Judgment (Adept)
      2126543269, // Cold Comfort (Adept)
      2129814338, // Prosecutor
      2477408004, // Wilderflight (Adept)
      2730671571, // Terminus Horizon
      2760833884, // Cold Comfort
      2764074355, // A Sudden Death (Adept)
      2982006965, // Wilderflight
      3185151619, // New Pacific Epitaph (Adept)
      3329218848, // Judgment (Adept)
      3421639790, // Liminal Vigil (Adept)
      3681280908, // Relentless
      3692140710, // Long Arm (Adept)
      4193602194, // No Survivors
      4267192886, // Terminus Horizon (Adept)
    ],
    sourceHashes: [
      877404349, // Source: Rite of the Nine
    ],
    searchString: [],
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
    searchString: [],
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
    searchString: [],
  },
  ron: {
    itemHashes: [],
    sourceHashes: [
      3190710249, // Source: "Root of Nightmares" Raid
    ],
    searchString: [],
  },
  root: {
    itemHashes: [],
    sourceHashes: [
      3190710249, // Source: "Root of Nightmares" Raid
    ],
    searchString: [],
  },
  rootofnightmares: {
    itemHashes: [],
    sourceHashes: [
      3190710249, // Source: "Root of Nightmares" Raid
    ],
    searchString: [],
  },
  rotn: {
    itemHashes: [
      14929251, // Long Arm
      492673102, // New Pacific Epitaph
      749483159, // Prosecutor (Adept)
      1050582210, // Greasy Luck (Adept)
      1066598837, // Relentless (Adept)
      1157220231, // No Survivors (Adept)
      1460079227, // Liminal Vigil
      1685406703, // Greasy Luck
      1773934241, // Judgment
      1904170910, // A Sudden Death
      1987644603, // Judgment (Adept)
      2126543269, // Cold Comfort (Adept)
      2129814338, // Prosecutor
      2477408004, // Wilderflight (Adept)
      2730671571, // Terminus Horizon
      2760833884, // Cold Comfort
      2764074355, // A Sudden Death (Adept)
      2982006965, // Wilderflight
      3185151619, // New Pacific Epitaph (Adept)
      3329218848, // Judgment (Adept)
      3421639790, // Liminal Vigil (Adept)
      3681280908, // Relentless
      3692140710, // Long Arm (Adept)
      4193602194, // No Survivors
      4267192886, // Terminus Horizon (Adept)
    ],
    sourceHashes: [
      877404349, // Source: Rite of the Nine
    ],
    searchString: [],
  },
  saint14: {
    itemHashes: [],
    sourceHashes: [
      2607739079, // Source: A Matter of Time
      3404977524, // Source: Contribute to the Empyrean Restoration Effort
      4046490681, // Source: Complete the "Global Resonance" Triumph
      4267157320, // Source: ???????
    ],
    searchString: [],
  },
  salvationsedge: {
    itemHashes: [],
    sourceHashes: [
      2700267533, // Source: "Salvation's Edge" Raid
    ],
    searchString: [],
  },
  scourge: {
    itemHashes: [
      2557722678, // Midnight Smith
    ],
    sourceHashes: [
      1483048674, // Source: Complete the "Scourge of the Past" raid.
      2085016678, // Source: Complete the "Scourge of the Past" raid within the first 24 hours after its launch.
      4246883461, // Source: Found in the "Scourge of the Past" raid.
    ],
    searchString: [],
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
    searchString: [],
  },
  seasonpass: {
    itemHashes: [],
    sourceHashes: [
      333761108, // Source: Rewards Pass
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
    searchString: [],
  },
  servitor: {
    itemHashes: [
      599895591, // Sojourner's Tale
      2130875369, // Sojourner's Tale
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
    searchString: [],
  },
  shatteredthrone: {
    itemHashes: [
      185321778, // The Eternal Return
      814876684, // Wish-Ender
      2844014413, // Pallas Galliot
    ],
    sourceHashes: [],
    searchString: [],
  },
  shaxx: {
    itemHashes: [
      2307365, // The Inquisitor (Adept)
      51129316, // The Inquisitor
      161675590, // Whistler's Whim (Adept)
      303107619, // Tomorrow's Answer (Adept)
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
      1201528146, // Exalted Truth (Adept)
      1230660649, // Victory's Wreath
      1292594730, // The Summoner (Adept)
      1321626661, // Eye of Sol (Adept)
      1401300690, // Eye of Sol
      1574601402, // Whistler's Whim
      1661191197, // Disdain for Glitter
      1705843397, // Exalted Truth (Adept)
      1711056134, // Incisor
      1820994983, // The Summoner
      1893967086, // Keen Thistle
      1968410628, // The Prophet
      1973107014, // Igneous Hammer
      2022294213, // Shayura's Wrath
      2059255495, // Eye of Sol (Adept)
      2185327324, // The Inquisitor
      2300143112, // Yesterday's Question
      2314610827, // Igneous Hammer (Adept)
      2330860573, // The Inquisitor (Adept)
      2378785953, // Yesterday's Question (Adept)
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
      3009199534, // Tomorrow's Answer
      3019024381, // The Prophet (Adept)
      3102421004, // Exalted Truth
      3165143747, // Whistler's Whim
      3193598749, // The Immortal (Adept)
      3332125295, // Aisha's Care (Adept)
      3436626079, // Exalted Truth
      3444632029, // Unwavering Duty (Adept)
      3503560035, // Keen Thistle (Adept)
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
      164083100, // Source: Display of Supremacy, Weekly Challenge
      454115234, // Source: Associated Crucible Quest
      598662729, // Source: Reach Glory Rank "Legend" in the Crucible.
      705363737, // Source: Heavy Metal: Supremacy
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
      2602565384, // Source: Win competitive matches while at Ascendant 0 Rank.
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
    searchString: [],
  },
  shipwright: {
    itemHashes: [],
    sourceHashes: [
      96303009, // Source: Purchased from Amanda Holliday.
    ],
    searchString: [],
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
    searchString: [],
  },
  sos: {
    itemHashes: [],
    sourceHashes: [
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
    ],
    searchString: [],
  },
  sotp: {
    itemHashes: [
      2557722678, // Midnight Smith
    ],
    sourceHashes: [
      1483048674, // Source: Complete the "Scourge of the Past" raid.
      2085016678, // Source: Complete the "Scourge of the Past" raid within the first 24 hours after its launch.
      4246883461, // Source: Found in the "Scourge of the Past" raid.
    ],
    searchString: [],
  },
  sotw: {
    itemHashes: [],
    sourceHashes: [
      1597738585, // Source: "Spire of the Watcher" Dungeon
    ],
    searchString: [],
  },
  spireofstars: {
    itemHashes: [],
    sourceHashes: [
      1675483099, // Source: Leviathan, Spire of Stars raid lair.
      2812190367, // Source: Leviathan, Spire of Stars raid lair on Prestige difficulty.
    ],
    searchString: [],
  },
  spireofthewatcher: {
    itemHashes: [],
    sourceHashes: [
      1597738585, // Source: "Spire of the Watcher" Dungeon
    ],
    searchString: [],
  },
  strikes: {
    itemHashes: [
      42874240, // Uzume RR4
      192784503, // Pre Astyanax IV
      213264394, // Buzzard
      233635202, // Cruel Mercy
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
      2298039571, // Rake Angle
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
      2876244791, // The Palindrome
      2889501828, // The Slammer
      2932922810, // Pre Astyanax IV
      3001205424, // Ecliptic Distaff
      3125454907, // Loaded Question
      3183283212, // Wendigo GL3
      3215252549, // Determination
      3293524502, // PLUG ONE.1
      3667553455, // BrayTech Osprey
      3686538757, // Undercurrent
      3832743906, // Hung Jury SR4
      3922217119, // Lotus-Eater
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
    searchString: [],
  },
  sundered: {
    itemHashes: [
      1303313141, // Unsworn
    ],
    sourceHashes: [
      2607970476, // Source: Sundered Doctrine
    ],
    searchString: [],
  },
  sundereddoctrine: {
    itemHashes: [
      1303313141, // Unsworn
    ],
    sourceHashes: [
      2607970476, // Source: Sundered Doctrine
    ],
    searchString: [],
  },
  sundial: {
    itemHashes: [],
    sourceHashes: [
      1618754228, // Source: Sundial Activity on Mercury
      2627087475, // Source: Obelisk Bounties and Resonance Rank Increases Across the System
    ],
    searchString: [],
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
    searchString: [],
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
    searchString: [],
  },
  titan: {
    itemHashes: [],
    sourceHashes: [
      194661944, // Source: Adventure "Siren Song" on Saturn's Moon, Titan
      354493557, // Source: Complete Nightfall strike "Savathûn's Song."
      482012099, // Source: Adventure "Thief of Thieves" on Saturn's Moon, Titan
      636474187, // Source: Adventure "Deathless" on Saturn's Moon, Titan
      3534706087, // Source: Complete activities and earn rank-up packages on Saturn's Moon, Titan.
    ],
    searchString: [],
  },
  trials: {
    itemHashes: [],
    sourceHashes: [
      139599745, // Source: Earn seven wins on a single Trials ticket.
      443793689, // Source: Win games on a completed Lighthouse Passage after earning a weekly win streak of five or higher.
      486819617, // Trials of Osiris - WEAPONS
      613791463, // Source: Saint-14 Rank Up Reputation
      752988954, // Source: Flawless Chest in Trials of Osiris
      827839814, // Source: Flawless Chest in Trials of Osiris or Grandmaster Nightfalls
      1218637862, // Source: Open the Lighthouse chest after earning a weekly win streak of five or higher.
      1607607347, // Source: Complete Trials tickets and earn rank-up packages from the Emissary of the Nine.
      1923289424, // Source: Open the Lighthouse chest.
      2857787138, // Source: Trials of Osiris
      3390015730, // Source: Trials of Osiris Challenges
      3471208558, // Source: Trials of Osiris Wins
      3543690049, // Source: Complete a flawless Trials ticket.
      3564069447, // Source: Flawless Win with a "Flight of the Pigeon" Medal
    ],
    searchString: [],
  },
  umbral: {
    itemHashes: [],
    sourceHashes: [
      287889699, // Source: Umbral Engram Tutorial
      1286883820, // Source: Prismatic Recaster
    ],
    searchString: [],
  },
  vaultofglass: {
    itemHashes: [],
    sourceHashes: [
      2065138144, // Source: "Vault of Glass" Raid
    ],
    searchString: [],
  },
  vesper: {
    itemHashes: [],
    sourceHashes: [
      2463956052, // Source: Vesper's Host
    ],
    searchString: [],
  },
  vespershost: {
    itemHashes: [],
    sourceHashes: [
      2463956052, // Source: Vesper's Host
    ],
    searchString: [],
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
    searchString: [],
  },
  vog: {
    itemHashes: [],
    sourceHashes: [
      2065138144, // Source: "Vault of Glass" Raid
    ],
    searchString: [],
  },
  votd: {
    itemHashes: [],
    sourceHashes: [
      1007078046, // Source: "Vow of the Disciple" Raid
    ],
    searchString: [],
  },
  vow: {
    itemHashes: [],
    sourceHashes: [
      1007078046, // Source: "Vow of the Disciple" Raid
    ],
    searchString: [],
  },
  vowofthedisciple: {
    itemHashes: [],
    sourceHashes: [
      1007078046, // Source: "Vow of the Disciple" Raid
    ],
    searchString: [],
  },
  warlordsruin: {
    itemHashes: [],
    sourceHashes: [
      613435025, // Source: "Warlord's Ruin" Dungeon
    ],
    searchString: [],
  },
  wartable: {
    itemHashes: [],
    sourceHashes: [
      2653840925, // Source: Challenger's Proving VII Quest
      3818317874, // Source: War Table Reputation Reset
      4079816474, // Source: War Table
    ],
    searchString: [],
  },
  watcher: {
    itemHashes: [],
    sourceHashes: [
      1597738585, // Source: "Spire of the Watcher" Dungeon
    ],
    searchString: [],
  },
  wellspring: {
    itemHashes: [],
    sourceHashes: [
      82267399, // Source: "Warden of the Spring" Triumph
      502279466, // Source: Wellspring Boss Vezuul, Lightflayer
      2917218318, // Source: Wellspring Boss Golmag, Warden of the Spring
      3359853911, // Source: Wellspring Boss Zeerik, Lightflayer
      3411812408, // Source: "All the Spring's Riches" Triumph
      3450213291, // Source: Wellspring Boss Bor'gong, Warden of the Spring
    ],
    searchString: [],
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
    searchString: [],
  },
  zavala: {
    itemHashes: [
      42874240, // Uzume RR4
      192784503, // Pre Astyanax IV
      213264394, // Buzzard
      233635202, // Cruel Mercy
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
      2298039571, // Rake Angle
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
      2876244791, // The Palindrome
      2889501828, // The Slammer
      2932922810, // Pre Astyanax IV
      3001205424, // Ecliptic Distaff
      3125454907, // Loaded Question
      3183283212, // Wendigo GL3
      3215252549, // Determination
      3293524502, // PLUG ONE.1
      3667553455, // BrayTech Osprey
      3686538757, // Undercurrent
      3832743906, // Hung Jury SR4
      3922217119, // Lotus-Eater
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
    searchString: [],
  },
};

export default D2Sources;
