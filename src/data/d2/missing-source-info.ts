const missingSources: { [key: string]: number[] } = {
  '30th': [
    286271818, // Twisting Echo Cloak
    399065241, // Descending Echo Greaves
    587312237, // Twisting Echo Grips
    833653807, // Twisting Echo Strides
    1756483796, // Twisting Echo Mask
    1951355667, // Twisting Echo Vest
    2244604734, // Corrupting Echo Gloves
    2663987096, // Corrupting Echo Boots
    2885497847, // Descending Echo Gauntlets
    3048458482, // Corrupting Echo Robes
    3171090615, // Corrupting Echo Cover
    3267969345, // Descending Echo Cage
    3685276035, // Corrupting Echo Bond
    3871537958, // Descending Echo Helm
    4050474396, // Descending Echo Mark
  ],
  ada: [
    2533990645, // Blast Furnace
  ],
  adventure: [
    11686457, // Unethical Experiments Cloak
    11686458, // Orobas Vectura Cloak
    320310249, // Orobas Vectura Bond
    320310250, // Unethical Experiments Bond
    886128573, // Mindbreaker Boots
    1096417434, // Shieldbreaker Robes
    1286488743, // Shieldbreaker Plate
    1355771621, // Shieldbreaker Vest
    1701005142, // Songbreaker Gloves
    1701005143, // Gearhead Gloves
    2317191363, // Mindbreaker Boots
    2426340788, // Orobas Vectura Mark
    2426340791, // Unethical Experiments Mark
    2486041712, // Gearhead Gauntlets
    2486041713, // Songbreaker Gauntlets
    2913284400, // Mindbreaker Boots
    3706457514, // Gearhead Grips
    3706457515, // Songbreaker Grips
  ],
  blackarmory: [
    2533990645, // Blast Furnace
  ],
  brave: [
    211732170, // Hammerhead
    243425374, // Falling Guillotine
    570866107, // Succession
    2228325504, // Edge Transit
    2499720827, // Midnight Coup
    3757612024, // Luna's Howl
    3851176026, // Elsie's Rifle
  ],
  campaign: [
    423789, // Mythos Hack 4.1
    644105, // Heavy Ammo Finder
    11686456, // Dreamer's Cloak
    13719069, // Atgeir Mark
    40512774, // Farseeker's Casque
    56663992, // Solar Scavenger
    59990642, // Refugee Plate
    67798808, // Atonement Tau
    76554114, // Cry Defiance
    83898430, // Scavenger Suit
    91289429, // Atonement Tau
    95934356, // Strand Loader
    96682422, // Arc Targeting
    124410141, // Shadow Specter
    126602378, // Primal Siege Type 1
    137713267, // Refugee Vest
    174910288, // Mark of Inquisition
    177215556, // Shadow Specter
    182285650, // Kit Fox 1.5
    201644247, // Hardcase Battleplate
    202783988, // Black Shield Mark
    203317967, // Fieldplate Type 10
    226227391, // Fortress Field
    246765359, // Mythos Hack 4.1
    255520209, // Cloak of Retelling
    280187206, // Hardcase Battleplate
    288815409, // Renegade Greaves
    293178904, // Unflinching Harmonic Aim
    320174990, // Bond of Chiron
    320310251, // Dreamer's Bond
    331268185, // Solar Targeting
    341343759, // Prophet Snow
    341468857, // Bond of Insight
    366418892, // The Outlander's Grip
    387708030, // Prophet Snow
    392489920, // Primal Siege Type 1
    397654099, // Wastelander Vest
    402937789, // Shadow Specter
    406995961, // Stagnatious Rebuke
    407150810, // Ribbontail
    407150811, // Ribbontail
    411014648, // Solar Ammo Generation
    417821705, // Primal Siege Type 1
    418611312, // Shadow Specter
    420937712, // War Mantis Cloak
    422994787, // Emergency Reinforcement
    452060094, // Refugee Gloves
    457297858, // Atgeir 2T1
    459778797, // Refugee Mask
    461025654, // Primal Siege Type 1
    463563656, // Primal Siege Type 1
    467612864, // Chiron's Cure
    474150341, // RPC Valiant
    482091581, // Hardcase Stompers
    484126150, // Chiron's Cure
    516502270, // Firebreak Field
    531665167, // Solar Dexterity
    539726822, // Refugee Boots
    550258943, // Chiron's Cure
    558125905, // Frumious Mask
    579997810, // Kinetic Scavenger
    598178607, // Mark of Confrontation
    600059642, // The Outlander's Cloak
    610837228, // Raven Shard
    612495088, // Homeward
    622291842, // Farseeker's March
    625602056, // Memory of Cayde Cloak
    627055961, // Fortress Field
    634608391, // Solar Loader
    643145875, // Legion-Bane
    648022469, // Makeshift Suit
    648638907, // Kit Fox 2.1
    657773637, // Sniper Damage Resistance
    674335586, // Chiron's Cure
    696808195, // Refugee Mark
    703683040, // Atgeir 2T1
    703902595, // Stasis Loader
    720723122, // At Least It's a Cape
    721208609, // Farseeker's Intuition
    732520437, // Baseline Mark
    733635242, // RPC Valiant
    735669834, // Shadow Specter
    739196403, // RPC Valiant
    739406993, // Atgeir 2T1
    747210772, // Mythos Hack 4.1
    777818225, // Fieldplate Type 10
    789384557, // Atonement Tau
    792400107, // Unflinching Arc Aim
    795389673, // The Outlander's Cloak
    803939997, // War Mantis
    830369300, // Lucent Blades
    833626649, // Chiron's Cure
    844823562, // Mechanik 1.1
    846463017, // Fieldplate Type 10
    856745412, // War Mantis
    857264972, // Scavenger Suit
    863007481, // Farseeker's March
    867963905, // Hardcase Brawlers
    868799838, // Renegade Helm
    871442456, // Refugee Boots
    877723168, // Harmonic Scavenger
    881194063, // Prophet Snow
    897275209, // The Outlander's Heart
    897335593, // Kinetic Siphon
    905249529, // Shadow Specter
    911039437, // Refugee Gloves
    930759851, // Concussive Dampener
    933345182, // Fieldplate Type 10
    965934024, // Firepower
    995248967, // Makeshift Suit
    1012254326, // The Outlander's Steps
    1014677029, // Memory of Cayde
    1017385934, // Void Dexterity
    1019574576, // Unflinching Solar Aim
    1022126988, // Baseline Mark
    1036557198, // Hands-On
    1044888195, // Utility Kickstart
    1045948748, // Mythos Hack 4.1
    1048498953, // Bond of the Raven Shard
    1070180272, // Hardcase Helm
    1086997255, // Solar Siphon
    1103878128, // Harmonic Ammo Generation
    1118428792, // Unflinching Stasis Aim
    1118437892, // War Mantis
    1124184622, // Minor Class Mod
    1139671158, // Melee Kickstart
    1153260021, // Impact Induction
    1169595348, // Mythos Hack 4.1
    1176372075, // Stasis Resistance
    1208761894, // Empowered Finish
    1210012576, // Void Siphon
    1255614814, // Grenade Font
    1256569366, // Raven Shard
    1279721672, // Fortress Field
    1300106409, // Prophet Snow
    1305848463, // Strand Scavenger
    1328755281, // Farseeker's Casque
    1331205087, // Cosmic Wind III
    1360445272, // Firebreak Field
    1365739620, // Mythos Hack 4.1
    1365979278, // Legion-Bane
    1378545975, // Refugee Helm
    1443091319, // Firebreak Field
    1452147980, // Makeshift Suit
    1455694321, // Prophet Snow
    1473385934, // Mark of the Golden Citadel
    1479532637, // The Outlander's Cover
    1479892134, // War Mantis
    1484009400, // RPC Valiant
    1486292360, // Chiron's Cure
    1488618333, // Chiron's Cure
    1500704923, // Prophet Snow
    1501094193, // Strand Weapon Surge
    1503713660, // Stagnatious Rebuke
    1512570524, // Hardcase Stompers
    1537074069, // Phoenix Cradle
    1556652797, // The Outlander's Grip
    1561736585, // Kinetic Dexterity
    1578478684, // Refugee Gloves
    1581838479, // Refugee Boots
    1604394872, // Dynamo
    1611221278, // Prophet Snow
    1616317796, // Prophet Snow
    1627901452, // Stacks on Stacks
    1630079134, // Bond of Forgotten Wars
    1658512403, // Mythos Hack 4.1
    1665016007, // Primal Siege Type 1
    1672155562, // Class Font
    1691784182, // Mythos Hack 4.1
    1701236611, // The Outlander's Heart
    1702273159, // Harmonic Loader
    1709236482, // Heavy Handed
    1715842350, // Generalist Shell
    1736993473, // Legion-Bane
    1763607626, // Melee Mod
    1775818231, // Legion-Bane
    1783952505, // Time Dilation
    1784774885, // Vector Home
    1801153435, // Stasis Targeting
    1824298413, // War Mantis
    1848999098, // Bond of Symmetry
    1862164825, // War Mantis Cloak
    1866564759, // Super Mod
    1872887954, // Atonement Tau
    1891463783, // Harmonic Targeting
    1901221009, // Weapons Font
    1912568536, // Primal Siege Type 1
    1915498345, // Cloak of Retelling
    1924584408, // Grenade Kickstart
    1933944659, // Hardcase Helm
    1965476837, // War Mantis
    1981225397, // Shadow Specter
    1988790493, // Stagnatious Rebuke
    1992338980, // The Outlander's Cover
    1996008488, // Stormdancer's Brace
    2002682954, // Vector Home
    2031584061, // Momentum Transfer
    2049820819, // Vector Home
    2065578431, // Shadow Specter
    2113881316, // Minor Health Mod
    2136310244, // Ashes to Assets
    2148305277, // Raven Shard
    2151724216, // Prophet Snow
    2159062493, // Mythos Hack 4.1
    2162276668, // Cry Defiance
    2165661157, // Baseline Mark
    2183384906, // War Mantis
    2190967049, // Prophet Snow
    2203146422, // Assassin's Cowl
    2211544324, // The Outlander's Cloak
    2214424583, // Kinetic Targeting
    2230522771, // War Mantis
    2237975061, // Kinetic Loader
    2245839670, // Proximity Ward
    2246316031, // Arc Weapon Surge
    2253044470, // Legion-Bane
    2267311547, // Stasis Dexterity
    2283894334, // Solar Weapon Surge
    2303417969, // Strand Ammo Generation
    2305736470, // Kinetic Ammo Generation
    2317046938, // Shadow Specter
    2318667184, // Kinetic Weapon Surge
    2325151798, // Unflinching Kinetic Aim
    2329963686, // Mark of Confrontation
    2339344379, // Atonement Tau
    2343139242, // Bond of Refuge
    2362809459, // Hardcase Stompers
    2363903643, // Makeshift Suit
    2413278875, // Void Ammo Generation
    2426340790, // Dreamer's Mark
    2436471653, // Arc Scavenger
    2441435355, // Prophet Snow
    2459075622, // RPC Valiant
    2466525328, // RPC Valiant
    2476964124, // War Mantis
    2479297167, // Harmonic Dexterity
    2493161484, // Class Mod
    2504771764, // Refugee Helm
    2519597513, // Minor Super Mod
    2526922422, // Stasis Weapon Surge
    2541019576, // Mark of Confrontation
    2562645296, // Melee Damage Resistance
    2567295299, // Cosmic Wind III
    2568808786, // Health Mod
    2574857320, // Sly Cloak
    2583547635, // Cry Defiance
    2626766308, // Mark of the Longest Line
    2634786903, // Void Holster
    2640935765, // Memory of Cayde
    2644553610, // Renegade Hood
    2689896341, // Mythos Hack 4.1
    2739875972, // RPC Valiant
    2742930797, // Fatum Praevaricator
    2745108287, // War Mantis
    2765451290, // Synanceia
    2765451291, // Synanceia
    2771425787, // Melee Font
    2788997987, // Void Resistance
    2794359402, // Arc Dexterity
    2801811288, // Stasis Holster
    2803009638, // Cry Defiance
    2803481901, // RPC Valiant
    2805854721, // Strand Holster
    2813695893, // Fatum Praevaricator
    2814965254, // Aspirant Boots
    2815743359, // Legion-Bane
    2815817957, // Void Scavenger
    2822491218, // Atonement Tau
    2825160682, // RPC Valiant
    2833813592, // Bond of Chiron
    2854973517, // Farseeker's Casque
    2871824910, // Mythos Hack 4.1
    2880545163, // Black Shield Mark
    2886651369, // Renegade Plate
    2888021252, // Trachinus
    2888021253, // Trachinus
    2888195476, // Void Targeting
    2893448006, // Farseeker's March
    2930768301, // Wastelander Wraps
    2937068650, // Chiron's Cure
    2943629439, // Chiron's Cure
    2959986506, // Prophet Snow
    2982306509, // Power Preservation
    2983961673, // Primal Siege Type 1
    2985655620, // Refugee Vest
    2994740249, // RPC Valiant
    2996369932, // Elemental Charge
    3007889693, // RPC Valiant
    3013778406, // Strand Targeting
    3035240099, // Shadow Specter
    3046678542, // Arc Loader
    3047946307, // Shield Break Charge
    3061532064, // Farseeker's Intuition
    3075302157, // Health Font
    3080409700, // Bond of Forgotten Wars
    3102366928, // Atonement Tau
    3121104079, // Rite of Refusal
    3159474701, // Aspirant Helm
    3160437036, // Shadow Specter
    3163241201, // Primal Siege Type 1
    3164547673, // Atonement Tau
    3174394351, // The Outlander's Grip
    3174771856, // Stasis Scavenger
    3181984586, // Charged Up
    3183585337, // Legion-Bane
    3184690956, // Absolution
    3188328909, // Stasis Siphon
    3212340413, // War Mantis
    3224649746, // Void Loader
    3238424670, // Memory of Cayde Mark
    3245543337, // Bolstering Detonation
    3260546749, // Cosmic Wind
    3264653916, // Mythos Hack 4.1
    3276278122, // Kinetic Holster
    3279257734, // Strand Siphon
    3294892432, // Stasis Ammo Generation
    3302420523, // Hardcase Brawlers
    3309120116, // Shadow Specter
    3310450277, // Scavenger Suit
    3313352164, // Cosmic Wind
    3349439959, // Farseeker's Reach
    3352069677, // Kit Fox 1.1
    3382396922, // Primal Siege Type 1
    3391214896, // Atonement Tau
    3403897789, // Vector Home
    3419425578, // Atonement Tau
    3437155610, // War Mantis Cloak
    3438103366, // Black Shield Mark
    3456147612, // RPC Valiant
    3456250548, // Stasis Resistance
    3461249873, // Super Font
    3465323600, // Legion-Bane
    3468148580, // Aspirant Robes
    3483602905, // Mark of Inquisition
    3507639356, // Farseeker's Reach
    3508205736, // Fatum Praevaricator
    3519241547, // Fortress Field
    3523134386, // Firebreak Field
    3524846593, // Atonement Tau
    3539253011, // Arc Resistance
    3544711340, // Memory of Cayde Mark
    3544884935, // Hood of Tallies
    3554672786, // Memory of Cayde Cloak
    3556023425, // Scavenger Cloak
    3573886331, // Bond of Chiron
    3585730968, // Shadow Specter
    3598972737, // Unflinching Strand Aim
    3639035739, // Mechanik 1.2
    3643144047, // Wastelander Boots
    3650925928, // Atgeir 2T1
    3656549306, // Legion-Bane
    3657186535, // Focusing Strike
    3675553168, // Solar Holster
    3693917763, // Mark of the Fire
    3725709067, // Chiron's Cure
    3748997649, // The Outlander's Steps
    3763392098, // Hardcase Brawlers
    3775800797, // Special Ammo Finder
    3790903614, // Mechanik 2.1
    3791691774, // Orbs of Restoration
    3798468567, // Arc Holster
    3804242792, // Phoneutria Fera
    3804242793, // Phoneutria Fera
    3808902618, // Weapons Mod
    3812037372, // Aspirant Gloves
    3846931924, // Solar Resistance
    3847471926, // Arc Siphon
    3867725217, // Legion-Bane
    3877365781, // Kit Fox 1.4
    3880804895, // The Outlander's Steps
    3885104741, // Hardcase Battleplate
    3887037435, // Unflinching Void Aim
    3896141096, // Grenade Mod
    3904524734, // The Outlander's Cover
    3914973263, // Void Weapon Surge
    3922069396, // The Outlander's Heart
    3958133156, // Farseeker's Intuition
    3962776002, // Hardcase Helm
    3967705743, // Renegade Gauntlets
    3968319087, // Legion-Bane
    3979300428, // Strand Dexterity
    4012302343, // Bond of Forgotten Wars
    4035217656, // Atonement Tau
    4052950089, // Shadow Specter
    4062934448, // Primal Siege Type 1
    4069941456, // Legion-Bane
    4091127092, // Scavenger Suit
    4100043028, // Wastelander Mask
    4133705268, // Raven Shard
    4135938411, // Last City Shell (Damaged)
    4149682173, // Reaper
    4155348771, // War Mantis
    4166795065, // Primal Siege Type 1
    4174470997, // Mark of Inquisition
    4177795589, // Chiron's Cure
    4179002916, // Mechanik 1.1
    4195519897, // Refugee Cloak
    4200817316, // Mark of the Renegade
    4230626646, // Shadow Specter
    4248632159, // Frumious Mask
    4267244538, // Distribution
    4267370571, // Chiron's Cure
    4281850920, // Farseeker's Reach
    4283953067, // Arc Ammo Generation
    4288395850, // Cloak of Retelling
  ],
  cos: [
    17280095, // Shadow's Strides
    256904954, // Shadow's Grips
    309687341, // Shadow's Greaves
    325125949, // Shadow's Helm
    560455272, // Penumbral Mark
    612065993, // Penumbral Mark
    874272413, // Shadow's Robes
    974648224, // Shadow's Boots
    1434870610, // Shadow's Helm
    1457195686, // Shadow's Gloves
    1481751647, // Shadow's Mind
    1862963733, // Shadow's Plate
    1901223867, // Shadow's Gauntlets
    1934647691, // Shadow's Mask
    1937834292, // Shadow's Strides
    1946621757, // Shadow's Grips
    1999427172, // Shadow's Mask
    2023695690, // Shadow's Robes
    2153222031, // Shadow's Gloves
    2194479195, // Penumbral Bond
    2765688378, // Penumbral Cloak
    2769298993, // Shadow's Boots
    3082625196, // Shadow's Gauntlets
    3108321700, // Penumbral Bond
    3349283422, // Shadow's Mind
    3483984579, // Shadow's Vest
    3517729518, // Shadow's Vest
    3518193943, // Penumbral Cloak
    3759659288, // Shadow's Plate
    4152814806, // Shadow's Greaves
  ],
  crownofsorrow: [
    17280095, // Shadow's Strides
    256904954, // Shadow's Grips
    309687341, // Shadow's Greaves
    325125949, // Shadow's Helm
    560455272, // Penumbral Mark
    612065993, // Penumbral Mark
    874272413, // Shadow's Robes
    974648224, // Shadow's Boots
    1434870610, // Shadow's Helm
    1457195686, // Shadow's Gloves
    1481751647, // Shadow's Mind
    1862963733, // Shadow's Plate
    1901223867, // Shadow's Gauntlets
    1934647691, // Shadow's Mask
    1937834292, // Shadow's Strides
    1946621757, // Shadow's Grips
    1999427172, // Shadow's Mask
    2023695690, // Shadow's Robes
    2153222031, // Shadow's Gloves
    2194479195, // Penumbral Bond
    2765688378, // Penumbral Cloak
    2769298993, // Shadow's Boots
    3082625196, // Shadow's Gauntlets
    3108321700, // Penumbral Bond
    3349283422, // Shadow's Mind
    3483984579, // Shadow's Vest
    3517729518, // Shadow's Vest
    3518193943, // Penumbral Cloak
    3759659288, // Shadow's Plate
    4152814806, // Shadow's Greaves
  ],
  crucible: [
    85800627, // Ankaa Seeker IV
    98331691, // Binary Phoenix Mark
    120859138, // Phoenix Strife Type 0
    185853176, // Wing Discipline
    252414402, // Swordflight 4.1
    283188616, // Wing Contender
    290136582, // Wing Theorem
    315615761, // Ankaa Seeker IV
    327530279, // Wing Theorem
    328902054, // Swordflight 4.1
    356269375, // Wing Theorem
    388771599, // Phoenix Strife Type 0
    419812559, // Ankaa Seeker IV
    438224459, // Wing Discipline
    449878234, // Phoenix Strife Type 0
    468899627, // Binary Phoenix Mark
    494475253, // Ossuary Boots
    530558102, // Phoenix Strife Type 0
    628604416, // Ossuary Bond
    631191162, // Ossuary Cover
    636679949, // Ankaa Seeker IV
    657400178, // Swordflight 4.1
    670877864, // Binary Phoenix Mark
    727838174, // Swordflight 4.1
    744199039, // Wing Contender
    761953100, // Ankaa Seeker IV
    820446170, // Phoenix Strife Type 0
    849529384, // Phoenix Strife Type 0
    874101646, // Wing Theorem
    876608500, // Ankaa Seeker IV
    920187221, // Wing Discipline
    929917162, // Wing Theorem
    944242985, // Ankaa Seeker IV
    979782821, // Hinterland Cloak
    987343638, // Ankaa Seeker IV
    997903134, // Wing Theorem
    1036467370, // Wing Theorem
    1062166003, // Wing Contender
    1063904165, // Wing Discipline
    1069887756, // Wing Contender
    1071350799, // Binary Phoenix Cloak
    1084033161, // Wing Contender
    1127237110, // Wing Contender
    1167444103, // Biosphere Explorer Mark
    1245115841, // Wing Theorem
    1294217731, // Binary Phoenix Cloak
    1307478991, // Ankaa Seeker IV
    1330581478, // Phoenix Strife Type 0
    1333087155, // Ankaa Seeker IV
    1381742107, // Biosphere Explorer Helm
    1464207979, // Wing Discipline
    1467590642, // Binary Phoenix Bond
    1484937602, // Phoenix Strife Type 0
    1497354980, // Biosphere Explorer Greaves
    1548928853, // Phoenix Strife Type 0
    1571781304, // Swordflight 4.1
    1648675919, // Binary Phoenix Mark
    1654427223, // Swordflight 4.1
    1658896287, // Binary Phoenix Cloak
    1673285051, // Wing Theorem
    1716643851, // Wing Contender
    1722623780, // Wing Discipline
    1742680797, // Binary Phoenix Mark
    1742940528, // Phoenix Strife Type 0
    1764274932, // Ankaa Seeker IV
    1801625827, // Swordflight 4.1
    1828358334, // Swordflight 4.1
    1830829330, // Swordflight 4.1
    1837817086, // Biosphere Explorer Plate
    1838158578, // Binary Phoenix Bond
    1838273186, // Wing Contender
    1852468615, // Ankaa Seeker IV
    1904811766, // Swordflight 4.1
    1929596421, // Ankaa Seeker IV
    2048762125, // Ossuary Robes
    2070517134, // Wing Contender
    2124666626, // Wing Discipline
    2191401041, // Phoenix Strife Type 0
    2191437287, // Ankaa Seeker IV
    2206581692, // Phoenix Strife Type 0
    2231762285, // Phoenix Strife Type 0
    2247740696, // Swordflight 4.1
    2291226602, // Binary Phoenix Bond
    2293476915, // Swordflight 4.1
    2296560252, // Swordflight 4.1
    2296691422, // Swordflight 4.1
    2323865727, // Wing Theorem
    2331227463, // Wing Contender
    2339694345, // Hinterland Cowl
    2402428483, // Ossuary Gloves
    2415711886, // Wing Contender
    2426070307, // Binary Phoenix Cloak
    2466453881, // Wing Discipline
    2473130418, // Swordflight 4.1
    2496309431, // Wing Discipline
    2511045676, // Binary Phoenix Bond
    2525395257, // Wing Theorem
    2543903638, // Phoenix Strife Type 0
    2555965565, // Wing Discipline
    2627852659, // Phoenix Strife Type 0
    2670393359, // Phoenix Strife Type 0
    2718495762, // Swordflight 4.1
    2727890395, // Ankaa Seeker IV
    2754844215, // Swordflight 4.1
    2775298636, // Ankaa Seeker IV
    2815422368, // Phoenix Strife Type 0
    2841023690, // Biosphere Explorer Gauntlets
    3089908066, // Wing Discipline
    3098328572, // The Recluse
    3098458331, // Ankaa Seeker IV
    3119528729, // Wing Contender
    3121010362, // Hinterland Strides
    3140634552, // Swordflight 4.1
    3148195144, // Hinterland Vest
    3211001969, // Wing Contender
    3223280471, // Swordflight 4.1
    3298826188, // Swordflight 4.1
    3313736739, // Binary Phoenix Cloak
    3315265682, // Phoenix Strife Type 0
    3483546829, // Wing Discipline
    3522021318, // Wing Discipline
    3538513130, // Binary Phoenix Bond
    3724026171, // Wing Theorem
    3756286064, // Phoenix Strife Type 0
    3772194440, // Wing Contender
    3781722107, // Phoenix Strife Type 0
    3818803676, // Wing Discipline
    3839561204, // Wing Theorem
    4043189888, // Hinterland Grips
    4043921923, // The Mountaintop
    4043980813, // Ankaa Seeker IV
    4123918087, // Wing Contender
    4134090375, // Ankaa Seeker IV
    4136212668, // Wing Discipline
    4144133120, // Wing Theorem
    4211218181, // Ankaa Seeker IV
    4264096388, // Wing Theorem
  ],
  deluxe: [
    1952218242, // Sequence Flourish
    2683682447, // Traitor's Fate
  ],
  do: [
    66235782, // Anti-Extinction Grasps
    132368575, // Anti-Extinction Mask
    387100392, // Anti-Extinction Plate
    1978760489, // Anti-Extinction Helm
    2089197765, // Stella Incognita Mark
    2760076378, // Anti-Extinction Greaves
    2873960175, // Anti-Extinction Robes
    3146241834, // Anti-Extinction Vest
    3299588760, // Anti-Extinction Hood
    3763392361, // Anti-Extinction Gloves
    3783059515, // Stella Incognita Cloak
    3920232320, // Anti-Extinction Legs
    4055334203, // Anti-Extinction Boots
    4065136800, // Anti-Extinction Gauntlets
    4121118846, // Stella Incognita Bond
  ],
  dreaming: [
    99549082, // Reverie Dawn Helm
    185695659, // Reverie Dawn Hood
    188778964, // Reverie Dawn Boots
    344548395, // Reverie Dawn Strides
    871900124, // Retold Tale
    934704429, // Reverie Dawn Plate
    998096007, // Reverie Dawn Hood
    1452333832, // Reverie Dawn Boots
    1593474975, // Reverie Dawn Hauberk
    1705856569, // Reverie Dawn Grasps
    1903023095, // Reverie Dawn Grasps
    1928769139, // Reverie Dawn Bond
    1980768298, // Reverie Dawn Mark
    2336820707, // Reverie Dawn Gauntlets
    2467635521, // Reverie Dawn Hauberk
    2503434573, // Reverie Dawn Gauntlets
    2704876322, // Reverie Dawn Tabard
    2761343386, // Reverie Dawn Gloves
    2824453288, // Reverie Dawn Casque
    2859583726, // Reverie Dawn Tabard
    2889063206, // Reverie Dawn Casque
    3174233615, // Reverie Dawn Greaves
    3239662350, // Reverie Dawn Gloves
    3250140572, // Reverie Dawn Cloak
    3306564654, // Reverie Dawn Cloak
    3343583008, // Reverie Dawn Mark
    3602032567, // Reverie Dawn Bond
    3711557785, // Reverie Dawn Strides
    4070309619, // Reverie Dawn Plate
    4097166900, // Reverie Dawn Helm
    4257800469, // Reverie Dawn Greaves
  ],
  drifter: [
    9767416, // Ancient Apocalypse Bond
    94425673, // Ancient Apocalypse Gloves
    127018032, // Ancient Apocalypse Grips
    191247558, // Ancient Apocalypse Plate
    191535001, // Ancient Apocalypse Greaves
    230878649, // Ancient Apocalypse Mask
    386367515, // Ancient Apocalypse Boots
    392058749, // Ancient Apocalypse Boots
    485653258, // Ancient Apocalypse Strides
    494475253, // Ossuary Boots
    509238959, // Ancient Apocalypse Mark
    628604416, // Ossuary Bond
    629787707, // Ancient Apocalypse Mask
    631191162, // Ossuary Cover
    759348512, // Ancient Apocalypse Mask
    787909455, // Ancient Apocalypse Robes
    887818405, // Ancient Apocalypse Robes
    978447246, // Ancient Apocalypse Gauntlets
    979782821, // Hinterland Cloak
    1013137701, // Ancient Apocalypse Hood
    1167444103, // Biosphere Explorer Mark
    1169857924, // Ancient Apocalypse Strides
    1188039652, // Ancient Apocalypse Gauntlets
    1193646249, // Ancient Apocalypse Boots
    1236746902, // Ancient Apocalypse Hood
    1237661249, // Ancient Apocalypse Plate
    1356064950, // Ancient Apocalypse Grips
    1359908066, // Ancient Apocalypse Gauntlets
    1381742107, // Biosphere Explorer Helm
    1488486721, // Ancient Apocalypse Bond
    1497354980, // Biosphere Explorer Greaves
    1548620661, // Ancient Apocalypse Cloak
    1741396519, // Ancient Apocalypse Vest
    1752237812, // Ancient Apocalypse Gloves
    1837817086, // Biosphere Explorer Plate
    2020166300, // Ancient Apocalypse Mark
    2039976446, // Ancient Apocalypse Boots
    2048762125, // Ossuary Robes
    2088829612, // Ancient Apocalypse Bond
    2130645994, // Ancient Apocalypse Grips
    2339694345, // Hinterland Cowl
    2402428483, // Ossuary Gloves
    2440840551, // Ancient Apocalypse Gloves
    2451538755, // Ancient Apocalypse Strides
    2459422430, // Ancient Apocalypse Bond
    2506514251, // Ancient Apocalypse Cloak
    2512196373, // Ancient Apocalypse Helm
    2518527196, // Ancient Apocalypse Plate
    2568447248, // Ancient Apocalypse Strides
    2620389105, // Ancient Apocalypse Grips
    2677967607, // Ancient Apocalypse Gauntlets
    2694124942, // Ancient Apocalypse Greaves
    2728668760, // Ancient Apocalypse Vest
    2841023690, // Biosphere Explorer Gauntlets
    2858060922, // Ancient Apocalypse Vest
    2881248566, // Ancient Apocalypse Cloak
    3031848199, // Ancient Apocalypse Helm
    3121010362, // Hinterland Strides
    3148195144, // Hinterland Vest
    3184912423, // Ancient Apocalypse Cloak
    3339632627, // Ancient Apocalypse Mark
    3404053788, // Ancient Apocalypse Greaves
    3486086024, // Ancient Apocalypse Greaves
    3537476911, // Ancient Apocalypse Mask
    3550729740, // Ancient Apocalypse Robes
    3595268459, // Ancient Apocalypse Gloves
    3664007718, // Ancient Apocalypse Helm
    3804360785, // Ancient Apocalypse Mark
    3825427923, // Ancient Apocalypse Helm
    3855285278, // Ancient Apocalypse Vest
    3925589496, // Ancient Apocalypse Hood
    4043189888, // Hinterland Grips
    4115739810, // Ancient Apocalypse Plate
    4188366993, // Ancient Apocalypse Robes
    4255727106, // Ancient Apocalypse Hood
  ],
  duality: [
    145651147, // Deep Explorer Vest
    420895300, // Deep Explorer Mark
    1148597205, // Deep Explorer Grasps
    2057955626, // Deep Explorer Vestments
    2499351855, // Deep Explorer Gauntlets
    2649394513, // Deep Explorer Greaves
    2694773307, // Deep Explorer Bond
    2724719415, // Deep Explorer Strides
    2797334754, // Deep Explorer Cloak
    2819810688, // Deep Explorer Boots
    2935559305, // Deep Explorer Plate
    3260781446, // Deep Explorer Gloves
    3270955774, // Deep Explorer Helmet
    3326914239, // Deep Explorer Hood
    4047213660, // Deep Explorer Mask
  ],
  dungeon: [
    51786498, // Vest of the Taken King
    145651147, // Deep Explorer Vest
    286271818, // Twisting Echo Cloak
    399065241, // Descending Echo Greaves
    420895300, // Deep Explorer Mark
    436695703, // TM-Cogburn Custom Plate
    498918879, // TM-Earp Custom Grips
    557092665, // Dark Age Cloak
    587312237, // Twisting Echo Grips
    632989816, // Dark Age Gauntlets
    638836294, // Plate of the Taken King
    708921139, // TM-Cogburn Custom Legguards
    767306222, // Grasps of the Taken King
    806004493, // Dark Age Gloves
    833653807, // Twisting Echo Strides
    837865641, // Vestment of the Taken King
    851401651, // Dark Age Overcoat
    956827695, // Mark of the Taken King
    1148597205, // Deep Explorer Grasps
    1349399252, // TM-Earp Custom Cloaked Stetson
    1460079227, // Liminal Vigil
    1476803535, // Dark Age Legbraces
    1664757090, // Gauntlets of the Taken King
    1756483796, // Twisting Echo Mask
    1773934241, // Judgment
    1904170910, // A Sudden Death
    1913823311, // Gloves of the Taken King
    1933599476, // Dark Age Visor
    1951355667, // Twisting Echo Vest
    2057955626, // Deep Explorer Vestments
    2129814338, // Prosecutor
    2244604734, // Corrupting Echo Gloves
    2341879253, // TM-Moss Custom Bond
    2426502022, // Dark Age Strides
    2488323569, // Boots of the Taken King
    2499351855, // Deep Explorer Gauntlets
    2565015142, // TM-Cogburn Custom Mark
    2618168932, // Bond of the Taken King
    2643850526, // Hood of the Taken King
    2649394513, // Deep Explorer Greaves
    2662590925, // Dark Age Mark
    2663987096, // Corrupting Echo Boots
    2694773307, // Deep Explorer Bond
    2724719415, // Deep Explorer Strides
    2760833884, // Cold Comfort
    2771011469, // Dark Age Mask
    2797334754, // Deep Explorer Cloak
    2819810688, // Deep Explorer Boots
    2820604007, // Mask of the Taken King
    2850384360, // Strides of the Taken King
    2885497847, // Descending Echo Gauntlets
    2935559305, // Deep Explorer Plate
    2963224754, // Dark Age Sabatons
    2982006965, // Wilderflight
    3048458482, // Corrupting Echo Robes
    3056827626, // Dark Age Bond
    3171090615, // Corrupting Echo Cover
    3260781446, // Deep Explorer Gloves
    3267969345, // Descending Echo Cage
    3270955774, // Deep Explorer Helmet
    3326914239, // Deep Explorer Hood
    3344225390, // TM-Earp Custom Hood
    3423574140, // Dark Age Grips
    3511740432, // TM-Moss Custom Gloves
    3570749779, // Cloak of the Taken King
    3683772388, // Dark Age Harness
    3685276035, // Corrupting Echo Bond
    3708902812, // Greaves of the Taken King
    3715136417, // TM-Earp Custom Chaps
    3735435664, // Dark Age Chestrig
    3870375786, // TM-Moss Custom Pants
    3871537958, // Descending Echo Helm
    3933500353, // TM-Cogburn Custom Gauntlets
    3946384952, // TM-Moss Custom Duster
    4039955353, // TM-Moss Custom Hat
    4047213660, // Deep Explorer Mask
    4050474396, // Descending Echo Mark
    4090037601, // Dark Age Helm
    4097972038, // A Sudden Death
    4130276947, // Helm of the Taken King
    4177293424, // TM-Cogburn Custom Cover
    4288623897, // TM-Earp Custom Vest
  ],
  edgeoffate: [
    407150810, // Ribbontail
    407150811, // Ribbontail
    2765451290, // Synanceia
    2765451291, // Synanceia
    2888021252, // Trachinus
    2888021253, // Trachinus
    3804242792, // Phoneutria Fera
    3804242793, // Phoneutria Fera
  ],
  edz: [
    10307688, // Wildwood Plate
    11686458, // Orobas Vectura Cloak
    320310249, // Orobas Vectura Bond
    872284448, // Wildwood Gauntlets
    1304122208, // Wildwood Bond
    1664741411, // Wildwood Gloves
    1701005143, // Gearhead Gloves
    1712405061, // Wildwood Mark
    2426340788, // Orobas Vectura Mark
    2486041712, // Gearhead Gauntlets
    2724176749, // Wildwood Robes
    2729740202, // Wildwood Vest
    3080875433, // Wildwood Helm
    3366557883, // Wildwood Cloak
    3466255616, // Wildwood Strides
    3706457514, // Gearhead Grips
    3764013786, // Wildwood Cover
    3862191322, // Wildwood Greaves
    3907226374, // Wildwood Grips
    3973359167, // Wildwood Mask
    4051755349, // Wildwood Boots
  ],
  eow: [
    239489770, // Bond of Sekris
    253344425, // Mask of Feltroc
    340118991, // Boots of Sekris
    383742277, // Cloak of Feltroc
    588627781, // Bond of Sekris
    666883012, // Gauntlets of Nohr
    796914932, // Mask of Sekris
    845536715, // Vest of Feltroc
    1034660314, // Boots of Feltroc
    1242139836, // Plate of Nohr
    1256688732, // Mask of Feltroc
    1756558505, // Mask of Sekris
    1991039861, // Mask of Nohr
    2329031091, // Robes of Sekris
    2339720736, // Grips of Feltroc
    2369496221, // Plate of Nohr
    2537874394, // Boots of Sekris
    2597529070, // Greaves of Nohr
    2653039573, // Grips of Feltroc
    2976612200, // Vest of Feltroc
    2994007601, // Mark of Nohr
    3099636805, // Greaves of Nohr
    3181497704, // Robes of Sekris
    3359121706, // Mask of Nohr
    3364682867, // Gauntlets of Nohr
    3497220322, // Cloak of Feltroc
    3831484112, // Mark of Nohr
    3842934816, // Wraps of Sekris
    3964287245, // Wraps of Sekris
    4229161783, // Boots of Feltroc
  ],
  events: [
    116784191, // Solstice Boots (Renewed)
    140842223, // Solstice Mask (Drained)
    143299650, // Solstice Plate (Renewed)
    153144587, // Solstice Cloak (Drained)
    179654396, // Sublime Vest
    226436555, // Solstice Mask (Renewed)
    231432261, // Solstice Bond (Resplendent)
    234970842, // Solstice Boots (Resplendent)
    250513201, // Solstice Greaves (Resplendent)
    327680457, // Sublime Boots
    335763433, // Solstice Plate (Resplendent)
    346065606, // Solstice Cloak (Rekindled)
    350054538, // Sublime Strides
    391889347, // Solstice Robes (Drained)
    419435523, // Inaugural Revelry Grips
    425681240, // Acosmic
    450844637, // Solstice Robes (Majestic)
    464814870, // Sublime Greaves
    492834021, // Inaugural Revelry Hood
    495940989, // Avalanche
    503145555, // Sublime Gloves
    518930465, // Solstice Grasps (Rekindled)
    531005896, // Solstice Cloak (Resplendent)
    540653483, // Solstice Vest (Scorched)
    574167778, // Solstice Gauntlets (Drained)
    574790717, // Solstice Gloves (Drained)
    591672323, // Fortunate Star
    601948197, // Zephyr
    627596132, // Solstice Hood (Drained)
    677939288, // Solstice Helm (Scorched)
    689294985, // Jurassic Green
    721146704, // Solstice Mask (Rekindled)
    784499738, // Solstice Bond (Renewed)
    807693916, // Sublime Hood
    830497630, // Solstice Helm (Resplendent)
    929148730, // Solstice Vest (Drained)
    967650555, // Solstice Greaves (Scorched)
    1056992393, // Inaugural Revelry Plate
    1123433952, // Stay Frosty
    1141639721, // Solstice Gauntlets (Scorched)
    1183116657, // Glacioclasm
    1229961870, // Solstice Vest (Renewed)
    1273510836, // Inaugural Revelry Wraps
    1280894514, // Mechabre
    1288683596, // Solstice Plate (Majestic)
    1341471164, // Solstice Mask (Scorched)
    1361620030, // Solstice Mark (Scorched)
    1365491398, // Solstice Plate (Drained)
    1376763596, // Inaugural Revelry Robes
    1450633717, // Solstice Vest (Resplendent)
    1502692899, // Solstice Robes (Renewed)
    1510405477, // Solstice Helm (Majestic)
    1540031264, // Solstice Gloves (Resplendent)
    1548056407, // Solstice Cloak (Renewed)
    1556831535, // Inaugural Revelry Gauntlets
    1561249470, // Inaugural Revelry Boots
    1589318419, // Solstice Strides (Rekindled)
    1609141880, // Sublime Plate
    1649929380, // Solstice Mark (Resplendent)
    1651275175, // Solstice Helm (Renewed)
    1683482799, // Solstice Mark (Drained)
    1706764072, // Quilted Winter Mark
    1706874193, // Inaugural Revelry Greaves
    1752648948, // Sublime Sleeves
    1775707016, // Solstice Grasps (Majestic)
    1812385587, // Festive Winter Bond
    1845372864, // Albedo Wing
    1845978721, // Avalanche
    1862324869, // Solstice Boots (Majestic)
    1897528210, // Solstice Robes (Scorched)
    2079349511, // Sublime Helm
    2105409832, // Solstice Greaves (Renewed)
    2111111693, // Solstice Strides (Resplendent)
    2120905920, // Inaugural Revelry Cloak
    2127474099, // Solstice Gloves (Majestic)
    2150778206, // Solstice Gloves (Scorched)
    2155928170, // Solstice Mark (Rekindled)
    2156817213, // Solstice Cloak (Majestic)
    2223901117, // Allstar Vector
    2261046232, // Jurassic Green
    2287277682, // Solstice Robes (Rekindled)
    2291082292, // Solstice Gauntlets (Majestic)
    2328435454, // Inaugural Revelry Helm
    2337290000, // Solstice Bond (Majestic)
    2419100474, // Solstice Grasps (Renewed)
    2470583197, // Solstice Gloves (Renewed)
    2477028154, // Inaugural Revelry Mask
    2477980485, // Mechabre
    2492769187, // Solstice Bond (Scorched)
    2523388612, // Solstice Hood (Renewed)
    2543971899, // Sublime Mark
    2546370410, // Solstice Hood (Majestic)
    2578820926, // Solstice Greaves (Majestic)
    2603335652, // Jurassic Green
    2616697701, // Sublime Robes
    2618313500, // Solstice Greaves (Drained)
    2685001662, // Solstice Gloves (Rekindled)
    2696245301, // Solstice Grasps (Scorched)
    2720534902, // Solstice Grasps (Drained)
    2764769717, // Inaugural Revelry Strides
    2770157746, // Solstice Mask (Resplendent)
    2777913564, // Warm Winter Cloak
    2805101184, // Solstice Vest (Majestic)
    2812100428, // Stay Frosty
    2814093983, // Cold Front
    2824302184, // Solstice Robes (Resplendent)
    2837295684, // Inaugural Revelry Mark
    2869466318, // BrayTech Werewolf
    2877046370, // Solstice Strides (Majestic)
    2924095235, // Solstice Bond (Rekindled)
    2940416351, // Solstice Boots (Drained)
    2965080304, // Yeartide Apex
    2978747767, // Solstice Vest (Rekindled)
    2994721336, // Solstice Boots (Scorched)
    3015197581, // Solstice Gauntlets (Rekindled)
    3039687635, // Solstice Helm (Drained)
    3077367255, // Solstice Hood (Scorched)
    3104384024, // Solstice Boots (Rekindled)
    3159052337, // Solstice Mask (Majestic)
    3192336962, // Solstice Cloak (Scorched)
    3232831379, // Sublime Mask
    3236510875, // Solstice Grasps (Resplendent)
    3240434620, // Something New
    3329514528, // Sublime Gauntlets
    3400256755, // Zephyr
    3558681245, // BrayTech Werewolf
    3559361670, // The Title
    3573686365, // Glacioclasm
    3611487543, // Solstice Hood (Rekindled)
    3685996623, // Solstice Greaves (Rekindled)
    3748622249, // Solstice Hood (Resplendent)
    3809902215, // Sublime Cloak
    3829285960, // Horror Story
    3892841518, // Solstice Gauntlets (Renewed)
    3929403535, // Solstice Gauntlets (Resplendent)
    3932814032, // Solstice Strides (Drained)
    3943394479, // Solstice Plate (Scorched)
    3965417933, // Inaugural Revelry Vest
    3968560442, // Solstice Bond (Drained)
    3970040886, // Sublime Bond
    3977654524, // Festival Flight
    3987442049, // Solstice Mark (Majestic)
    4075522049, // Inaugural Revelry Bond
    4100029812, // Solstice Strides (Renewed)
    4128297107, // Solstice Mark (Renewed)
    4142792564, // Solstice Helm (Rekindled)
    4245469491, // Solstice Plate (Rekindled)
    4272367383, // Solstice Strides (Scorched)
  ],
  eververse: [
    80338527, // Flutter By
    138961800, // Helm of Optimacy
    163660481, // Bond of Optimacy
    167651268, // Crimson Passion
    269339124, // Dawning Hope
    599687980, // Purple Dawning Lanterns
    639457414, // Necrosis
    691914261, // Silver Dawning Lanterns
    706111909, // Hood of Optimacy
    710937567, // Legs of Optimacy
    921357268, // Winterhart Plate
    989291706, // Cloak of Optimacy
    1051903593, // Dawning Bauble Shell
    1126785375, // Great White
    1135293055, // Plate of Optimacy
    1290784012, // Winterhart Gauntlets
    1397284432, // Jasper Dawn Shell
    1445212020, // Arms of Optimacy
    1602334068, // Regent Redeemer
    1706764073, // Winterhart Mark
    1707587907, // Vest of Optimacy
    1732950654, // Legs of Optimacy
    1812385586, // Winterhart Bond
    1816495538, // Sweet Memories Shell
    1844125034, // Dawning Festiveness
    1936516278, // Winterhart Greaves
    1956273477, // Winterhart Gloves
    1984190529, // Magikon
    2112889975, // Crimson Valor
    2225903500, // Robes of Optimacy
    2303499975, // Winterhart Boots
    2378378507, // Legs of Optimacy
    2623660327, // Dawning Brilliance
    2640279229, // Arms of Optimacy
    2693084644, // Mask of Optimacy
    2717158440, // Winterhart Grips
    2760398988, // Winterhart Cover
    2777913565, // Winterhart Cloak
    2806805902, // Mark of Optimacy
    2828252061, // Winterhart Helm
    2998296658, // Ice Ball Effects
    3086696388, // Itsy-Bitsy Spider
    3161524490, // Rupture
    3168164098, // Yellow Dawning Lanterns
    3177119978, // Carmina Commencing
    3352566658, // Winterhart Strides
    3455566107, // Winterhart Robes
    3569791559, // Shimmering Iris
    3729709035, // Joyfire
    3781263385, // Arms of Optimacy
    3850655136, // Winterhart Vest
    3866715933, // Dawning Warmth
    3916428099, // Holochip Extractor
    3947596543, // Green Dawning Lanterns
    4059030097, // Winterhart Mask
  ],
  fwc: [
    680327840, // Simulator Greaves
    807866445, // Simulator Gloves
    1162875302, // Simulator Gauntlets
    1187431263, // Simulator Helm
    1355893732, // Simulator Vest
    1418921862, // Simulator Boots
    1478665487, // Simulator Legs
    1566612778, // Entanglement Bond
    1763431309, // Simulator Mask
    2401598772, // Simulator Hood
    2415993980, // Simulator Grips
    2524181305, // Entanglement Cloak
    3656154099, // Simulator Robes
    3671665226, // Simulator Plate
    3842448731, // Entanglement Mark
  ],
  gambit: [
    9767416, // Ancient Apocalypse Bond
    94425673, // Ancient Apocalypse Gloves
    127018032, // Ancient Apocalypse Grips
    191247558, // Ancient Apocalypse Plate
    191535001, // Ancient Apocalypse Greaves
    230878649, // Ancient Apocalypse Mask
    386367515, // Ancient Apocalypse Boots
    392058749, // Ancient Apocalypse Boots
    485653258, // Ancient Apocalypse Strides
    494475253, // Ossuary Boots
    509238959, // Ancient Apocalypse Mark
    628604416, // Ossuary Bond
    629787707, // Ancient Apocalypse Mask
    631191162, // Ossuary Cover
    759348512, // Ancient Apocalypse Mask
    787909455, // Ancient Apocalypse Robes
    887818405, // Ancient Apocalypse Robes
    978447246, // Ancient Apocalypse Gauntlets
    979782821, // Hinterland Cloak
    1013137701, // Ancient Apocalypse Hood
    1167444103, // Biosphere Explorer Mark
    1169857924, // Ancient Apocalypse Strides
    1188039652, // Ancient Apocalypse Gauntlets
    1193646249, // Ancient Apocalypse Boots
    1236746902, // Ancient Apocalypse Hood
    1237661249, // Ancient Apocalypse Plate
    1356064950, // Ancient Apocalypse Grips
    1359908066, // Ancient Apocalypse Gauntlets
    1381742107, // Biosphere Explorer Helm
    1488486721, // Ancient Apocalypse Bond
    1497354980, // Biosphere Explorer Greaves
    1548620661, // Ancient Apocalypse Cloak
    1741396519, // Ancient Apocalypse Vest
    1752237812, // Ancient Apocalypse Gloves
    1837817086, // Biosphere Explorer Plate
    2020166300, // Ancient Apocalypse Mark
    2039976446, // Ancient Apocalypse Boots
    2048762125, // Ossuary Robes
    2088829612, // Ancient Apocalypse Bond
    2130645994, // Ancient Apocalypse Grips
    2339694345, // Hinterland Cowl
    2402428483, // Ossuary Gloves
    2440840551, // Ancient Apocalypse Gloves
    2451538755, // Ancient Apocalypse Strides
    2459422430, // Ancient Apocalypse Bond
    2506514251, // Ancient Apocalypse Cloak
    2512196373, // Ancient Apocalypse Helm
    2518527196, // Ancient Apocalypse Plate
    2568447248, // Ancient Apocalypse Strides
    2620389105, // Ancient Apocalypse Grips
    2677967607, // Ancient Apocalypse Gauntlets
    2694124942, // Ancient Apocalypse Greaves
    2728668760, // Ancient Apocalypse Vest
    2841023690, // Biosphere Explorer Gauntlets
    2858060922, // Ancient Apocalypse Vest
    2881248566, // Ancient Apocalypse Cloak
    3031848199, // Ancient Apocalypse Helm
    3121010362, // Hinterland Strides
    3148195144, // Hinterland Vest
    3184912423, // Ancient Apocalypse Cloak
    3339632627, // Ancient Apocalypse Mark
    3404053788, // Ancient Apocalypse Greaves
    3486086024, // Ancient Apocalypse Greaves
    3537476911, // Ancient Apocalypse Mask
    3550729740, // Ancient Apocalypse Robes
    3595268459, // Ancient Apocalypse Gloves
    3664007718, // Ancient Apocalypse Helm
    3804360785, // Ancient Apocalypse Mark
    3825427923, // Ancient Apocalypse Helm
    3855285278, // Ancient Apocalypse Vest
    3925589496, // Ancient Apocalypse Hood
    4043189888, // Hinterland Grips
    4115739810, // Ancient Apocalypse Plate
    4188366993, // Ancient Apocalypse Robes
    4255727106, // Ancient Apocalypse Hood
  ],
  gambitprime: [
    95332289, // Notorious Collector Strides
    95332290, // Outlawed Collector Strides
    98700833, // Outlawed Reaper Cloak
    98700834, // Notorious Reaper Cloak
    130287073, // Notorious Sentry Gauntlets
    130287074, // Outlawed Sentry Gauntlets
    154180149, // Outlawed Sentry Cloak
    154180150, // Notorious Sentry Cloak
    223681332, // Notorious Reaper Helm
    223681335, // Outlawed Reaper Helm
    234582861, // Outlawed Reaper Mark
    234582862, // Notorious Reaper Mark
    264182640, // Outlawed Collector Grips
    264182643, // Notorious Collector Grips
    370332340, // Notorious Collector Cloak
    370332343, // Outlawed Collector Cloak
    420625860, // Outlawed Invader Plate
    420625863, // Notorious Invader Plate
    432797516, // Outlawed Collector Bond
    432797519, // Notorious Collector Bond
    563461320, // Outlawed Reaper Greaves
    563461323, // Notorious Reaper Greaves
    722344177, // Outlawed Reaper Gloves
    722344178, // Notorious Reaper Gloves
    759881004, // Outlawed Sentry Plate
    759881007, // Notorious Sentry Plate
    893169981, // Outlawed Invader Cloak
    893169982, // Notorious Invader Cloak
    975478397, // Outlawed Collector Helm
    975478398, // Notorious Collector Helm
    1039402696, // Notorious Reaper Boots
    1039402699, // Outlawed Reaper Boots
    1159077396, // Outlawed Reaper Strides
    1159077399, // Notorious Reaper Strides
    1208982392, // Outlawed Reaper Hood
    1208982395, // Notorious Reaper Hood
    1295793304, // Notorious Reaper Mask
    1295793307, // Outlawed Reaper Mask
    1386198149, // Notorious Reaper Gauntlets
    1386198150, // Outlawed Reaper Gauntlets
    1438999856, // Notorious Collector Boots
    1438999859, // Outlawed Collector Boots
    1477025072, // Outlawed Sentry Bond
    1477025075, // Notorious Sentry Bond
    1505642257, // Outlawed Collector Robes
    1505642258, // Notorious Collector Robes
    1920676413, // Notorious Invader Bond
    1920676414, // Outlawed Invader Bond
    1951201409, // Notorious Invader Hood
    1951201410, // Outlawed Invader Hood
    1979001652, // Outlawed Reaper Bond
    1979001655, // Notorious Reaper Bond
    1984789548, // Outlawed Reaper Vest
    1984789551, // Notorious Reaper Vest
    1989814421, // Notorious Invader Grips
    1989814422, // Outlawed Invader Grips
    2051266836, // Outlawed Sentry Greaves
    2051266839, // Notorious Sentry Greaves
    2187982744, // Notorious Sentry Helm
    2187982747, // Outlawed Sentry Helm
    2334120368, // Outlawed Reaper Plate
    2334120371, // Notorious Reaper Plate
    2336344261, // Outlawed Sentry Gloves
    2336344262, // Notorious Sentry Gloves
    2371932404, // Outlawed Collector Gauntlets
    2371932407, // Notorious Collector Gauntlets
    2565812704, // Outlawed Collector Hood
    2565812707, // Notorious Collector Hood
    2591049236, // Notorious Invader Robes
    2591049239, // Outlawed Invader Robes
    2593076932, // Notorious Invader Mask
    2593076935, // Outlawed Invader Mask
    2698109345, // Outlawed Collector Mask
    2698109346, // Notorious Collector Mask
    2710420856, // Outlawed Sentry Vest
    2710420859, // Notorious Sentry Vest
    2799932928, // Notorious Collector Mark
    2799932931, // Outlawed Collector Mark
    2976484617, // Notorious Invader Gauntlets
    2976484618, // Outlawed Invader Gauntlets
    3088740176, // Notorious Invader Gloves
    3088740179, // Outlawed Invader Gloves
    3166483968, // Outlawed Sentry Strides
    3166483971, // Notorious Sentry Strides
    3168759585, // Outlawed Sentry Mark
    3168759586, // Notorious Sentry Mark
    3220030412, // Notorious Sentry Mask
    3220030415, // Outlawed Sentry Mask
    3373994936, // Outlawed Invader Strides
    3373994939, // Notorious Invader Strides
    3403732217, // Outlawed Collector Gloves
    3403732218, // Notorious Collector Gloves
    3489978605, // Outlawed Invader Boots
    3489978606, // Notorious Invader Boots
    3525447589, // Notorious Collector Vest
    3525447590, // Outlawed Collector Vest
    3533064929, // Notorious Reaper Grips
    3533064930, // Outlawed Reaper Grips
    3583507225, // Outlawed Reaper Robes
    3583507226, // Notorious Reaper Robes
    3636943392, // Notorious Invader Helm
    3636943395, // Outlawed Invader Helm
    3660501108, // Outlawed Sentry Hood
    3660501111, // Notorious Sentry Hood
    3837542169, // Outlawed Invader Mark
    3837542170, // Notorious Invader Mark
    3948054485, // Notorious Collector Greaves
    3948054486, // Outlawed Collector Greaves
    3981071584, // Outlawed Invader Vest
    3981071587, // Notorious Invader Vest
    4020124605, // Outlawed Sentry Robes
    4020124606, // Notorious Sentry Robes
    4026665500, // Outlawed Invader Greaves
    4026665503, // Notorious Invader Greaves
    4060232809, // Notorious Collector Plate
    4060232810, // Outlawed Collector Plate
    4245233853, // Notorious Sentry Grips
    4245233854, // Outlawed Sentry Grips
    4266990316, // Notorious Sentry Boots
    4266990319, // Outlawed Sentry Boots
  ],
  garden: [
    11974904, // Greaves of Ascendancy
    281660259, // Temptation's Mark
    519078295, // Helm of Righteousness
    557676195, // Cowl of Righteousness
    1653741426, // Grips of Exaltation
    2015894615, // Gloves of Exaltation
    2054979724, // Strides of Ascendancy
    2320830625, // Robes of Transcendence
    3001934726, // Mask of Righteousness
    3103335676, // Temptation's Bond
    3388655311, // Tyranny of Heaven
    3549177695, // Cloak of Temptation
    3824429433, // Boots of Ascendancy
    3887559710, // Gauntlets of Exaltation
    3939809874, // Plate of Transcendence
    4177973942, // Vest of Transcendence
  ],
  gardenofsalvation: [
    11974904, // Greaves of Ascendancy
    281660259, // Temptation's Mark
    519078295, // Helm of Righteousness
    557676195, // Cowl of Righteousness
    1653741426, // Grips of Exaltation
    2015894615, // Gloves of Exaltation
    2054979724, // Strides of Ascendancy
    2320830625, // Robes of Transcendence
    3001934726, // Mask of Righteousness
    3103335676, // Temptation's Bond
    3388655311, // Tyranny of Heaven
    3549177695, // Cloak of Temptation
    3824429433, // Boots of Ascendancy
    3887559710, // Gauntlets of Exaltation
    3939809874, // Plate of Transcendence
    4177973942, // Vest of Transcendence
  ],
  ghostsofthedeep: [
    51786498, // Vest of the Taken King
    638836294, // Plate of the Taken King
    767306222, // Grasps of the Taken King
    837865641, // Vestment of the Taken King
    956827695, // Mark of the Taken King
    1664757090, // Gauntlets of the Taken King
    1913823311, // Gloves of the Taken King
    2488323569, // Boots of the Taken King
    2618168932, // Bond of the Taken King
    2643850526, // Hood of the Taken King
    2760833884, // Cold Comfort
    2820604007, // Mask of the Taken King
    2850384360, // Strides of the Taken King
    3570749779, // Cloak of the Taken King
    3708902812, // Greaves of the Taken King
    4130276947, // Helm of the Taken King
  ],
  gos: [
    11974904, // Greaves of Ascendancy
    281660259, // Temptation's Mark
    519078295, // Helm of Righteousness
    557676195, // Cowl of Righteousness
    1653741426, // Grips of Exaltation
    2015894615, // Gloves of Exaltation
    2054979724, // Strides of Ascendancy
    2320830625, // Robes of Transcendence
    3001934726, // Mask of Righteousness
    3103335676, // Temptation's Bond
    3388655311, // Tyranny of Heaven
    3549177695, // Cloak of Temptation
    3824429433, // Boots of Ascendancy
    3887559710, // Gauntlets of Exaltation
    3939809874, // Plate of Transcendence
    4177973942, // Vest of Transcendence
  ],
  gotd: [
    51786498, // Vest of the Taken King
    638836294, // Plate of the Taken King
    767306222, // Grasps of the Taken King
    837865641, // Vestment of the Taken King
    956827695, // Mark of the Taken King
    1664757090, // Gauntlets of the Taken King
    1913823311, // Gloves of the Taken King
    2488323569, // Boots of the Taken King
    2618168932, // Bond of the Taken King
    2643850526, // Hood of the Taken King
    2760833884, // Cold Comfort
    2820604007, // Mask of the Taken King
    2850384360, // Strides of the Taken King
    3570749779, // Cloak of the Taken King
    3708902812, // Greaves of the Taken King
    4130276947, // Helm of the Taken King
  ],
  grasp: [
    286271818, // Twisting Echo Cloak
    399065241, // Descending Echo Greaves
    587312237, // Twisting Echo Grips
    833653807, // Twisting Echo Strides
    1756483796, // Twisting Echo Mask
    1951355667, // Twisting Echo Vest
    2244604734, // Corrupting Echo Gloves
    2663987096, // Corrupting Echo Boots
    2885497847, // Descending Echo Gauntlets
    3048458482, // Corrupting Echo Robes
    3171090615, // Corrupting Echo Cover
    3267969345, // Descending Echo Cage
    3685276035, // Corrupting Echo Bond
    3871537958, // Descending Echo Helm
    4050474396, // Descending Echo Mark
  ],
  haunted: [
    3864896927, // Nightmare Harvester
  ],
  heresy: [
    267671509, // Skull of the Flain
    571745874, // Hooks of the Flain
    601574723, // Adamantite (Adept)
    608948636, // Carapace of the Flain
    615373993, // Eyes Unveiled
    704410186, // Psychopomp (Adept)
    768610585, // Watchful Eye
    861521336, // Afterlight (Adept)
    874160718, // Claws of the Flain
    1274101249, // Mask of the Flain
    1834313033, // Afterlight
    1930656621, // Husk's Cloak
    2112020760, // Grasps of the Flain
    2299285295, // Adornment of the Flain
    2319342865, // Attendant's Mark
    2501377328, // Division (Adept)
    2501618648, // Visage of the Flain
    2578940720, // Scales of the Flain
    2671849376, // Refusal of the Call
    2755584425, // Refusal of the Call (Adept)
    2791329915, // Talons of the Flain
    2856225832, // Watchful Eye (Adept)
    2965319081, // Reach of the Flain
    2987244302, // Adamantite
    2992463569, // Division
    3054597646, // Abyssal Edge (Adept)
    3238482084, // Grips of the Flain
    3417731926, // Anamnesis
    3840794631, // Psychopomp
    3877448149, // Mirror Imago
    3949253499, // Anamnesis (Adept)
    4012478142, // Weaver's Bond
    4116546788, // Mirror Imago (Adept)
    4173311704, // Eyes Unveiled (Adept)
    4221591387, // Abyssal Edge
  ],
  ikora: [
    89175653, // Noble Constant Mark
    185326970, // Noble Constant Type 2
    385045066, // Frumious Vest
    555828571, // Frumious Cloak
    662797277, // Frumious Cloak
    868792277, // Ego Talon IV
    1490387264, // Noble Constant Type 2
    1532009197, // Ego Talon IV
    1698434490, // Ego Talon Bond
    1735538848, // Frumious Vest
    1842727357, // Ego Talon IV
    1895532772, // Ego Talon IV
    1940451444, // Noble Constant Type 2
    2416730691, // Ego Talon IV
    2615512594, // Ego Talon IV
    2682045448, // Noble Constant Type 2
    2684281417, // Noble Constant Mark
    2688111404, // Noble Constant Type 2
    3081969019, // Ego Talon IV
    3511221544, // Frumious Grips
    3741528736, // Frumious Strides
    3758301014, // Noble Constant Type 2
    4081859017, // Noble Constant Type 2
    4146629762, // Frumious Strides
    4208352991, // Ego Talon IV
    4224076198, // Frumious Grips
    4225579453, // Noble Constant Type 2
    4285708584, // Ego Talon Bond
  ],
  intothelight: [
    211732170, // Hammerhead
    243425374, // Falling Guillotine
    570866107, // Succession
    2228325504, // Edge Transit
    2499720827, // Midnight Coup
    3757612024, // Luna's Howl
    3851176026, // Elsie's Rifle
  ],
  io: [
    886128573, // Mindbreaker Boots
    2317191363, // Mindbreaker Boots
    2913284400, // Mindbreaker Boots
  ],
  ironbanner: [
    21320325, // Bond of Remembrance
    63725907, // Iron Remembrance Plate
    75550387, // Iron Truage Legs
    92135663, // Iron Remembrance Vest
    124696333, // Iron Truage Vestments
    130221063, // Iron Truage Vestments
    131359121, // Iron Fellowship Casque
    142417051, // Iron Fellowship Casque
    167461728, // Iron Remembrance Gloves
    197164672, // Iron Truage Hood
    198946996, // Iron Symmachy Helm
    219816655, // Iron Fellowship Bond
    228784708, // Iron Symmachy Robes
    258029924, // Iron Fellowship Strides
    279785447, // Iron Remembrance Vest
    287471683, // Iron Truage Gloves
    344804890, // Iron Fellowship Cloak
    423204919, // Iron Truage Hood
    425007249, // Iron Remembrance Plate
    473526496, // Iron Fellowship Vest
    479917491, // Mantle of Efrideet
    481390023, // Iron Truage Casque
    485774636, // Iron Remembrance Helm
    487361141, // Gunnora's Axe
    500363457, // Iron Symmachy Grips
    510020159, // Iron Fellowship Strides
    511170376, // Iron Truage Boots
    540880995, // Dark Decider
    559176540, // Iron Symmachy Gloves
    561808153, // Mantle of Efrideet
    691332172, // Iron Truage Gauntlets
    706104224, // Iron Truage Gauntlets
    713182381, // Iron Remembrance Gauntlets
    738836759, // Iron Truage Vestments
    738938985, // Radegast's Iron Sash
    739655237, // Iron Truage Helm
    741704251, // Iron Remembrance Plate
    744156528, // Iron Symmachy Mask
    770140877, // Iron Will Greaves
    808693674, // Iron Symmachy Mark
    829330711, // Peacebond
    831464034, // Iron Truage Vest
    863444264, // Iron Will Gloves
    888872889, // Point of the Stag
    892360677, // Iron Fellowship Helm
    935677805, // Iron Truage Casque
    957732971, // Iron Symmachy Grips
    959040145, // Iron Symmachy Bond
    995283190, // Cloak of Remembrance
    1015625830, // Iron Truage Boots
    1027482647, // Iron Fellowship Boots
    1058936857, // Iron Will Vest
    1062998051, // Iron Fellowship Vest
    1084553865, // Iron Symmachy Greaves
    1098138990, // Iron Will Mask
    1105558158, // Iron Truage Helm
    1127757814, // Iron Symmachy Helm
    1161561386, // The Guiding Sight
    1164755828, // Iron Fellowship Bond
    1166260237, // Iron Truage Vestments
    1173846338, // Iron Fellowship Bond
    1181560527, // Iron Truage Vest
    1233689371, // Iron Remembrance Hood
    1234228360, // Iron Will Mark
    1245456047, // Iron Fellowship Gauntlets
    1279731468, // Iron Symmachy Mark
    1311649814, // Timur's Iron Bond
    1313089081, // Iron Truage Plate
    1313767877, // Radegast's Iron Sash
    1337167606, // Iron Truage Greaves
    1339294334, // Cloak of Remembrance
    1342036510, // Iron Truage Greaves
    1349302244, // Iron Remembrance Legs
    1395498705, // Iron Fellowship Greaves
    1425558127, // Iron Remembrance Greaves
    1438648985, // Iron Symmachy Bond
    1452894389, // Mantle of Efrideet
    1465485698, // Iron Fellowship Gloves
    1469050017, // Iron Will Boots
    1476572353, // Iron Truage Greaves
    1478755348, // Iron Truage Gauntlets
    1496224967, // Iron Truage Casque
    1498852482, // Iron Will Steps
    1526005320, // Iron Truage Boots
    1532276803, // Allied Demand
    1570751539, // Iron Symmachy Strides
    1601698634, // Iron Fellowship Grips
    1604601714, // Iron Truage Vestments
    1618191618, // Iron Symmachy Mask
    1631733639, // Bond of Remembrance
    1631922345, // Iron Remembrance Greaves
    1673037492, // Iron Fellowship Gauntlets
    1675022998, // Iron Remembrance Helm
    1717896437, // Iron Truage Legs
    1764868900, // Riiswalker
    1804445917, // Iron Truage Helm
    1822989604, // Iron Symmachy Gloves
    1854612346, // Iron Truage Hood
    1876007169, // Iron Fellowship Mark
    1882457108, // Iron Remembrance Helm
    1889355043, // Iron Truage Legs
    1891964978, // Iron Fellowship Greaves
    1895324274, // Iron Will Helm
    1944853984, // Iron Remembrance Casque
    1960776126, // Iron Fellowship Greaves
    1990315366, // Iron Symmachy Cloak
    1999697514, // The Wizened Rebuke
    2017059966, // Iron Fellowship Helm
    2049490557, // Iron Symmachy Strides
    2054377692, // Iron Truage Grips
    2055774222, // Iron Fellowship Hood
    2058205265, // Iron Truage Gloves
    2083136519, // Iron Fellowship Cloak
    2189073092, // Lethal Abundance
    2205315921, // Iron Will Hood
    2234855160, // Iron Symmachy Cloak
    2241419267, // Timur's Iron Bond
    2266122060, // Iron Truage Gauntlets
    2274205961, // Iron Fellowship Plate
    2302106622, // Iron Remembrance Vestments
    2310625418, // Mark of Remembrance
    2320100699, // Iron Will Gauntlets
    2331748167, // Iron Symmachy Gauntlets
    2340483067, // Iron Remembrance Hood
    2391553724, // Iron Fellowship Hood
    2414679508, // Iron Will Cloak
    2426788417, // Iron Fellowship Boots
    2455992644, // Iron Remembrance Legs
    2488587246, // The Hero's Burden
    2500327265, // Radegast's Iron Sash
    2536633781, // Iron Will Plate
    2547799775, // Iron Will Sleeves
    2555322239, // Iron Truage Gauntlets
    2589114445, // Iron Fellowship Mark
    2614190248, // Iron Remembrance Vestments
    2620437164, // Mark of Remembrance
    2627255028, // Radegast's Iron Sash
    2674485749, // Iron Truage Legs
    2692970954, // Iron Remembrance Gloves
    2723059534, // Iron Truage Grips
    2753509502, // Iron Fellowship Vest
    2758933481, // Iron Remembrance Hood
    2811201658, // Iron Truage Hood
    2817130155, // Iron Fellowship Robes
    2845071512, // Iron Remembrance Casque
    2850783764, // Iron Truage Plate
    2853073502, // Mantle of Efrideet
    2863819165, // Iron Fellowship Grips
    2867156198, // Timur's Iron Bond
    2879116647, // Iron Remembrance Gauntlets
    2885394189, // Iron Remembrance Strides
    2898234995, // Iron Symmachy Plate
    2900181965, // Iron Symmachy Gauntlets
    2911957494, // Iron Truage Greaves
    2914695209, // Iron Truage Helm
    2916624580, // Iron Fellowship Casque
    2999505920, // Timur's Iron Bond
    3018777825, // Iron Fellowship Helm
    3042878056, // Iron Fellowship Grips
    3055410141, // Iron Will Bond
    3057399960, // Iron Truage Vest
    3112906149, // Iron Symmachy Vest
    3115791898, // Iron Remembrance Legs
    3147146325, // Iron Symmachy Hood
    3169616514, // Bite of the Fox
    3292445816, // Iron Truage Casque
    3300129601, // Iron Truage Gloves
    3308875113, // Iron Remembrance Grips
    3329206472, // Cloak of Remembrance
    3345886183, // Bond of Remembrance
    3369424240, // Iron Truage Grips
    3379235805, // Iron Truage Helm
    3420845681, // Iron Symmachy Plate
    3472216012, // Iron Fellowship Plate
    3505538303, // Iron Fellowship Gloves
    3543613212, // Iron Symmachy Robes
    3543922672, // Iron Truage Hood
    3544440242, // Iron Remembrance Casque
    3551208252, // Iron Fellowship Boots
    3570981007, // Iron Symmachy Greaves
    3600816955, // Iron Remembrance Strides
    3625849667, // Iron Truage Gloves
    3646911172, // Iron Truage Vest
    3661959184, // Iron Fellowship Plate
    3678620931, // Iron Remembrance Strides
    3686482762, // Iron Truage Boots
    3696011098, // Iron Truage Greaves
    3735443949, // Iron Symmachy Hood
    3737894478, // Iron Truage Grips
    3746327861, // Iron Fellowship Gloves
    3753635534, // Iron Symmachy Boots
    3756249289, // Iron Truage Grips
    3791686334, // Iron Truage Gloves
    3799661482, // Iron Remembrance Gloves
    3815391974, // Iron Symmachy Boots
    3817948370, // Mark of Remembrance
    3818295475, // Mantle of Efrideet
    3847368113, // Iron Remembrance Grips
    3856062457, // Iron Truage Casque
    3856697336, // Iron Fellowship Gauntlets
    3865618708, // Iron Truage Plate
    3899385447, // Iron Remembrance Greaves
    3906637800, // Iron Truage Plate
    3972479219, // Iron Fellowship Hood
    3974682334, // Iron Remembrance Vestments
    3976616421, // Iron Remembrance Gauntlets
    4009352833, // Roar of the Bear
    4010793371, // Iron Remembrance Grips
    4019071337, // Radegast's Iron Sash
    4041069824, // Timur's Iron Bond
    4048191131, // Iron Truage Boots
    4054509252, // Iron Fellowship Mark
    4078529821, // Iron Fellowship Cloak
    4096639276, // Iron Truage Plate
    4128151712, // Iron Will Vestments
    4144217282, // Iron Fellowship Strides
    4145557177, // Iron Fellowship Robes
    4156963223, // Iron Symmachy Vest
    4169842018, // Iron Truage Vest
    4196689510, // Iron Fellowship Robes
    4211068696, // Iron Truage Legs
    4248834293, // Iron Remembrance Vest
  ],
  itl: [
    211732170, // Hammerhead
    243425374, // Falling Guillotine
    570866107, // Succession
    2228325504, // Edge Transit
    2499720827, // Midnight Coup
    3757612024, // Luna's Howl
    3851176026, // Elsie's Rifle
  ],
  lastwish: [
    4968701, // Greaves of the Great Hunt
    16387641, // Mark of the Great Hunt
    49280456, // Gloves of the Great Hunt
    65929376, // Gauntlets of the Great Hunt
    70083888, // Nation of Beasts
    146275556, // Vest of the Great Hunt
    196235132, // Grips of the Great Hunt
    424291879, // Age-Old Bond
    501329015, // Chattering Bone
    576683388, // Gauntlets of the Great Hunt
    726265506, // Boots of the Great Hunt
    776723133, // Robes of the Great Hunt
    778784376, // Mark of the Great Hunt
    821841934, // Bond of the Great Hunt
    972689703, // Vest of the Great Hunt
    1021341893, // Mark of the Great Hunt
    1127835600, // Grips of the Great Hunt
    1190016345, // Mask of the Great Hunt
    1195800715, // Boots of the Great Hunt
    1258342944, // Mask of the Great Hunt
    1314563129, // Cloak of the Great Hunt
    1432728945, // Hood of the Great Hunt
    1444894250, // Strides of the Great Hunt
    1477271933, // Bond of the Great Hunt
    1646520469, // Cloak of the Great Hunt
    1656835365, // Plate of the Great Hunt
    1851777734, // Apex Predator
    2112541750, // Cloak of the Great Hunt
    2274520361, // Helm of the Great Hunt
    2280287728, // Bond of the Great Hunt
    2550116544, // Robes of the Great Hunt
    2598685593, // Gloves of the Great Hunt
    2868042232, // Vest of the Great Hunt
    2884596447, // The Supremacy
    2950533187, // Strides of the Great Hunt
    3055836250, // Greaves of the Great Hunt
    3119383537, // Grips of the Great Hunt
    3143067364, // Plate of the Great Hunt
    3208178411, // Gauntlets of the Great Hunt
    3227674085, // Boots of the Great Hunt
    3251351304, // Hood of the Great Hunt
    3445296383, // Robes of the Great Hunt
    3445582154, // Hood of the Great Hunt
    3492720019, // Gloves of the Great Hunt
    3494130310, // Strides of the Great Hunt
    3591141932, // Techeun Force
    3614211816, // Plate of the Great Hunt
    3838639757, // Mask of the Great Hunt
    3868637058, // Helm of the Great Hunt
    3874578566, // Greaves of the Great Hunt
    3885259140, // Transfiguration
    4219088013, // Helm of the Great Hunt
  ],
  legendaryengram: [
    24598504, // Red Moon Phantom Vest
    25091086, // Tangled Web Cloak
    32806262, // Cloak of Five Full Moons
    42219189, // Tangled Web Gauntlets
    73720713, // High-Minded Complex
    107232578, // Tangled Web Gauntlets
    107582877, // Kerak Type 2
    130772858, // Tangled Web Vest
    133227345, // Kerak Type 2
    144651852, // Prodigal Mask
    155832748, // Icarus Drifter Mask
    160388292, // Kerak Type 2
    265279665, // Clandestine Maneuvers
    269552461, // Road Complex AA1
    308026950, // Road Complex AA1
    311394919, // Insight Unyielding Greaves
    316000947, // Dead End Cure 2.1
    339438127, // High-Minded Complex
    362404956, // Terra Concord Plate
    369384485, // Insight Rover Vest
    373203219, // Philomath Bond
    388625893, // Insight Unyielding Gauntlets
    410671183, // High-Minded Complex
    417345678, // Thorium Holt Gloves
    432525353, // Red Moon Phantom Mask
    433294875, // Devastation Complex
    434243995, // Hodiocentrist Bond
    474076509, // Errant Knight 1.0
    489114030, // Philomath Gloves
    489480785, // High-Minded Complex
    489743173, // Insight Unyielding Gauntlets
    493299171, // Errant Knight 1.0
    494682309, // Massyrian's Draw
    532728591, // Thorium Holt Gloves
    537272242, // Tangled Web Boots
    545134223, // Tangled Web Mark
    548907748, // Devastation Complex
    553373026, // Tangled Web Hood
    554000115, // Thorium Holt Bond
    597618504, // Insight Vikti Hood
    629469344, // Heiro Camo
    629482101, // Dead End Cure 2.1
    633160551, // Insight Rover Vest
    635809934, // Terra Concord Helm
    639670612, // Mimetic Savior Plate
    655964556, // Mimetic Savior Gauntlets
    683173058, // Philomath Robes
    690335398, // Terra Concord Helm
    695071581, // Tesseract Trace IV
    731888972, // Insight Vikti Robes
    737010724, // Thorium Holt Bond
    836969671, // Insight Unyielding Greaves
    854373147, // Insight Unyielding Plate
    875215126, // Prodigal Mark
    880368054, // Tangled Web Grips
    881579413, // Terra Concord Helm
    919186882, // Tangled Web Mark
    922218300, // Road Complex AA1
    966777042, // Anti-Hero Victory
    974507844, // Insight Rover Grips
    983115833, // Terra Concord Plate
    993844472, // High-Minded Complex
    1006824129, // Terra Concord Greaves
    1020198891, // Insight Rover Grips
    1024867629, // Errant Knight 1.0
    1028913028, // Tesseract Trace IV
    1034149520, // Tangled Web Robes
    1063507982, // Terra Concord Greaves
    1088960547, // Prodigal Greaves
    1111042046, // High-Minded Complex
    1127029635, // Insight Rover Boots
    1148805553, // Thorium Holt Boots
    1153347999, // Icarus Drifter Cape
    1192751404, // Insight Unyielding Helm
    1195298951, // Be Thy Champion
    1213841242, // Red Moon Phantom Steps
    1257810769, // Prodigal Gauntlets
    1260134370, // Devastation Complex
    1266060945, // Prodigal Mark
    1293868684, // Insight Unyielding Helm
    1295776817, // Insight Rover Grips
    1301696822, // Mimetic Savior Greaves
    1330107298, // Thorium Holt Robes
    1330542168, // Tangled Web Bond
    1348658294, // Clandestine Maneuvers
    1364856221, // Retro-Grade TG2
    1367655773, // Tangled Web Boots
    1399263478, // Icarus Drifter Vest
    1415533220, // Road Complex AA1
    1425077417, // Mimetic Savior Mark
    1429424420, // Prodigal Gauntlets
    1432831619, // Red Moon Phantom Steps
    1432969759, // Mimetic Savior Greaves
    1457647945, // High-Minded Complex
    1512829977, // Terra Concord Greaves
    1513486336, // Road Complex AA1
    1548943654, // Tesseract Trace IV
    1553407343, // Prodigal Robes
    1598372079, // Retro-Grade TG2
    1601578801, // Red Moon Phantom Grips
    1618341271, // Tangled Web Greaves
    1648238545, // Terra Concord Mark
    1655109893, // Tesseract Trace IV
    1664085089, // Tangled Web Hood
    1664611474, // Heiro Camo
    1680657538, // Insight Rover Mask
    1693706589, // Prodigal Cloak
    1726695877, // Cloak of Five Full Moons
    1728789982, // Thorium Holt Hood
    1740873035, // Icarus Drifter Grips
    1742735530, // Road Complex AA1
    1749589787, // High-Minded Complex
    1761136389, // Errant Knight 1.0
    1772639961, // Hodiocentrist Bond
    1810399711, // Philomath Bond
    1847870034, // Icarus Drifter Cape
    1854024004, // Be Thy Cipher
    1865671934, // Devastation Complex
    1892576458, // Devastation Complex
    1893349933, // Tesseract Trace IV
    1904199788, // Mark of the Unassailable
    1920259123, // Tesseract Trace IV
    1954457094, // Road Complex AA1
    1964977914, // Mimetic Savior Mark
    1978110490, // Mark of the Unassailable
    1998314509, // Dead End Cure 2.1
    2012084760, // Prodigal Hood
    2020589887, // Road Complex AA1
    2026285619, // Errant Knight 1.0
    2048751167, // Kerak Type 2
    2082184158, // Be Thy Cipher
    2085574015, // Terra Concord Fists
    2092750352, // Tangled Web Strides
    2111956477, // Insight Rover Boots
    2112821379, // Insight Unyielding Helm
    2148295091, // Tangled Web Helm
    2151378428, // Tangled Web Greaves
    2159363321, // Be Thy Guide
    2173858802, // Prodigal Cloak
    2185500219, // Insight Unyielding Plate
    2193432605, // Mimetic Savior Helm
    2205604183, // Dead End Cure 2.1
    2206284939, // Tangled Web Strides
    2265859909, // Retro-Grade TG2
    2297281780, // Terra Concord Mark
    2298664693, // Insight Rover Mask
    2332398934, // Kerak Type 2
    2339155434, // Tesseract Trace IV
    2360521872, // A Cloak Called Home
    2364041279, // Insight Vikti Robes
    2379553211, // Be Thy Guide
    2402435619, // Philomath Cover
    2414278933, // Errant Knight 1.0
    2439195958, // Philomath Robes
    2442805346, // Icarus Drifter Mask
    2445181930, // Errant Knight 1.0
    2454861732, // Prodigal Robes
    2470746631, // Thorium Holt Hood
    2475888361, // Prodigal Gloves
    2478301019, // Insight Vikti Hood
    2502004600, // Tangled Web Gloves
    2518901664, // Red Moon Phantom Grips
    2521426922, // Far Gone Hood
    2525344810, // Retro-Grade TG2
    2530905971, // Retro-Grade TG2
    2542514983, // Philomath Cover
    2546015644, // Tesseract Trace IV
    2550994842, // Errant Knight 1.0
    2561056920, // Retro-Grade TG2
    2562470699, // Tangled Web Plate
    2562555736, // Icarus Drifter Cape
    2567710435, // Icarus Drifter Mask
    2581516944, // Hodiocentrist Bond
    2629014079, // Anti-Hero Victory
    2648545535, // Tangled Web Vest
    2669113551, // Dead End Cure 2.1
    2674524165, // Tangled Web Robes
    2696303651, // Kerak Type 2
    2713755753, // Kerak Type 2
    2728535008, // Tesseract Trace IV
    2734010957, // Prodigal Hood
    2753581141, // Prodigal Helm
    2762426792, // Prodigal Grasps
    2766448160, // Prodigal Vest
    2767830203, // Prodigal Steps
    2770578349, // Massyrian's Draw
    2772485446, // Prodigal Steps
    2791527489, // Heiro Camo
    2800566014, // Prodigal Bond
    2808379196, // Insight Rover Vest
    2811180959, // Tesseract Trace IV
    2819613314, // Far Gone Hood
    2826844112, // Retro-Grade Mark
    2837138379, // Insight Vikti Boots
    2838060329, // Heiro Camo
    2845530750, // Retro-Grade Mark
    2905153902, // Insight Rover Boots
    2905154661, // Insight Vikti Hood
    2924984456, // Thorium Holt Boots
    2932121030, // Devastation Complex
    2982412348, // Tangled Web Helm
    2996649640, // Philomath Boots
    3018268196, // Insight Vikti Boots
    3024860521, // Retro-Grade TG2
    3061780015, // Tangled Web Mask
    3066154883, // Mimetic Savior Plate
    3066593211, // Icarus Drifter Vest
    3087552232, // Heiro Camo
    3125909492, // Dead End Cure 2.1
    3169402598, // Tesseract Trace IV
    3198691833, // Prodigal Bond
    3239215026, // Icarus Drifter Grips
    3250112431, // Be Thy Champion
    3250360146, // Insight Unyielding Gauntlets
    3257088093, // Icarus Drifter Legs
    3291075521, // Terra Concord Plate
    3299386902, // Insight Unyielding Plate
    3304280092, // Devastation Complex
    3316802363, // Retro-Grade TG2
    3360070350, // Prodigal Greaves
    3386676796, // Prodigal Gloves
    3397835010, // Prodigal Strides
    3403784957, // Mimetic Savior Gauntlets
    3430647425, // Synaptic Construct
    3433746208, // A Cloak Called Home
    3434158555, // Prodigal Vest
    3498500850, // Philomath Gloves
    3506159922, // Anti-Hero Victory
    3516789127, // Prodigal Strides
    3527995388, // Dead End Cure 2.1
    3536492583, // Kerak Type 2
    3569443559, // Icarus Drifter Legs
    3593916933, // Prodigal Grasps
    3609169817, // Tangled Web Grips
    3611199822, // Synaptic Construct
    3612275815, // Red Moon Phantom Vest
    3619376218, // Heiro Camo
    3629447000, // Heiro Camo
    3646674533, // Icarus Drifter Grips
    3651598572, // Insight Unyielding Greaves
    3685831476, // Insight Vikti Gloves
    3688229984, // Insight Rover Mask
    3691737472, // Prodigal Helm
    3717812073, // Thorium Holt Robes
    3725654227, // Devastation Complex
    3786300792, // Clandestine Maneuvers
    3839471140, // Mimetic Savior Helm
    3850634012, // Prodigal Cuirass
    3852389988, // Terra Concord Fists
    3884999792, // Heiro Camo
    3899739148, // Philomath Boots
    3906537733, // Icarus Drifter Vest
    3920228039, // Synaptic Construct
    3973570110, // Insight Vikti Boots
    3979056138, // Insight Vikti Gloves
    3988753671, // Prodigal Cuirass
    3994031968, // Red Moon Phantom Mask
    3999262583, // Terra Concord Fists
    4064910796, // Icarus Drifter Legs
    4073580572, // Terra Concord Mark
    4074193483, // Tangled Web Cloak
    4079913195, // Dead End Cure 2.1
    4092393610, // Tesseract Trace IV
    4097652774, // Tangled Web Plate
    4104298449, // Prodigal Mask
    4146408011, // Tangled Web Gloves
    4166246718, // Insight Vikti Robes
    4239920089, // Insight Vikti Gloves
    4256272077, // Tangled Web Bond
    4261835528, // Tangled Web Mask
  ],
  leviathan: [
    30962015, // Boots of the Ace-Defiant
    64543268, // Boots of the Emperor's Minister
    64543269, // Boots of the Fulminator
    288406317, // Greaves of Rull
    311429765, // Mark of the Emperor's Champion
    325434398, // Vest of the Ace-Defiant
    325434399, // Vest of the Emperor's Agent
    336656483, // Boots of the Emperor's Minister
    407863747, // Vest of the Ace-Defiant
    455108040, // Helm of the Emperor's Champion
    455108041, // Mask of Rull
    574137192, // Shadow's Mark
    581908796, // Bond of the Emperor's Minister
    608074492, // Robes of the Emperor's Minister
    608074493, // Robes of the Fulminator
    618662448, // Headpiece of the Emperor's Minister
    641933203, // Mask of the Emperor's Agent
    748485514, // Mask of the Fulminator
    748485515, // Headpiece of the Emperor's Minister
    754149842, // Wraps of the Emperor's Minister
    754149843, // Wraps of the Fulminator
    853543290, // Greaves of Rull
    853543291, // Greaves of the Emperor's Champion
    917591018, // Grips of the Ace-Defiant
    917591019, // Gloves of the Emperor's Agent
    1108389626, // Gloves of the Emperor's Agent
    1230192769, // Robes of the Emperor's Minister
    1354679721, // Cloak of the Emperor's Agent
    1390282760, // Chassis of Rull
    1390282761, // Cuirass of the Emperor's Champion
    1413589586, // Mask of Rull
    1876645653, // Chassis of Rull
    1879942843, // Gauntlets of Rull
    1960303677, // Grips of the Ace-Defiant
    2013109092, // Helm of the Ace-Defiant
    2070062384, // Shadow's Bond
    2070062385, // Bond of the Emperor's Minister
    2158603584, // Gauntlets of Rull
    2158603585, // Gauntlets of the Emperor's Champion
    2183861870, // Gauntlets of the Emperor's Champion
    2193494688, // Boots of the Fulminator
    2232730708, // Vest of the Emperor's Agent
    2676042150, // Wraps of the Fulminator
    2700598111, // Mask of the Fulminator
    2758465168, // Greaves of the Emperor's Champion
    2913992255, // Helm of the Emperor's Champion
    3092380260, // Mark of the Emperor's Champion
    3092380261, // Shadow's Mark
    3292127944, // Cuirass of the Emperor's Champion
    3530284425, // Wraps of the Emperor's Minister
    3592548938, // Robes of the Fulminator
    3711700026, // Mask of the Emperor's Agent
    3711700027, // Helm of the Ace-Defiant
    3763332443, // Shadow's Bond
    3853397100, // Boots of the Emperor's Agent
    3950028838, // Cloak of the Emperor's Agent
    3950028839, // Shadow's Cloak
    3984534842, // Shadow's Cloak
    4251770244, // Boots of the Ace-Defiant
    4251770245, // Boots of the Emperor's Agent
  ],
  limited: [
    1952218242, // Sequence Flourish
    2683682447, // Traitor's Fate
  ],
  lostsectors: [
    322173891, // Mask of Fealty
    1188437342, // Blastwave Striders
    4060793397, // Rime-coat Raiment
  ],
  lw: [
    4968701, // Greaves of the Great Hunt
    16387641, // Mark of the Great Hunt
    49280456, // Gloves of the Great Hunt
    65929376, // Gauntlets of the Great Hunt
    70083888, // Nation of Beasts
    146275556, // Vest of the Great Hunt
    196235132, // Grips of the Great Hunt
    424291879, // Age-Old Bond
    501329015, // Chattering Bone
    576683388, // Gauntlets of the Great Hunt
    726265506, // Boots of the Great Hunt
    776723133, // Robes of the Great Hunt
    778784376, // Mark of the Great Hunt
    821841934, // Bond of the Great Hunt
    972689703, // Vest of the Great Hunt
    1021341893, // Mark of the Great Hunt
    1127835600, // Grips of the Great Hunt
    1190016345, // Mask of the Great Hunt
    1195800715, // Boots of the Great Hunt
    1258342944, // Mask of the Great Hunt
    1314563129, // Cloak of the Great Hunt
    1432728945, // Hood of the Great Hunt
    1444894250, // Strides of the Great Hunt
    1477271933, // Bond of the Great Hunt
    1646520469, // Cloak of the Great Hunt
    1656835365, // Plate of the Great Hunt
    1851777734, // Apex Predator
    2112541750, // Cloak of the Great Hunt
    2274520361, // Helm of the Great Hunt
    2280287728, // Bond of the Great Hunt
    2550116544, // Robes of the Great Hunt
    2598685593, // Gloves of the Great Hunt
    2868042232, // Vest of the Great Hunt
    2884596447, // The Supremacy
    2950533187, // Strides of the Great Hunt
    3055836250, // Greaves of the Great Hunt
    3119383537, // Grips of the Great Hunt
    3143067364, // Plate of the Great Hunt
    3208178411, // Gauntlets of the Great Hunt
    3227674085, // Boots of the Great Hunt
    3251351304, // Hood of the Great Hunt
    3445296383, // Robes of the Great Hunt
    3445582154, // Hood of the Great Hunt
    3492720019, // Gloves of the Great Hunt
    3494130310, // Strides of the Great Hunt
    3591141932, // Techeun Force
    3614211816, // Plate of the Great Hunt
    3838639757, // Mask of the Great Hunt
    3868637058, // Helm of the Great Hunt
    3874578566, // Greaves of the Great Hunt
    3885259140, // Transfiguration
    4219088013, // Helm of the Great Hunt
  ],
  moon: [
    193805725, // Dreambane Cloak
    272413517, // Dreambane Helm
    310888006, // Dreambane Greaves
    377813570, // Dreambane Strides
    659922705, // Dreambane Cowl
    682780965, // Dreambane Gloves
    883769696, // Dreambane Vest
    925079356, // Dreambane Gauntlets
    1030110631, // Dreambane Boots
    1528483180, // Dreambane Hood
    2048903186, // Dreambane Bond
    2568538788, // Dreambane Plate
    3312368889, // Dreambane Mark
    3571441640, // Dreambane Grips
    3692187003, // Dreambane Robes
  ],
  nessus: [
    11686457, // Unethical Experiments Cloak
    56157064, // Exodus Down Gauntlets
    126418248, // Exodus Down Vest
    177493699, // Exodus Down Plate
    192377242, // Exodus Down Strides
    320310250, // Unethical Experiments Bond
    472691604, // Exodus Down Vest
    527652447, // Exodus Down Mark
    569251271, // Exodus Down Gloves
    569678873, // Exodus Down Mark
    582151075, // Exodus Down Helm
    667921213, // Exodus Down Mark
    853736709, // Exodus Down Cloak
    874856664, // Exodus Down Bond
    957928253, // Exodus Down Gauntlets
    1010733668, // Exodus Down Helm
    1096417434, // Shieldbreaker Robes
    1156448694, // Exodus Down Plate
    1157496418, // Exodus Down Greaves
    1286488743, // Shieldbreaker Plate
    1316205184, // Exodus Down Plate
    1355771621, // Shieldbreaker Vest
    1427620200, // Exodus Down Gloves
    1439502385, // Exodus Down Helm
    1539014368, // Exodus Down Grips
    1640979177, // Exodus Down Cloak
    1669675549, // Exodus Down Bond
    1678216306, // Exodus Down Gauntlets
    1810569868, // Exodus Down Bond
    2029766091, // Exodus Down Gloves
    2032811197, // Exodus Down Robes
    2079454604, // Exodus Down Greaves
    2172333833, // Exodus Down Mask
    2218838661, // Exodus Down Robes
    2252973221, // Exodus Down Cloak
    2359639520, // Exodus Down Robes
    2423003287, // Exodus Down Grips
    2426340791, // Unethical Experiments Mark
    2462524641, // Exodus Down Vest
    2528959426, // Exodus Down Boots
    2731698402, // Exodus Down Hood
    2736812653, // Exodus Down Helm
    2811068561, // Exodus Down Hood
    2816760678, // Exodus Down Greaves
    2947629004, // Exodus Down Grips
    2953649850, // Exodus Down Strides
    3026265798, // Exodus Down Mask
    3323553887, // Exodus Down Greaves
    3446606632, // Exodus Down Vest
    3536375792, // Exodus Down Bond
    3545981149, // Exodus Down Boots
    3593464438, // Exodus Down Strides
    3617024265, // Exodus Down Boots
    3654781892, // Exodus Down Plate
    3660228214, // Exodus Down Hood
    3669590332, // Exodus Down Cloak
    3742350309, // Exodus Down Boots
    3754164794, // Exodus Down Mark
    3807183801, // Exodus Down Strides
    3855512540, // Exodus Down Gauntlets
    3875829376, // Exodus Down Grips
    3951684081, // Exodus Down Robes
    3960258378, // Exodus Down Hood
    4007396243, // Exodus Down Gloves
    4060742749, // Exodus Down Mask
    4130486121, // Exodus Down Mask
  ],
  nightfall: [
    40394833, // The Militia's Birthright
    47772649, // THE SWARM
    192784503, // Pre Astyanax IV
    205225492, // Hung Jury SR4
    267089201, // Warden's Law (Adept)
    496556698, // Pre Astyanax IV (Adept)
    555148853, // Wendigo GL3 (Adept)
    672957262, // Undercurrent (Adept)
    681067419, // Hung Jury SR4 (Adept)
    772231794, // Hung Jury SR4
    852228780, // Uzume RR4 (Adept)
    912150785, // Mindbender's Ambition (Adept)
    1094005544, // Mindbender's Ambition
    1151688091, // Undercurrent
    1821529912, // Warden's Law
    1891996599, // Uzume RR4 (Adept)
    2065081837, // Uzume RR4
    2147010335, // Shadow Price (Adept)
    2378101424, // The Militia's Birthright (Adept)
    2450917538, // Uzume RR4
    2633186522, // Shadow Price
    3183283212, // Wendigo GL3
    3836861464, // THE SWARM (Adept)
    4074251943, // Hung Jury SR4 (Adept)
    4281371574, // Hung Jury SR4
  ],
  nm: [
    25798127, // Sovereign Grips
    106359434, // Coronation Mark
    147165546, // Sovereign Legs
    316745113, // Sovereign Hood
    342618372, // Coronation Cloak
    600401425, // Sovereign Boots
    755928510, // Sovereign Mask
    831738837, // Coronation Bond
    1890693805, // Sovereign Gauntlets
    2154427219, // Sovereign Plate
    2436244536, // Sovereign Robes
    2603069551, // Sovereign Greaves
    3059968532, // Sovereign Helm
    3323316553, // Sovereign Vest
    4083497488, // Sovereign Gloves
  ],
  plunder: [
    912150785, // Mindbender's Ambition (Adept)
    2378101424, // The Militia's Birthright (Adept)
    2871264750, // Skeleton Key
  ],
  prophecy: [
    1773934241, // Judgment
    1904170910, // A Sudden Death
    2129814338, // Prosecutor
    4097972038, // A Sudden Death
  ],
  psiops: [
    3358687360, // Synaptic Spear
  ],
  rahool: [
    50291571, // Speaker's Sight
    90009855, // Arbor Warden
    192896783, // Cyrtarachne's Facade
    300502917, // Nothing Manacles
    461841403, // Gyrfalcon's Hauberk
    511888814, // Secant Filaments
    1001356380, // Star-Eater Scales
    1322544481, // Hoarfrost-Z
    1443166262, // Second Chance
    1453120846, // The Path of Burning Steps
    1467044898, // Icefall Mantle
    1619425569, // Mask of Bakris
    1624882687, // Rain of Fire
    1627691271, // Gifted Conviction
    1702288800, // Radiant Dance Machines
    1703551922, // Blight Ranger
    1703598057, // Point-Contact Cannon Brace
    1849149215, // Fallen Sunstar
    1909305643, // Hazardous Propulsion
    1935198785, // Omnioculus
    1955548646, // Mataiodoxía
    2066430310, // Pyrogale Gauntlets
    2169905051, // Renewal Grasps
    2316914168, // Dawn Chorus
    2321120637, // Cuirass of the Falling Star
    2374129871, // Cenotaph Mask
    2390471904, // Speedloader Slacks
    2415768376, // Athrys's Embrace
    2463947681, // Swarmers
    2780717641, // Necrotic Grip
    3001449507, // Balance of Power
    3045642045, // Boots of the Assembler
    3093309525, // Triton Vice
    3234692237, // Briarbinds
    3259193988, // Osmiomancy Gloves
    3267996858, // No Backup Plans
    3301944824, // Mantle of Battle Harmony
    3316517958, // Loreley Splendor Helm
    3453042252, // Caliban's Hand
    3534173884, // Mothkeeper's Wraps
    3574051505, // Cadmus Ridge Lancecap
    3637722482, // Abeyant Leap
    3717431477, // Wishful Ignorance
    3831935023, // Ballidorse Wrathweavers
    3974038291, // Precious Scars
  ],
  raid: [
    4968701, // Greaves of the Great Hunt
    11974904, // Greaves of Ascendancy
    16387641, // Mark of the Great Hunt
    17280095, // Shadow's Strides
    30962015, // Boots of the Ace-Defiant
    49280456, // Gloves of the Great Hunt
    64543268, // Boots of the Emperor's Minister
    64543269, // Boots of the Fulminator
    65929376, // Gauntlets of the Great Hunt
    70083888, // Nation of Beasts
    146275556, // Vest of the Great Hunt
    196235132, // Grips of the Great Hunt
    223783885, // Insigne Shade Bond
    239489770, // Bond of Sekris
    253344425, // Mask of Feltroc
    256904954, // Shadow's Grips
    281660259, // Temptation's Mark
    288406317, // Greaves of Rull
    309687341, // Shadow's Greaves
    311429765, // Mark of the Emperor's Champion
    325125949, // Shadow's Helm
    325434398, // Vest of the Ace-Defiant
    325434399, // Vest of the Emperor's Agent
    336656483, // Boots of the Emperor's Minister
    340118991, // Boots of Sekris
    350056552, // Bladesmith's Memory Mask
    383742277, // Cloak of Feltroc
    388999052, // Bulletsmith's Ire Mark
    407863747, // Vest of the Ace-Defiant
    424291879, // Age-Old Bond
    455108040, // Helm of the Emperor's Champion
    455108041, // Mask of Rull
    501329015, // Chattering Bone
    503773817, // Insigne Shade Gloves
    519078295, // Helm of Righteousness
    548581042, // Insigne Shade Boots
    557676195, // Cowl of Righteousness
    560455272, // Penumbral Mark
    574137192, // Shadow's Mark
    576683388, // Gauntlets of the Great Hunt
    581908796, // Bond of the Emperor's Minister
    588627781, // Bond of Sekris
    608074492, // Robes of the Emperor's Minister
    608074493, // Robes of the Fulminator
    612065993, // Penumbral Mark
    618662448, // Headpiece of the Emperor's Minister
    641933203, // Mask of the Emperor's Agent
    666883012, // Gauntlets of Nohr
    726265506, // Boots of the Great Hunt
    748485514, // Mask of the Fulminator
    748485515, // Headpiece of the Emperor's Minister
    754149842, // Wraps of the Emperor's Minister
    754149843, // Wraps of the Fulminator
    776723133, // Robes of the Great Hunt
    778784376, // Mark of the Great Hunt
    796914932, // Mask of Sekris
    802557885, // Turris Shade Gauntlets
    821841934, // Bond of the Great Hunt
    845536715, // Vest of Feltroc
    853543290, // Greaves of Rull
    853543291, // Greaves of the Emperor's Champion
    855363300, // Turris Shade Helm
    874272413, // Shadow's Robes
    917591018, // Grips of the Ace-Defiant
    917591019, // Gloves of the Emperor's Agent
    972689703, // Vest of the Great Hunt
    974648224, // Shadow's Boots
    1021341893, // Mark of the Great Hunt
    1034660314, // Boots of Feltroc
    1108389626, // Gloves of the Emperor's Agent
    1127835600, // Grips of the Great Hunt
    1156439528, // Insigne Shade Cover
    1190016345, // Mask of the Great Hunt
    1195800715, // Boots of the Great Hunt
    1230192769, // Robes of the Emperor's Minister
    1242139836, // Plate of Nohr
    1256688732, // Mask of Feltroc
    1258342944, // Mask of the Great Hunt
    1296628624, // Insigne Shade Robes
    1314563129, // Cloak of the Great Hunt
    1339632007, // Turris Shade Helm
    1354679721, // Cloak of the Emperor's Agent
    1390282760, // Chassis of Rull
    1390282761, // Cuirass of the Emperor's Champion
    1413589586, // Mask of Rull
    1432728945, // Hood of the Great Hunt
    1434870610, // Shadow's Helm
    1444894250, // Strides of the Great Hunt
    1457195686, // Shadow's Gloves
    1477271933, // Bond of the Great Hunt
    1481751647, // Shadow's Mind
    1624906371, // Gunsmith's Devotion Crown
    1646520469, // Cloak of the Great Hunt
    1653741426, // Grips of Exaltation
    1656835365, // Plate of the Great Hunt
    1675393889, // Insigne Shade Cover
    1756558505, // Mask of Sekris
    1793869832, // Turris Shade Greaves
    1851777734, // Apex Predator
    1862963733, // Shadow's Plate
    1876645653, // Chassis of Rull
    1879942843, // Gauntlets of Rull
    1901223867, // Shadow's Gauntlets
    1917693279, // Bladesmith's Memory Vest
    1934647691, // Shadow's Mask
    1937834292, // Shadow's Strides
    1946621757, // Shadow's Grips
    1960303677, // Grips of the Ace-Defiant
    1991039861, // Mask of Nohr
    1999427172, // Shadow's Mask
    2013109092, // Helm of the Ace-Defiant
    2015894615, // Gloves of Exaltation
    2023695690, // Shadow's Robes
    2054979724, // Strides of Ascendancy
    2070062384, // Shadow's Bond
    2070062385, // Bond of the Emperor's Minister
    2112541750, // Cloak of the Great Hunt
    2128823667, // Turris Shade Mark
    2153222031, // Shadow's Gloves
    2158603584, // Gauntlets of Rull
    2158603585, // Gauntlets of the Emperor's Champion
    2183861870, // Gauntlets of the Emperor's Champion
    2193494688, // Boots of the Fulminator
    2194479195, // Penumbral Bond
    2232730708, // Vest of the Emperor's Agent
    2274520361, // Helm of the Great Hunt
    2280287728, // Bond of the Great Hunt
    2320830625, // Robes of Transcendence
    2329031091, // Robes of Sekris
    2339720736, // Grips of Feltroc
    2369496221, // Plate of Nohr
    2480074702, // Forbearance
    2513313400, // Insigne Shade Gloves
    2530113265, // Bulletsmith's Ire Plate
    2537874394, // Boots of Sekris
    2550116544, // Robes of the Great Hunt
    2552158692, // Equitis Shade Rig
    2589473259, // Bladesmith's Memory Strides
    2597529070, // Greaves of Nohr
    2598685593, // Gloves of the Great Hunt
    2620001759, // Insigne Shade Robes
    2653039573, // Grips of Feltroc
    2676042150, // Wraps of the Fulminator
    2700598111, // Mask of the Fulminator
    2710517999, // Equitis Shade Grips
    2722103686, // Equitis Shade Boots
    2758465168, // Greaves of the Emperor's Champion
    2762445138, // Gunsmith's Devotion Gloves
    2765688378, // Penumbral Cloak
    2769298993, // Shadow's Boots
    2868042232, // Vest of the Great Hunt
    2878130185, // Bulletsmith's Ire Greaves
    2884596447, // The Supremacy
    2904930850, // Turris Shade Plate
    2913992255, // Helm of the Emperor's Champion
    2921334134, // Bulletsmith's Ire Helm
    2933666377, // Equitis Shade Rig
    2950533187, // Strides of the Great Hunt
    2976612200, // Vest of Feltroc
    2994007601, // Mark of Nohr
    3001934726, // Mask of Righteousness
    3055836250, // Greaves of the Great Hunt
    3066613133, // Equitis Shade Cowl
    3082625196, // Shadow's Gauntlets
    3092380260, // Mark of the Emperor's Champion
    3092380261, // Shadow's Mark
    3099636805, // Greaves of Nohr
    3103335676, // Temptation's Bond
    3108321700, // Penumbral Bond
    3119383537, // Grips of the Great Hunt
    3143067364, // Plate of the Great Hunt
    3163683564, // Gunsmith's Devotion Boots
    3164851950, // Bladesmith's Memory Cloak
    3168183519, // Turris Shade Greaves
    3181497704, // Robes of Sekris
    3208178411, // Gauntlets of the Great Hunt
    3227674085, // Boots of the Great Hunt
    3251351304, // Hood of the Great Hunt
    3285121297, // Equitis Shade Boots
    3292127944, // Cuirass of the Emperor's Champion
    3349283422, // Shadow's Mind
    3359121706, // Mask of Nohr
    3364682867, // Gauntlets of Nohr
    3388655311, // Tyranny of Heaven
    3395856235, // Insigne Shade Boots
    3416932282, // Turris Shade Mark
    3440648382, // Equitis Shade Cowl
    3445296383, // Robes of the Great Hunt
    3445582154, // Hood of the Great Hunt
    3483984579, // Shadow's Vest
    3492720019, // Gloves of the Great Hunt
    3494130310, // Strides of the Great Hunt
    3497220322, // Cloak of Feltroc
    3517729518, // Shadow's Vest
    3518193943, // Penumbral Cloak
    3530284425, // Wraps of the Emperor's Minister
    3549177695, // Cloak of Temptation
    3567761471, // Gunsmith's Devotion Bond
    3581198350, // Turris Shade Gauntlets
    3591141932, // Techeun Force
    3592548938, // Robes of the Fulminator
    3614211816, // Plate of the Great Hunt
    3711700026, // Mask of the Emperor's Agent
    3711700027, // Helm of the Ace-Defiant
    3719175804, // Equitis Shade Grips
    3720446265, // Equitis Shade Cloak
    3759659288, // Shadow's Plate
    3763332443, // Shadow's Bond
    3824429433, // Boots of Ascendancy
    3831484112, // Mark of Nohr
    3838639757, // Mask of the Great Hunt
    3842934816, // Wraps of Sekris
    3853397100, // Boots of the Emperor's Agent
    3867160430, // Insigne Shade Bond
    3868637058, // Helm of the Great Hunt
    3874578566, // Greaves of the Great Hunt
    3885259140, // Transfiguration
    3887559710, // Gauntlets of Exaltation
    3939809874, // Plate of Transcendence
    3950028838, // Cloak of the Emperor's Agent
    3950028839, // Shadow's Cloak
    3964287245, // Wraps of Sekris
    3984534842, // Shadow's Cloak
    3992358137, // Bladesmith's Memory Grips
    4125324487, // Bulletsmith's Ire Gauntlets
    4135228483, // Turris Shade Plate
    4152814806, // Shadow's Greaves
    4177973942, // Vest of Transcendence
    4219088013, // Helm of the Great Hunt
    4229161783, // Boots of Feltroc
    4238134294, // Gunsmith's Devotion Robes
    4247935492, // Equitis Shade Cloak
    4251770244, // Boots of the Ace-Defiant
    4251770245, // Boots of the Emperor's Agent
  ],
  rasputin: [
    555148853, // Wendigo GL3 (Adept)
    681067419, // Hung Jury SR4 (Adept)
    1631448645, // Seraph Cipher
    4074251943, // Hung Jury SR4 (Adept)
  ],
  revenant: [
    239405325, // Spacewalk Strides
    480133716, // Spacewalk Robes
    498496285, // Spacewalk Cover
    898451378, // Spacewalk Cowl
    1265540521, // Spacewalk Bond
    1364804507, // Spacewalk Grasps
    2147583688, // Spacewalk Cloak
    2155757770, // Spacewalk Mark
    2867324653, // Spacewalk Gauntlets
    3067211509, // Spacewalk Vest
    3113666223, // Spacewalk Greaves
    3255995532, // Spacewalk Gloves
    3820841619, // Spacewalk Plate
    3901727798, // Spacewalk Boots
    4036496212, // Spacewalk Helm
  ],
  riteofthenine: [
    14929251, // Long Arm
    492673102, // New Pacific Epitaph
    749483159, // Prosecutor (Adept)
    1050582210, // Greasy Luck (Adept)
    1066598837, // Relentless (Adept)
    1157220231, // No Survivors (Adept)
    1685406703, // Greasy Luck
    2126543269, // Cold Comfort (Adept)
    2477408004, // Wilderflight (Adept)
    2730671571, // Terminus Horizon
    2764074355, // A Sudden Death (Adept)
    3185151619, // New Pacific Epitaph (Adept)
    3421639790, // Liminal Vigil (Adept)
    3598944128, // Foretold
    3598944129, // Seer
    3598944130, // Esper
    3598944131, // Calibrated
    3598944132, // Immortality
    3681280908, // Relentless
    3692140710, // Long Arm (Adept)
    4193602194, // No Survivors
    4267192886, // Terminus Horizon (Adept)
  ],
  rotn: [
    14929251, // Long Arm
    492673102, // New Pacific Epitaph
    749483159, // Prosecutor (Adept)
    1050582210, // Greasy Luck (Adept)
    1066598837, // Relentless (Adept)
    1157220231, // No Survivors (Adept)
    1685406703, // Greasy Luck
    2126543269, // Cold Comfort (Adept)
    2477408004, // Wilderflight (Adept)
    2730671571, // Terminus Horizon
    2764074355, // A Sudden Death (Adept)
    3185151619, // New Pacific Epitaph (Adept)
    3421639790, // Liminal Vigil (Adept)
    3598944128, // Foretold
    3598944129, // Seer
    3598944130, // Esper
    3598944131, // Calibrated
    3598944132, // Immortality
    3681280908, // Relentless
    3692140710, // Long Arm (Adept)
    4193602194, // No Survivors
    4267192886, // Terminus Horizon (Adept)
  ],
  saint14: [
    3360014173, // The Lantern of Osiris
  ],
  scourge: [
    350056552, // Bladesmith's Memory Mask
    388999052, // Bulletsmith's Ire Mark
    1624906371, // Gunsmith's Devotion Crown
    1917693279, // Bladesmith's Memory Vest
    2530113265, // Bulletsmith's Ire Plate
    2589473259, // Bladesmith's Memory Strides
    2762445138, // Gunsmith's Devotion Gloves
    2878130185, // Bulletsmith's Ire Greaves
    2921334134, // Bulletsmith's Ire Helm
    3163683564, // Gunsmith's Devotion Boots
    3164851950, // Bladesmith's Memory Cloak
    3567761471, // Gunsmith's Devotion Bond
    3992358137, // Bladesmith's Memory Grips
    4125324487, // Bulletsmith's Ire Gauntlets
    4238134294, // Gunsmith's Devotion Robes
  ],
  scourgeofthepast: [
    350056552, // Bladesmith's Memory Mask
    388999052, // Bulletsmith's Ire Mark
    1624906371, // Gunsmith's Devotion Crown
    1917693279, // Bladesmith's Memory Vest
    2530113265, // Bulletsmith's Ire Plate
    2589473259, // Bladesmith's Memory Strides
    2762445138, // Gunsmith's Devotion Gloves
    2878130185, // Bulletsmith's Ire Greaves
    2921334134, // Bulletsmith's Ire Helm
    3163683564, // Gunsmith's Devotion Boots
    3164851950, // Bladesmith's Memory Cloak
    3567761471, // Gunsmith's Devotion Bond
    3992358137, // Bladesmith's Memory Grips
    4125324487, // Bulletsmith's Ire Gauntlets
    4238134294, // Gunsmith's Devotion Robes
  ],
  seasonpass: [
    1387688628, // The Gate Lord's Eye
    1631448645, // Seraph Cipher
    2785855278, // NPA Repulsion Regulator
    2871264750, // Skeleton Key
    3358687360, // Synaptic Spear
    3644991365, // Ascendant Scepter
    3864896927, // Nightmare Harvester
    4012642691, // Riptide
  ],
  servitor: [
    3380377210, // Paradrome Cube
  ],
  shaxx: [
    85800627, // Ankaa Seeker IV
    98331691, // Binary Phoenix Mark
    120859138, // Phoenix Strife Type 0
    185853176, // Wing Discipline
    252414402, // Swordflight 4.1
    283188616, // Wing Contender
    290136582, // Wing Theorem
    315615761, // Ankaa Seeker IV
    327530279, // Wing Theorem
    328902054, // Swordflight 4.1
    356269375, // Wing Theorem
    388771599, // Phoenix Strife Type 0
    419812559, // Ankaa Seeker IV
    438224459, // Wing Discipline
    449878234, // Phoenix Strife Type 0
    468899627, // Binary Phoenix Mark
    494475253, // Ossuary Boots
    530558102, // Phoenix Strife Type 0
    628604416, // Ossuary Bond
    631191162, // Ossuary Cover
    636679949, // Ankaa Seeker IV
    657400178, // Swordflight 4.1
    670877864, // Binary Phoenix Mark
    727838174, // Swordflight 4.1
    744199039, // Wing Contender
    761953100, // Ankaa Seeker IV
    820446170, // Phoenix Strife Type 0
    849529384, // Phoenix Strife Type 0
    874101646, // Wing Theorem
    876608500, // Ankaa Seeker IV
    920187221, // Wing Discipline
    929917162, // Wing Theorem
    944242985, // Ankaa Seeker IV
    979782821, // Hinterland Cloak
    987343638, // Ankaa Seeker IV
    997903134, // Wing Theorem
    1036467370, // Wing Theorem
    1062166003, // Wing Contender
    1063904165, // Wing Discipline
    1069887756, // Wing Contender
    1071350799, // Binary Phoenix Cloak
    1084033161, // Wing Contender
    1127237110, // Wing Contender
    1167444103, // Biosphere Explorer Mark
    1245115841, // Wing Theorem
    1294217731, // Binary Phoenix Cloak
    1307478991, // Ankaa Seeker IV
    1330581478, // Phoenix Strife Type 0
    1333087155, // Ankaa Seeker IV
    1381742107, // Biosphere Explorer Helm
    1464207979, // Wing Discipline
    1467590642, // Binary Phoenix Bond
    1484937602, // Phoenix Strife Type 0
    1497354980, // Biosphere Explorer Greaves
    1548928853, // Phoenix Strife Type 0
    1571781304, // Swordflight 4.1
    1648675919, // Binary Phoenix Mark
    1654427223, // Swordflight 4.1
    1658896287, // Binary Phoenix Cloak
    1673285051, // Wing Theorem
    1716643851, // Wing Contender
    1722623780, // Wing Discipline
    1742680797, // Binary Phoenix Mark
    1742940528, // Phoenix Strife Type 0
    1764274932, // Ankaa Seeker IV
    1801625827, // Swordflight 4.1
    1828358334, // Swordflight 4.1
    1830829330, // Swordflight 4.1
    1837817086, // Biosphere Explorer Plate
    1838158578, // Binary Phoenix Bond
    1838273186, // Wing Contender
    1852468615, // Ankaa Seeker IV
    1904811766, // Swordflight 4.1
    1929596421, // Ankaa Seeker IV
    2048762125, // Ossuary Robes
    2070517134, // Wing Contender
    2124666626, // Wing Discipline
    2191401041, // Phoenix Strife Type 0
    2191437287, // Ankaa Seeker IV
    2206581692, // Phoenix Strife Type 0
    2231762285, // Phoenix Strife Type 0
    2247740696, // Swordflight 4.1
    2291226602, // Binary Phoenix Bond
    2293476915, // Swordflight 4.1
    2296560252, // Swordflight 4.1
    2296691422, // Swordflight 4.1
    2323865727, // Wing Theorem
    2331227463, // Wing Contender
    2339694345, // Hinterland Cowl
    2402428483, // Ossuary Gloves
    2415711886, // Wing Contender
    2426070307, // Binary Phoenix Cloak
    2466453881, // Wing Discipline
    2473130418, // Swordflight 4.1
    2496309431, // Wing Discipline
    2511045676, // Binary Phoenix Bond
    2525395257, // Wing Theorem
    2543903638, // Phoenix Strife Type 0
    2555965565, // Wing Discipline
    2627852659, // Phoenix Strife Type 0
    2670393359, // Phoenix Strife Type 0
    2718495762, // Swordflight 4.1
    2727890395, // Ankaa Seeker IV
    2754844215, // Swordflight 4.1
    2775298636, // Ankaa Seeker IV
    2815422368, // Phoenix Strife Type 0
    2841023690, // Biosphere Explorer Gauntlets
    3089908066, // Wing Discipline
    3098328572, // The Recluse
    3098458331, // Ankaa Seeker IV
    3119528729, // Wing Contender
    3121010362, // Hinterland Strides
    3140634552, // Swordflight 4.1
    3148195144, // Hinterland Vest
    3211001969, // Wing Contender
    3223280471, // Swordflight 4.1
    3298826188, // Swordflight 4.1
    3313736739, // Binary Phoenix Cloak
    3315265682, // Phoenix Strife Type 0
    3483546829, // Wing Discipline
    3522021318, // Wing Discipline
    3538513130, // Binary Phoenix Bond
    3724026171, // Wing Theorem
    3756286064, // Phoenix Strife Type 0
    3772194440, // Wing Contender
    3781722107, // Phoenix Strife Type 0
    3818803676, // Wing Discipline
    3839561204, // Wing Theorem
    4043189888, // Hinterland Grips
    4043921923, // The Mountaintop
    4043980813, // Ankaa Seeker IV
    4123918087, // Wing Contender
    4134090375, // Ankaa Seeker IV
    4136212668, // Wing Discipline
    4144133120, // Wing Theorem
    4211218181, // Ankaa Seeker IV
    4264096388, // Wing Theorem
  ],
  sonar: [
    2785855278, // NPA Repulsion Regulator
  ],
  sos: [
    223783885, // Insigne Shade Bond
    503773817, // Insigne Shade Gloves
    548581042, // Insigne Shade Boots
    802557885, // Turris Shade Gauntlets
    855363300, // Turris Shade Helm
    1156439528, // Insigne Shade Cover
    1296628624, // Insigne Shade Robes
    1339632007, // Turris Shade Helm
    1675393889, // Insigne Shade Cover
    1793869832, // Turris Shade Greaves
    2128823667, // Turris Shade Mark
    2513313400, // Insigne Shade Gloves
    2552158692, // Equitis Shade Rig
    2620001759, // Insigne Shade Robes
    2710517999, // Equitis Shade Grips
    2722103686, // Equitis Shade Boots
    2904930850, // Turris Shade Plate
    2933666377, // Equitis Shade Rig
    3066613133, // Equitis Shade Cowl
    3168183519, // Turris Shade Greaves
    3285121297, // Equitis Shade Boots
    3395856235, // Insigne Shade Boots
    3416932282, // Turris Shade Mark
    3440648382, // Equitis Shade Cowl
    3581198350, // Turris Shade Gauntlets
    3719175804, // Equitis Shade Grips
    3720446265, // Equitis Shade Cloak
    3867160430, // Insigne Shade Bond
    4135228483, // Turris Shade Plate
    4247935492, // Equitis Shade Cloak
  ],
  sotp: [
    350056552, // Bladesmith's Memory Mask
    388999052, // Bulletsmith's Ire Mark
    1624906371, // Gunsmith's Devotion Crown
    1917693279, // Bladesmith's Memory Vest
    2530113265, // Bulletsmith's Ire Plate
    2589473259, // Bladesmith's Memory Strides
    2762445138, // Gunsmith's Devotion Gloves
    2878130185, // Bulletsmith's Ire Greaves
    2921334134, // Bulletsmith's Ire Helm
    3163683564, // Gunsmith's Devotion Boots
    3164851950, // Bladesmith's Memory Cloak
    3567761471, // Gunsmith's Devotion Bond
    3992358137, // Bladesmith's Memory Grips
    4125324487, // Bulletsmith's Ire Gauntlets
    4238134294, // Gunsmith's Devotion Robes
  ],
  sotw: [
    436695703, // TM-Cogburn Custom Plate
    498918879, // TM-Earp Custom Grips
    708921139, // TM-Cogburn Custom Legguards
    1349399252, // TM-Earp Custom Cloaked Stetson
    1460079227, // Liminal Vigil
    2341879253, // TM-Moss Custom Bond
    2565015142, // TM-Cogburn Custom Mark
    2982006965, // Wilderflight
    3344225390, // TM-Earp Custom Hood
    3511740432, // TM-Moss Custom Gloves
    3715136417, // TM-Earp Custom Chaps
    3870375786, // TM-Moss Custom Pants
    3933500353, // TM-Cogburn Custom Gauntlets
    3946384952, // TM-Moss Custom Duster
    4039955353, // TM-Moss Custom Hat
    4177293424, // TM-Cogburn Custom Cover
    4288623897, // TM-Earp Custom Vest
  ],
  spireofstars: [
    223783885, // Insigne Shade Bond
    503773817, // Insigne Shade Gloves
    548581042, // Insigne Shade Boots
    802557885, // Turris Shade Gauntlets
    855363300, // Turris Shade Helm
    1156439528, // Insigne Shade Cover
    1296628624, // Insigne Shade Robes
    1339632007, // Turris Shade Helm
    1675393889, // Insigne Shade Cover
    1793869832, // Turris Shade Greaves
    2128823667, // Turris Shade Mark
    2513313400, // Insigne Shade Gloves
    2552158692, // Equitis Shade Rig
    2620001759, // Insigne Shade Robes
    2710517999, // Equitis Shade Grips
    2722103686, // Equitis Shade Boots
    2904930850, // Turris Shade Plate
    2933666377, // Equitis Shade Rig
    3066613133, // Equitis Shade Cowl
    3168183519, // Turris Shade Greaves
    3285121297, // Equitis Shade Boots
    3395856235, // Insigne Shade Boots
    3416932282, // Turris Shade Mark
    3440648382, // Equitis Shade Cowl
    3581198350, // Turris Shade Gauntlets
    3719175804, // Equitis Shade Grips
    3720446265, // Equitis Shade Cloak
    3867160430, // Insigne Shade Bond
    4135228483, // Turris Shade Plate
    4247935492, // Equitis Shade Cloak
  ],
  spireofthewatcher: [
    436695703, // TM-Cogburn Custom Plate
    498918879, // TM-Earp Custom Grips
    708921139, // TM-Cogburn Custom Legguards
    1349399252, // TM-Earp Custom Cloaked Stetson
    1460079227, // Liminal Vigil
    2341879253, // TM-Moss Custom Bond
    2565015142, // TM-Cogburn Custom Mark
    2982006965, // Wilderflight
    3344225390, // TM-Earp Custom Hood
    3511740432, // TM-Moss Custom Gloves
    3715136417, // TM-Earp Custom Chaps
    3870375786, // TM-Moss Custom Pants
    3933500353, // TM-Cogburn Custom Gauntlets
    3946384952, // TM-Moss Custom Duster
    4039955353, // TM-Moss Custom Hat
    4177293424, // TM-Cogburn Custom Cover
    4288623897, // TM-Earp Custom Vest
  ],
  strikes: [
    24244626, // Mark of Shelter
    34846448, // Xenos Vale IV
    335317194, // Vigil of Heroes
    358599471, // Vigil of Heroes
    406401261, // The Took Offense
    413460498, // Xenos Vale IV
    417061387, // Xenos Vale IV
    420247988, // Xenos Vale IV
    432360904, // Vigil of Heroes
    494475253, // Ossuary Boots
    506100699, // Vigil of Heroes
    508642129, // Vigil of Heroes
    575676771, // Vigil of Heroes
    628604416, // Ossuary Bond
    631191162, // Ossuary Cover
    758026143, // Vigil of Heroes
    799187478, // Vigil of Heroes
    979782821, // Hinterland Cloak
    986111044, // Vigil of Heroes
    1003941622, // Vigil of Heroes
    1007759904, // Vigil of Heroes
    1054960580, // Vigil of Heroes
    1099472035, // The Took Offense
    1130203390, // Vigil of Heroes
    1167444103, // Biosphere Explorer Mark
    1188816597, // The Took Offense
    1247181362, // Vigil of Heroes
    1320081419, // The Shelter in Place
    1381742107, // Biosphere Explorer Helm
    1405063395, // Vigil of Heroes
    1490307366, // Vigil of Heroes
    1497354980, // Biosphere Explorer Greaves
    1514841742, // Mark of Shelter
    1514863327, // Vigil of Heroes
    1538362007, // Vigil of Heroes
    1540376513, // Xenos Vale IV
    1667528443, // The Shelter in Place
    1699493316, // The Last Dance
    1825880546, // The Took Offense
    1837817086, // Biosphere Explorer Plate
    2011569904, // Vigil of Heroes
    2048762125, // Ossuary Robes
    2060516289, // Vigil of Heroes
    2072877132, // Vigil of Heroes
    2076567986, // Vigil of Heroes
    2304309360, // Vigil of Heroes
    2337221567, // Vigil of Heroes
    2339694345, // Hinterland Cowl
    2378296024, // Xenos Vale IV
    2402428483, // Ossuary Gloves
    2422319309, // Vigil of Heroes
    2442309039, // Vigil of Heroes
    2460793798, // Vigil of Heroes
    2592351697, // Vigil of Heroes
    2671880779, // Vigil of Heroes
    2722966297, // The Shelter in Place
    2764938807, // The Took Offense
    2841023690, // Biosphere Explorer Gauntlets
    2902263756, // Vigil of Heroes
    2939022735, // Vigil of Heroes
    3027732901, // The Shelter in Place
    3034285946, // Xenos Vale IV
    3074985148, // Vigil of Heroes
    3121010362, // Hinterland Strides
    3130904371, // Vigil of Heroes
    3148195144, // Hinterland Vest
    3198744410, // The Took Offense
    3213912958, // Vigil of Heroes
    3215392301, // Xenos Vale Bond
    3221304270, // Xenos Vale IV
    3281314016, // The Took Offense
    3375062567, // The Shelter in Place
    3375632008, // The Shelter in Place
    3469164235, // The Took Offense
    3486485973, // The Took Offense
    3499839403, // Vigil of Heroes
    3500775049, // Vigil of Heroes
    3544662820, // Vigil of Heroes
    3569624585, // Vigil of Heroes
    3584380110, // Vigil of Heroes
    3666681446, // Vigil of Heroes
    3670149407, // Vigil of Heroes
    3851385946, // Vigil of Heroes
    3873435116, // The Shelter in Place
    3916064886, // Vigil of Heroes
    3963753111, // Xenos Vale Bond
    4024037919, // Origin Story
    4043189888, // Hinterland Grips
    4074662489, // Vigil of Heroes
    4087433052, // The Took Offense
    4138296191, // The Shelter in Place
    4288492921, // Vigil of Heroes
  ],
  sundered: [
    267671509, // Skull of the Flain
    571745874, // Hooks of the Flain
    608948636, // Carapace of the Flain
    874160718, // Claws of the Flain
    1274101249, // Mask of the Flain
    1930656621, // Husk's Cloak
    2112020760, // Grasps of the Flain
    2299285295, // Adornment of the Flain
    2319342865, // Attendant's Mark
    2501618648, // Visage of the Flain
    2578940720, // Scales of the Flain
    2791329915, // Talons of the Flain
    2965319081, // Reach of the Flain
    3238482084, // Grips of the Flain
    4012478142, // Weaver's Bond
  ],
  sundereddoctrine: [
    267671509, // Skull of the Flain
    571745874, // Hooks of the Flain
    608948636, // Carapace of the Flain
    874160718, // Claws of the Flain
    1274101249, // Mask of the Flain
    1930656621, // Husk's Cloak
    2112020760, // Grasps of the Flain
    2299285295, // Adornment of the Flain
    2319342865, // Attendant's Mark
    2501618648, // Visage of the Flain
    2578940720, // Scales of the Flain
    2791329915, // Talons of the Flain
    2965319081, // Reach of the Flain
    3238482084, // Grips of the Flain
    4012478142, // Weaver's Bond
  ],
  tangled: [
    177829853, // Scatterhorn Bond
    218523139, // Scatterhorn Grasps
    307138509, // Scatterhorn Vest
    411850804, // Scatterhorn Wraps
    694120634, // Scatterhorn Mark
    699589438, // Scatterhorn Boots
    902989307, // Scorned Baron Vest
    1069453608, // Scatterhorn Wraps
    1094005544, // Mindbender's Ambition
    1250571424, // Scatterhorn Robe
    1347463276, // Scatterhorn Mark
    1349281425, // Scorned Baron Plate
    1407026808, // Torobatl Celebration Mask
    1412416835, // Scatterhorn Plate
    1467355683, // Scatterhorn Strides
    1566911695, // Scorned Baron Plate
    1636205905, // Scatterhorn Grasps
    1704861826, // Scatterhorn Boots
    1862088022, // Scatterhorn Helm
    1863170823, // Scatterhorn Vest
    1928007477, // Scorned Baron Vest
    1989103583, // Scatterhorn Greaves
    2007698582, // Torobatl Celebration Mask
    2243444841, // Scatterhorn Greaves
    2276115770, // Scatterhorn Mask
    2411325265, // Scatterhorn Hood
    2563857333, // Scatterhorn Strides
    2571396481, // Scatterhorn Bond
    2757593792, // Scatterhorn Cloak
    2932919026, // Nea-Thonis Breather
    2944336620, // Nea-Thonis Breather
    3044599574, // Scatterhorn Cloak
    3066181671, // Scatterhorn Gauntlets
    3183089352, // Scorned Baron Robes
    3523809305, // Eimin-Tin Ritual Mask
    3858472841, // Eimin-Tin Ritual Mask
    3871458129, // Scatterhorn Plate
    3918445245, // Scatterhorn Gauntlets
    3926141285, // Scatterhorn Hood
    3971250660, // Scatterhorn Helm
    4070132608, // Scatterhorn Mask
    4167605324, // Scatterhorn Robe
    4245441464, // Scorned Baron Robes
  ],
  titan: [
    1701005142, // Songbreaker Gloves
    2486041713, // Songbreaker Gauntlets
    3706457515, // Songbreaker Grips
  ],
  trials: [
    2307365, // The Inquisitor (Adept)
    72827962, // Focusing Robes
    142864314, // Bond of the Exile
    150551028, // Boots of the Exile
    155955678, // Mark Relentless
    272735286, // Greaves of the Exile
    421771594, // Cloak Relentless
    442736573, // Gloves of the Exile
    495541988, // Hood of the Exile
    532746994, // Astral Horizon (Adept)
    571925067, // Cover of the Exile
    686607149, // Focusing Cowl
    711889599, // Whistler's Whim (Adept)
    773318267, // Floating Vest
    784751927, // Annihilating Plate
    825554997, // The Inquisitor (Adept)
    861160515, // Robe of the Exile
    875395086, // Vest of the Exile
    945907383, // Floating Grips
    1164471069, // Helm of the Exile
    1193489623, // Cloak of the Exile
    1401300690, // Eye of Sol
    1526650446, // Trials Engram
    1574601402, // Whistler's Whim
    1697682876, // Astral Horizon
    1929400866, // Annihilating Helm
    2059255495, // Eye of Sol (Adept)
    2158289681, // Floating Boots
    2185327324, // The Inquisitor
    2421180981, // Incisor (Adept)
    2579999316, // Plate of the Exile
    2653171212, // The Inquisitor
    2759251821, // Unwavering Duty (Adept)
    2764588986, // Grips of the Exile
    2808362207, // Legs of the Exile
    3025466099, // Annihilating Guard
    3102421004, // Exalted Truth
    3127319342, // Floating Cowl
    3149072083, // Bond Relentless
    3365406121, // Mark of the Exile
    3426704397, // Annihilating Greaves
    3682803680, // Shayura's Wrath
    3920882229, // Exalted Truth (Adept)
    3921970316, // Gauntlets of the Exile
    4023807721, // Shayura's Wrath (Adept)
    4100217958, // Focusing Boots
    4177448932, // Focusing Wraps
    4248997900, // Incisor
  ],
  vesper: [
    239405325, // Spacewalk Strides
    480133716, // Spacewalk Robes
    498496285, // Spacewalk Cover
    898451378, // Spacewalk Cowl
    1265540521, // Spacewalk Bond
    1364804507, // Spacewalk Grasps
    2147583688, // Spacewalk Cloak
    2155757770, // Spacewalk Mark
    2867324653, // Spacewalk Gauntlets
    3067211509, // Spacewalk Vest
    3113666223, // Spacewalk Greaves
    3255995532, // Spacewalk Gloves
    3820841619, // Spacewalk Plate
    3901727798, // Spacewalk Boots
    4036496212, // Spacewalk Helm
  ],
  vespershost: [
    239405325, // Spacewalk Strides
    480133716, // Spacewalk Robes
    498496285, // Spacewalk Cover
    898451378, // Spacewalk Cowl
    1265540521, // Spacewalk Bond
    1364804507, // Spacewalk Grasps
    2147583688, // Spacewalk Cloak
    2155757770, // Spacewalk Mark
    2867324653, // Spacewalk Gauntlets
    3067211509, // Spacewalk Vest
    3113666223, // Spacewalk Greaves
    3255995532, // Spacewalk Gloves
    3820841619, // Spacewalk Plate
    3901727798, // Spacewalk Boots
    4036496212, // Spacewalk Helm
  ],
  votd: [
    2480074702, // Forbearance
  ],
  vow: [
    2480074702, // Forbearance
  ],
  vowofthedisciple: [
    2480074702, // Forbearance
  ],
  warlordsruin: [
    557092665, // Dark Age Cloak
    632989816, // Dark Age Gauntlets
    806004493, // Dark Age Gloves
    851401651, // Dark Age Overcoat
    1476803535, // Dark Age Legbraces
    1933599476, // Dark Age Visor
    2426502022, // Dark Age Strides
    2662590925, // Dark Age Mark
    2771011469, // Dark Age Mask
    2963224754, // Dark Age Sabatons
    3056827626, // Dark Age Bond
    3423574140, // Dark Age Grips
    3683772388, // Dark Age Harness
    3735435664, // Dark Age Chestrig
    4090037601, // Dark Age Helm
  ],
  watcher: [
    436695703, // TM-Cogburn Custom Plate
    498918879, // TM-Earp Custom Grips
    708921139, // TM-Cogburn Custom Legguards
    1349399252, // TM-Earp Custom Cloaked Stetson
    1460079227, // Liminal Vigil
    2341879253, // TM-Moss Custom Bond
    2565015142, // TM-Cogburn Custom Mark
    2982006965, // Wilderflight
    3344225390, // TM-Earp Custom Hood
    3511740432, // TM-Moss Custom Gloves
    3715136417, // TM-Earp Custom Chaps
    3870375786, // TM-Moss Custom Pants
    3933500353, // TM-Cogburn Custom Gauntlets
    3946384952, // TM-Moss Custom Duster
    4039955353, // TM-Moss Custom Hat
    4177293424, // TM-Cogburn Custom Cover
    4288623897, // TM-Earp Custom Vest
  ],
  zavala: [
    24244626, // Mark of Shelter
    34846448, // Xenos Vale IV
    335317194, // Vigil of Heroes
    358599471, // Vigil of Heroes
    406401261, // The Took Offense
    413460498, // Xenos Vale IV
    417061387, // Xenos Vale IV
    420247988, // Xenos Vale IV
    432360904, // Vigil of Heroes
    494475253, // Ossuary Boots
    506100699, // Vigil of Heroes
    508642129, // Vigil of Heroes
    575676771, // Vigil of Heroes
    628604416, // Ossuary Bond
    631191162, // Ossuary Cover
    758026143, // Vigil of Heroes
    799187478, // Vigil of Heroes
    979782821, // Hinterland Cloak
    986111044, // Vigil of Heroes
    1003941622, // Vigil of Heroes
    1007759904, // Vigil of Heroes
    1054960580, // Vigil of Heroes
    1099472035, // The Took Offense
    1130203390, // Vigil of Heroes
    1167444103, // Biosphere Explorer Mark
    1188816597, // The Took Offense
    1247181362, // Vigil of Heroes
    1320081419, // The Shelter in Place
    1381742107, // Biosphere Explorer Helm
    1405063395, // Vigil of Heroes
    1490307366, // Vigil of Heroes
    1497354980, // Biosphere Explorer Greaves
    1514841742, // Mark of Shelter
    1514863327, // Vigil of Heroes
    1538362007, // Vigil of Heroes
    1540376513, // Xenos Vale IV
    1667528443, // The Shelter in Place
    1699493316, // The Last Dance
    1825880546, // The Took Offense
    1837817086, // Biosphere Explorer Plate
    2011569904, // Vigil of Heroes
    2048762125, // Ossuary Robes
    2060516289, // Vigil of Heroes
    2072877132, // Vigil of Heroes
    2076567986, // Vigil of Heroes
    2304309360, // Vigil of Heroes
    2337221567, // Vigil of Heroes
    2339694345, // Hinterland Cowl
    2378296024, // Xenos Vale IV
    2402428483, // Ossuary Gloves
    2422319309, // Vigil of Heroes
    2442309039, // Vigil of Heroes
    2460793798, // Vigil of Heroes
    2592351697, // Vigil of Heroes
    2671880779, // Vigil of Heroes
    2722966297, // The Shelter in Place
    2764938807, // The Took Offense
    2841023690, // Biosphere Explorer Gauntlets
    2902263756, // Vigil of Heroes
    2939022735, // Vigil of Heroes
    3027732901, // The Shelter in Place
    3034285946, // Xenos Vale IV
    3074985148, // Vigil of Heroes
    3121010362, // Hinterland Strides
    3130904371, // Vigil of Heroes
    3148195144, // Hinterland Vest
    3198744410, // The Took Offense
    3213912958, // Vigil of Heroes
    3215392301, // Xenos Vale Bond
    3221304270, // Xenos Vale IV
    3281314016, // The Took Offense
    3375062567, // The Shelter in Place
    3375632008, // The Shelter in Place
    3469164235, // The Took Offense
    3486485973, // The Took Offense
    3499839403, // Vigil of Heroes
    3500775049, // Vigil of Heroes
    3544662820, // Vigil of Heroes
    3569624585, // Vigil of Heroes
    3584380110, // Vigil of Heroes
    3666681446, // Vigil of Heroes
    3670149407, // Vigil of Heroes
    3851385946, // Vigil of Heroes
    3873435116, // The Shelter in Place
    3916064886, // Vigil of Heroes
    3963753111, // Xenos Vale Bond
    4024037919, // Origin Story
    4043189888, // Hinterland Grips
    4074662489, // Vigil of Heroes
    4087433052, // The Took Offense
    4138296191, // The Shelter in Place
    4288492921, // Vigil of Heroes
  ],
};

export default missingSources;
