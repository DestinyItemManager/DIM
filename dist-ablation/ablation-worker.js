(() => {
  'use strict';
  var e,
    n,
    s,
    i,
    a,
    t = {
      1680(e, n, s) {
        s(7911);
        let i = {
          subtreePrune: !0,
          rangeSeeding: !0,
          autoModsMemo: !0,
          memoGate: !0,
          maxBoostMemo: !0,
          convergenceGate: !0,
          energyCache: !0,
          highStatSort: !0,
          strictBeat: !0,
          tuningPreGate: !0,
          coarseLevelPrunes: !0,
          unrolledAdds: !0,
        };
        if ((Object.keys(i), 'u' > typeof process && process.env?.LO_ABLATE))
          for (let e of process.env.LO_ABLATE.split(',')) {
            let n = e.trim();
            if (n in i) i[n] = !1;
            else if (n.length) throw Error(`Unknown LO_ABLATE flag: ${n}`);
          }
        (s(9690), s(4114), s(4059), s(707), s(3132), s(5438), s(1480));
        var a,
          t,
          o,
          r,
          c,
          l,
          S,
          k,
          u,
          d,
          V,
          f,
          p,
          m,
          x,
          A,
          g,
          R,
          h,
          b,
          W,
          w,
          M = s(6429);
        (((a = f || (f = {}))[(a.AmmoPerk = 0xf149c2c6)] = 'AmmoPerk'),
          (a[(a.ArmorArchetypes = 0x2e624fb5)] = 'ArmorArchetypes'),
          (a[(a.ArmorSkinsEmpty = 0xc8155e5f)] = 'ArmorSkinsEmpty'),
          (a[(a.ArmorSkinsHunterArms = 0xf20d86cc)] = 'ArmorSkinsHunterArms'),
          (a[(a.ArmorSkinsHunterChest = 0xf7368af4)] = 'ArmorSkinsHunterChest'),
          (a[(a.ArmorSkinsHunterClass = 0x5307710b)] = 'ArmorSkinsHunterClass'),
          (a[(a.ArmorSkinsHunterExoticArms = 0x2d95d57)] = 'ArmorSkinsHunterExoticArms'),
          (a[(a.ArmorSkinsHunterExoticChest = 0x8018f389)] = 'ArmorSkinsHunterExoticChest'),
          (a[(a.ArmorSkinsHunterExoticClass = 0x24e770b6)] = 'ArmorSkinsHunterExoticClass'),
          (a[(a.ArmorSkinsHunterExoticHead = 0x10f35d54)] = 'ArmorSkinsHunterExoticHead'),
          (a[(a.ArmorSkinsHunterExoticLegs = 0xb9658f0d)] = 'ArmorSkinsHunterExoticLegs'),
          (a[(a.ArmorSkinsHunterHead = 0xeb9059d7)] = 'ArmorSkinsHunterHead'),
          (a[(a.ArmorSkinsHunterLegs = 0x5fe4c6da)] = 'ArmorSkinsHunterLegs'),
          (a[(a.ArmorSkinsSharedHead = 0x85a20324)] = 'ArmorSkinsSharedHead'),
          (a[(a.ArmorSkinsTitanArms = 0xc9dc1618)] = 'ArmorSkinsTitanArms'),
          (a[(a.ArmorSkinsTitanChest = 0xeb2f8360)] = 'ArmorSkinsTitanChest'),
          (a[(a.ArmorSkinsTitanClass = 0x8ffdffaf)] = 'ArmorSkinsTitanClass'),
          (a[(a.ArmorSkinsTitanExoticArms = 0xe9955b2b)] = 'ArmorSkinsTitanExoticArms'),
          (a[(a.ArmorSkinsTitanExoticChest = 0x3db3205d)] = 'ArmorSkinsTitanExoticChest'),
          (a[(a.ArmorSkinsTitanExoticClass = 0x99840752)] = 'ArmorSkinsTitanExoticClass'),
          (a[(a.ArmorSkinsTitanExoticHead = 0xf0128800)] = 'ArmorSkinsTitanExoticHead'),
          (a[(a.ArmorSkinsTitanExoticLegs = 0x49278611)] = 'ArmorSkinsTitanExoticLegs'),
          (a[(a.ArmorSkinsTitanHead = 0xebc0ce8b)] = 'ArmorSkinsTitanHead'),
          (a[(a.ArmorSkinsTitanLegs = 0x7de6d136)] = 'ArmorSkinsTitanLegs'),
          (a[(a.ArmorSkinsWarlockArms = 0xea8195ef)] = 'ArmorSkinsWarlockArms'),
          (a[(a.ArmorSkinsWarlockChest = 0x59f39451)] = 'ArmorSkinsWarlockChest'),
          (a[(a.ArmorSkinsWarlockClass = 0x1e22dffe)] = 'ArmorSkinsWarlockClass'),
          (a[(a.ArmorSkinsWarlockExoticArms = 0x85fb0802)] = 'ArmorSkinsWarlockExoticArms'),
          (a[(a.ArmorSkinsWarlockExoticChest = 0x9a0f752e)] = 'ArmorSkinsWarlockExoticChest'),
          (a[(a.ArmorSkinsWarlockExoticClass = 0xe52d57d9)] = 'ArmorSkinsWarlockExoticClass'),
          (a[(a.ArmorSkinsWarlockExoticHead = 0x7da271a5)] = 'ArmorSkinsWarlockExoticHead'),
          (a[(a.ArmorSkinsWarlockExoticLegs = 0x3c86140)] = 'ArmorSkinsWarlockExoticLegs'),
          (a[(a.ArmorSkinsWarlockHead = 0x1b1dfcac)] = 'ArmorSkinsWarlockHead'),
          (a[(a.ArmorSkinsWarlockLegs = 0xc3902f65)] = 'ArmorSkinsWarlockLegs'),
          (a[(a.ArmorStats = 0x2ca29c52)] = 'ArmorStats'),
          (a[(a.Arrows = 0x4af5956f)] = 'Arrows'),
          (a[(a.ArtifactPerks = 0xe72af065)] = 'ArtifactPerks'),
          (a[(a.ArtifactReset = 0x16f4d1ff)] = 'ArtifactReset'),
          (a[(a.Barrels = 0xa8e5624c)] = 'Barrels'),
          (a[(a.Batteries = 0x68ba1a20)] = 'Batteries'),
          (a[(a.Blades = 0x3e1817a8)] = 'Blades'),
          (a[(a.Bolts = 0x9767baeb)] = 'Bolts'),
          (a[(a.Bowstrings = 0xe30d5d43)] = 'Bowstrings'),
          (a[(a.BuildPerk = 0x68e9ff16)] = 'BuildPerk'),
          (a[(a.Catalysts = 0x7fb26e8b)] = 'Catalysts'),
          (a[(a.CoreGearSystemsArmorTieringPlugsTuningMods = 0xcf87b615)] =
            'CoreGearSystemsArmorTieringPlugsTuningMods'),
          (a[(a.CoreGearSystemsEventGearItemSetsSelectors = 0x4e43c259)] =
            'CoreGearSystemsEventGearItemSetsSelectors'),
          (a[(a.CraftingPlugsFrameIdentifiers = 0xcc26a9ba)] = 'CraftingPlugsFrameIdentifiers'),
          (a[(a.CraftingPlugsWeaponsModsEnhancers = 0x2a617981)] =
            'CraftingPlugsWeaponsModsEnhancers'),
          (a[(a.CraftingPlugsWeaponsModsExtractors = 0xd1d53c3d)] =
            'CraftingPlugsWeaponsModsExtractors'),
          (a[(a.CraftingPlugsWeaponsModsMemories = 0xa3cc479b)] =
            'CraftingPlugsWeaponsModsMemories'),
          (a[(a.CraftingPlugsWeaponsModsTransfusersLevel = 0x6653115a)] =
            'CraftingPlugsWeaponsModsTransfusersLevel'),
          (a[(a.CraftingRecipesEmptySocket = 0xd7b10de3)] = 'CraftingRecipesEmptySocket'),
          (a[(a.DawningShipShader = 0x948b3bcf)] = 'DawningShipShader'),
          (a[(a.DawningShipSpawnfx = 0x695a31b7)] = 'DawningShipSpawnfx'),
          (a[(a.Deprecated = 0xc197ebb2)] = 'Deprecated'),
          (a[(a.DummyInfuse = 0x62a3c748)] = 'DummyInfuse'),
          (a[(a.EmblemPerk = 0x2bc7ebe7)] = 'EmblemPerk'),
          (a[(a.EmblemVariant = 0xee01db1a)] = 'EmblemVariant'),
          (a[(a.Emote = 0xb60ebd27)] = 'Emote'),
          (a[(a.EnhancementsActivity = 0x47b26f19)] = 'EnhancementsActivity'),
          (a[(a.EnhancementsArms = 0x2630081b)] = 'EnhancementsArms'),
          (a[(a.EnhancementsArtifice = 0xe0e60d25)] = 'EnhancementsArtifice'),
          (a[(a.EnhancementsArtificeExotic = 0x7351ac37)] = 'EnhancementsArtificeExotic'),
          (a[(a.EnhancementsChest = 0x16dfa82d)] = 'EnhancementsChest'),
          (a[(a.EnhancementsClass = 0x748b94e2)] = 'EnhancementsClass'),
          (a[(a.EnhancementsExoticAeonCult = 0x36767b42)] = 'EnhancementsExoticAeonCult'),
          (a[(a.EnhancementsGhostsActivity = 0x4973e9ba)] = 'EnhancementsGhostsActivity'),
          (a[(a.EnhancementsGhostsActivityFake = 0x252bc226)] = 'EnhancementsGhostsActivityFake'),
          (a[(a.EnhancementsGhostsEconomic = 0x97a649c6)] = 'EnhancementsGhostsEconomic'),
          (a[(a.EnhancementsGhostsExperience = 0x7de3af0d)] = 'EnhancementsGhostsExperience'),
          (a[(a.EnhancementsGhostsTracking = 0x41ba8446)] = 'EnhancementsGhostsTracking'),
          (a[(a.EnhancementsHead = 0x2c5d83f0)] = 'EnhancementsHead'),
          (a[(a.EnhancementsLegs = 0x461180e1)] = 'EnhancementsLegs'),
          (a[(a.EnhancementsRaidDescent = 0x65894bed)] = 'EnhancementsRaidDescent'),
          (a[(a.EnhancementsRaidGarden = 0x58a09186)] = 'EnhancementsRaidGarden'),
          (a[(a.EnhancementsRaidV520 = 0x8795f138)] = 'EnhancementsRaidV520'),
          (a[(a.EnhancementsRaidV600 = 0x8393ac15)] = 'EnhancementsRaidV600'),
          (a[(a.EnhancementsRaidV620 = 0x8193a8cf)] = 'EnhancementsRaidV620'),
          (a[(a.EnhancementsRaidV700 = 0x7d91642c)] = 'EnhancementsRaidV700'),
          (a[(a.EnhancementsRaidV720 = 0x7f916772)] = 'EnhancementsRaidV720'),
          (a[(a.EnhancementsRaidV800 = 0x77ae43b)] = 'EnhancementsRaidV800'),
          (a[(a.EnhancementsRivensCurse = 0x801983b0)] = 'EnhancementsRivensCurse'),
          (a[(a.EnhancementsSeasonForge = 0x3e8d031)] = 'EnhancementsSeasonForge'),
          (a[(a.EnhancementsSeasonMaverick = 0x406f34c8)] = 'EnhancementsSeasonMaverick'),
          (a[(a.EnhancementsSeasonOpulence = 0xa1a944cb)] = 'EnhancementsSeasonOpulence'),
          (a[(a.EnhancementsSeasonOutlaw = 0xd03a20)] = 'EnhancementsSeasonOutlaw'),
          (a[(a.EnhancementsSeasonPenumbra = 0x74f69748)] = 'EnhancementsSeasonPenumbra'),
          (a[(a.EnhancementsUniversal = 0xc785b899)] = 'EnhancementsUniversal'),
          (a[(a.EnhancementsV2Arms = 0xcbfdfec8)] = 'EnhancementsV2Arms'),
          (a[(a.EnhancementsV2Chest = 0x5af80070)] = 'EnhancementsV2Chest'),
          (a[(a.EnhancementsV2ClassItem = 0x3662c217)] = 'EnhancementsV2ClassItem'),
          (a[(a.EnhancementsV2General = 0x94493b9b)] = 'EnhancementsV2General'),
          (a[(a.EnhancementsV2Head = 0xad9433fb)] = 'EnhancementsV2Head'),
          (a[(a.EnhancementsV2Legs = 0x7dde0206)] = 'EnhancementsV2Legs'),
          (a[(a.EventsDawningItV950IngredientA = 0x234c88c5)] = 'EventsDawningItV950IngredientA'),
          (a[(a.EventsDawningItV950IngredientB = 0x234c88c6)] = 'EventsDawningItV950IngredientB'),
          (a[(a.EventsDawningItV950NoRecipe = 0x44cd899e)] = 'EventsDawningItV950NoRecipe'),
          (a[(a.EventsDawningItV950OvenCombine = 0x43ee1b27)] = 'EventsDawningItV950OvenCombine'),
          (a[(a.EventsDawningItV950OvenEmpty = 0x3853f37)] = 'EventsDawningItV950OvenEmpty'),
          (a[(a.EventsDawningItV950OvenEmptyCombination = 0x90eb2053)] =
            'EventsDawningItV950OvenEmptyCombination'),
          (a[(a.EventsDawningItV950OvenNotMasterworked = 0x1e471138)] =
            'EventsDawningItV950OvenNotMasterworked'),
          (a[(a.EventsDawningItV950Recipe = 0x4d29270e)] = 'EventsDawningItV950Recipe'),
          (a[(a.EventsDawningOvenMasterworked = 0xa65e3a6a)] = 'EventsDawningOvenMasterworked'),
          (a[(a.ExoticAllSkins = 0xead9f334)] = 'ExoticAllSkins'),
          (a[(a.ExoticNewAutoRifle0Skins = 0xc63cd7a0)] = 'ExoticNewAutoRifle0Skins'),
          (a[(a.ExoticNewAutoRifle1Skins = 0x9c198fa5)] = 'ExoticNewAutoRifle1Skins'),
          (a[(a.ExoticNewFusionRifle0Skins = 0x55101217)] = 'ExoticNewFusionRifle0Skins'),
          (a[(a.ExoticNewGrenadeLauncher0Skins = 0x72304e85)] = 'ExoticNewGrenadeLauncher0Skins'),
          (a[(a.ExoticNewGrenadeLauncher1Skins = 0x4633b900)] = 'ExoticNewGrenadeLauncher1Skins'),
          (a[(a.ExoticNewHandCannon0Skins = 0xe23b960b)] = 'ExoticNewHandCannon0Skins'),
          (a[(a.ExoticNewHandCannon1Skins = 0x1d84281e)] = 'ExoticNewHandCannon1Skins'),
          (a[(a.ExoticNewPulseRifle0Skins = 0xb44d78e0)] = 'ExoticNewPulseRifle0Skins'),
          (a[(a.ExoticNewPulseRifle1Skins = 0x9f9888e5)] = 'ExoticNewPulseRifle1Skins'),
          (a[(a.ExoticNewRocketLauncher0Skins = 0xe14469b5)] = 'ExoticNewRocketLauncher0Skins'),
          (a[(a.ExoticNewScoutRifle0Skins = 0xb605e3df)] = 'ExoticNewScoutRifle0Skins'),
          (a[(a.ExoticNewShotgun0Skins = 0x7755d33e)] = 'ExoticNewShotgun0Skins'),
          (a[(a.ExoticNewShotgun1Skins = 0xb9b178ab)] = 'ExoticNewShotgun1Skins'),
          (a[(a.ExoticNewSidearm1Skins = 0x8ccb243a)] = 'ExoticNewSidearm1Skins'),
          (a[(a.ExoticNewSniperRifle1Skins = 0x18ea996d)] = 'ExoticNewSniperRifle1Skins'),
          (a[(a.ExoticNewSubmachinegun1Skins = 0xf2d3dee6)] = 'ExoticNewSubmachinegun1Skins'),
          (a[(a.ExoticRepackageAutoRifle0Skins = 0x6ca67237)] = 'ExoticRepackageAutoRifle0Skins'),
          (a[(a.ExoticRepackageScoutRifle0Skins = 0xb484ddbe)] = 'ExoticRepackageScoutRifle0Skins'),
          (a[(a.ExoticWeaponMasterworkUpgrade = 0x7329444d)] = 'ExoticWeaponMasterworkUpgrade'),
          (a[(a.Frames = 7906839)] = 'Frames'),
          (a[(a.GenericAllVfx = 0x7857d859)] = 'GenericAllVfx'),
          (a[(a.GenericExoticMasterwork = 0xf6acc5c9)] = 'GenericExoticMasterwork'),
          (a[(a.GhostTrackerLeft = 0xd73d9408)] = 'GhostTrackerLeft'),
          (a[(a.GhostTrackerRight = 0xa9571eff)] = 'GhostTrackerRight'),
          (a[(a.Grips = 0xec298c5c)] = 'Grips'),
          (a[(a.Guards = 0x28bb3c5f)] = 'Guards'),
          (a[(a.Hafts = 0x6534ffbd)] = 'Hafts'),
          (a[(a.HolofoilSkinsShared = 0x68aae964)] = 'HolofoilSkinsShared'),
          (a[(a.Hologram = 0x87727f34)] = 'Hologram'),
          (a[(a.HunterArcAspects = 0xb0ff0f4)] = 'HunterArcAspects'),
          (a[(a.HunterArcClassAbilities = 0xebcd9800)] = 'HunterArcClassAbilities'),
          (a[(a.HunterArcMelee = 0x91213aaf)] = 'HunterArcMelee'),
          (a[(a.HunterArcMovement = 0x7d3e67c6)] = 'HunterArcMovement'),
          (a[(a.HunterArcSupers = 0xf7162da5)] = 'HunterArcSupers'),
          (a[(a.HunterPrismAspects = 0x456db0eb)] = 'HunterPrismAspects'),
          (a[(a.HunterPrismClassAbilities = 0xc62f03c7)] = 'HunterPrismClassAbilities'),
          (a[(a.HunterPrismGrenades = 0xa641e085)] = 'HunterPrismGrenades'),
          (a[(a.HunterPrismMelee = 0x1e7d5ebc)] = 'HunterPrismMelee'),
          (a[(a.HunterPrismMovement = 0x6434d5ef)] = 'HunterPrismMovement'),
          (a[(a.HunterPrismPrismGrenade = 0x18ef88c4)] = 'HunterPrismPrismGrenade'),
          (a[(a.HunterPrismSupers = 0xac0daa0)] = 'HunterPrismSupers'),
          (a[(a.HunterPrismTranscendence = 0x8ffd27a5)] = 'HunterPrismTranscendence'),
          (a[(a.HunterSharedAspects = 0xb4c59529)] = 'HunterSharedAspects'),
          (a[(a.HunterSolarAspects = 0xb5eb6ab7)] = 'HunterSolarAspects'),
          (a[(a.HunterSolarClassAbilities = 0xd2e66cdb)] = 'HunterSolarClassAbilities'),
          (a[(a.HunterSolarMelee = 0xfbd843a0)] = 'HunterSolarMelee'),
          (a[(a.HunterSolarMovement = 0xdfb10813)] = 'HunterSolarMovement'),
          (a[(a.HunterSolarSupers = 0xbbdccd44)] = 'HunterSolarSupers'),
          (a[(a.HunterStasisClassAbilities = 0x263b1cdf)] = 'HunterStasisClassAbilities'),
          (a[(a.HunterStasisMelee = 0xd26883b4)] = 'HunterStasisMelee'),
          (a[(a.HunterStasisMovement = 0x73007117)] = 'HunterStasisMovement'),
          (a[(a.HunterStasisSupers = 0x30c87048)] = 'HunterStasisSupers'),
          (a[(a.HunterStasisTotems = 0x6e756d02)] = 'HunterStasisTotems'),
          (a[(a.HunterStrandAspects = 0xe2d446fe)] = 'HunterStrandAspects'),
          (a[(a.HunterStrandClassAbilities = 0x9825040e)] = 'HunterStrandClassAbilities'),
          (a[(a.HunterStrandMelee = 0xe6de13ed)] = 'HunterStrandMelee'),
          (a[(a.HunterStrandMovement = 0x75fa360c)] = 'HunterStrandMovement'),
          (a[(a.HunterStrandSupers = 0x8a3e9eb)] = 'HunterStrandSupers'),
          (a[(a.HunterVoidAspects = 0xad2ee1d8)] = 'HunterVoidAspects'),
          (a[(a.HunterVoidClassAbilities = 0xdaf74d0c)] = 'HunterVoidClassAbilities'),
          (a[(a.HunterVoidMelee = 0x4cd479eb)] = 'HunterVoidMelee'),
          (a[(a.HunterVoidMovement = 0x6b11cdd2)] = 'HunterVoidMovement'),
          (a[(a.HunterVoidSupers = 0x9bbf6211)] = 'HunterVoidSupers'),
          (a[(a.IntermediatePlugThatWorksInEveryCategory = 0xecd6df5)] =
            'IntermediatePlugThatWorksInEveryCategory'),
          (a[(a.Intrinsics = 0x67fba961)] = 'Intrinsics'),
          (a[(a.LegendaryCrucibleCompetitivePulseRifle0Skins = 0x34c829b8)] =
            'LegendaryCrucibleCompetitivePulseRifle0Skins'),
          (a[(a.Magazines = 0x6bb153ba)] = 'Magazines'),
          (a[(a.MagazinesGl = 0xa20339c0)] = 'MagazinesGl'),
          (a[(a.Mementos = 0xf93f3569)] = 'Mementos'),
          (a[(a.Mods = 0xc57b725e)] = 'Mods'),
          (a[(a.Origins = 0x9d505c2)] = 'Origins'),
          (a[(a.PlugsGhostsMasterworks = 0xf42d9964)] = 'PlugsGhostsMasterworks'),
          (a[(a.PlugsMasterworksArmorDefault = 0x92810adc)] = 'PlugsMasterworksArmorDefault'),
          (a[(a.PlugsMasterworksWeaponsDefault = 0x2ea40b3e)] = 'PlugsMasterworksWeaponsDefault'),
          (a[(a.Rails = 0x98efd594)] = 'Rails'),
          (a[(a.RandomPerk = 0x43b18bc2)] = 'RandomPerk'),
          (a[(a.SchismBoonsDestinationModsEfficiency = 0xcc1e13bd)] =
            'SchismBoonsDestinationModsEfficiency'),
          (a[(a.SchismBoonsDestinationModsInfo = 0xb898565e)] = 'SchismBoonsDestinationModsInfo'),
          (a[(a.SchismBoonsDestinationModsPlaystyle = 0x1ce0d55b)] =
            'SchismBoonsDestinationModsPlaystyle'),
          (a[(a.Scopes = 0x9c277bce)] = 'Scopes'),
          (a[(a.Shader = 0xb134761e)] = 'Shader'),
          (a[(a.SharedArcFragments = 0x90d71b21)] = 'SharedArcFragments'),
          (a[(a.SharedArcGrenades = 0x18159ecb)] = 'SharedArcGrenades'),
          (a[(a.SharedFragments = 0x727694db)] = 'SharedFragments'),
          (a[(a.SharedPrismFragments = 0xa0b6bd42)] = 'SharedPrismFragments'),
          (a[(a.SharedSolarFragments = 0xb9eb16a6)] = 'SharedSolarFragments'),
          (a[(a.SharedSolarGrenades = 0xc8d45766)] = 'SharedSolarGrenades'),
          (a[(a.SharedStasisGrenades = 0x35ac85c0)] = 'SharedStasisGrenades'),
          (a[(a.SharedStasisTrinkets = 0x500d64d)] = 'SharedStasisTrinkets'),
          (a[(a.SharedStrandFragments = 0x28e2fc69)] = 'SharedStrandFragments'),
          (a[(a.SharedStrandGrenades = 0xa8c799d3)] = 'SharedStrandGrenades'),
          (a[(a.SharedVoidFragments = 0x25442c7)] = 'SharedVoidFragments'),
          (a[(a.SharedVoidGrenades = 0xb8265721)] = 'SharedVoidGrenades'),
          (a[(a.ShipSpawnfx = 0xbe19ad26)] = 'ShipSpawnfx'),
          (a[(a.SocialClansPerks = 0xe85927a0)] = 'SocialClansPerks'),
          (a[(a.SocialClansStaves = 0xebb6b1f9)] = 'SocialClansStaves'),
          (a[(a.StatusEffectTooltip = 0x1c5dd659)] = 'StatusEffectTooltip'),
          (a[(a.Stocks = 0x22725700)] = 'Stocks'),
          (a[(a.TitanArcAspects = 0xce407bb2)] = 'TitanArcAspects'),
          (a[(a.TitanArcClassAbilities = 0x4c65630a)] = 'TitanArcClassAbilities'),
          (a[(a.TitanArcMelee = 0x56ee7c89)] = 'TitanArcMelee'),
          (a[(a.TitanArcMovement = 0x8ff6ab38)] = 'TitanArcMovement'),
          (a[(a.TitanArcSupers = 0x6ef077f7)] = 'TitanArcSupers'),
          (a[(a.TitanPrismAspects = 0x365e5109)] = 'TitanPrismAspects'),
          (a[(a.TitanPrismClassAbilities = 0xe3bec679)] = 'TitanPrismClassAbilities'),
          (a[(a.TitanPrismGrenades = 0xbf0aa6eb)] = 'TitanPrismGrenades'),
          (a[(a.TitanPrismMelee = 0x54ce5b3e)] = 'TitanPrismMelee'),
          (a[(a.TitanPrismMovement = 0xe12dfd41)] = 'TitanPrismMovement'),
          (a[(a.TitanPrismPrismGrenade = 0x8d4d44fe)] = 'TitanPrismPrismGrenade'),
          (a[(a.TitanPrismSupers = 0x35d22302)] = 'TitanPrismSupers'),
          (a[(a.TitanPrismTranscendence = 0x2c3b3523)] = 'TitanPrismTranscendence'),
          (a[(a.TitanSharedAspects = 0xf05a3c63)] = 'TitanSharedAspects'),
          (a[(a.TitanSolarAspects = 0x75761ff9)] = 'TitanSolarAspects'),
          (a[(a.TitanSolarClassAbilities = 0x475de5c9)] = 'TitanSolarClassAbilities'),
          (a[(a.TitanSolarMelee = 0x241deeee)] = 'TitanSolarMelee'),
          (a[(a.TitanSolarMovement = 0x169b7011)] = 'TitanSolarMovement'),
          (a[(a.TitanSolarSupers = 0xa9e0daf2)] = 'TitanSolarSupers'),
          (a[(a.TitanStasisClassAbilities = 0x31497521)] = 'TitanStasisClassAbilities'),
          (a[(a.TitanStasisMelee = 0xdc236906)] = 'TitanStasisMelee'),
          (a[(a.TitanStasisMovement = 0xdd326039)] = 'TitanStasisMovement'),
          (a[(a.TitanStasisSupers = 0x25e4973a)] = 'TitanStasisSupers'),
          (a[(a.TitanStasisTotems = 0x58e82250)] = 'TitanStasisTotems'),
          (a[(a.TitanStrandAspects = 0x134a60c4)] = 'TitanStrandAspects'),
          (a[(a.TitanStrandClassAbilities = 0x93d270f0)] = 'TitanStrandClassAbilities'),
          (a[(a.TitanStrandMelee = 0xe4192f3f)] = 'TitanStrandMelee'),
          (a[(a.TitanStrandMovement = 0x7f88eb36)] = 'TitanStrandMovement'),
          (a[(a.TitanStrandSupers = 0x4068ff35)] = 'TitanStrandSupers'),
          (a[(a.TitanVoidAspects = 0xedd60602)] = 'TitanVoidAspects'),
          (a[(a.TitanVoidClassAbilities = 0xc8ad8f7a)] = 'TitanVoidClassAbilities'),
          (a[(a.TitanVoidMelee = 0xeef04f59)] = 'TitanVoidMelee'),
          (a[(a.TitanVoidMovement = 0x72aef8a8)] = 'TitanVoidMovement'),
          (a[(a.TitanVoidSupers = 0xcec17607)] = 'TitanVoidSupers'),
          (a[(a.Tubes = 0x47ae4aee)] = 'Tubes'),
          (a[(a.V300ArmorSkinsHunterCrucibleArms0 = 0x9c570cea)] =
            'V300ArmorSkinsHunterCrucibleArms0'),
          (a[(a.V300ArmorSkinsHunterCrucibleChest0 = 0x1747f71e)] =
            'V300ArmorSkinsHunterCrucibleChest0'),
          (a[(a.V300ArmorSkinsHunterCrucibleClass0 = 0xef52e327)] =
            'V300ArmorSkinsHunterCrucibleClass0'),
          (a[(a.V300ArmorSkinsHunterCrucibleHead0 = 0x42e1c53b)] =
            'V300ArmorSkinsHunterCrucibleHead0'),
          (a[(a.V300ArmorSkinsHunterCrucibleLegs0 = 0x63129684)] =
            'V300ArmorSkinsHunterCrucibleLegs0'),
          (a[(a.V300ArmorSkinsHunterDeadOrbitArms0 = 0x86b0b0a6)] =
            'V300ArmorSkinsHunterDeadOrbitArms0'),
          (a[(a.V300ArmorSkinsHunterDeadOrbitChest0 = 0xc5f3774a)] =
            'V300ArmorSkinsHunterDeadOrbitChest0'),
          (a[(a.V300ArmorSkinsHunterDeadOrbitClass0 = 0xd0216a5b)] =
            'V300ArmorSkinsHunterDeadOrbitClass0'),
          (a[(a.V300ArmorSkinsHunterDeadOrbitHead0 = 0x8827625f)] =
            'V300ArmorSkinsHunterDeadOrbitHead0'),
          (a[(a.V300ArmorSkinsHunterDeadOrbitLegs0 = 0x69ed99a0)] =
            'V300ArmorSkinsHunterDeadOrbitLegs0'),
          (a[(a.V300ArmorSkinsHunterFutureWarCultArms0 = 0x4010648a)] =
            'V300ArmorSkinsHunterFutureWarCultArms0'),
          (a[(a.V300ArmorSkinsHunterFutureWarCultChest0 = 0xf6881abe)] =
            'V300ArmorSkinsHunterFutureWarCultChest0'),
          (a[(a.V300ArmorSkinsHunterFutureWarCultClass0 = 0xe7de2847)] =
            'V300ArmorSkinsHunterFutureWarCultClass0'),
          (a[(a.V300ArmorSkinsHunterFutureWarCultHead0 = 0xe69cafdb)] =
            'V300ArmorSkinsHunterFutureWarCultHead0'),
          (a[(a.V300ArmorSkinsHunterFutureWarCultLegs0 = 0x6cbeea4)] =
            'V300ArmorSkinsHunterFutureWarCultLegs0'),
          (a[(a.V300ArmorSkinsHunterIronBannerArms0 = 0x8533ac10)] =
            'V300ArmorSkinsHunterIronBannerArms0'),
          (a[(a.V300ArmorSkinsHunterIronBannerChest0 = 0x19339a38)] =
            'V300ArmorSkinsHunterIronBannerChest0'),
          (a[(a.V300ArmorSkinsHunterIronBannerClass0 = 0xb990c9d5)] =
            'V300ArmorSkinsHunterIronBannerClass0'),
          (a[(a.V300ArmorSkinsHunterIronBannerHead0 = 0xa4af9799)] =
            'V300ArmorSkinsHunterIronBannerHead0'),
          (a[(a.V300ArmorSkinsHunterIronBannerLegs0 = 0x9a94036a)] =
            'V300ArmorSkinsHunterIronBannerLegs0'),
          (a[(a.V300ArmorSkinsHunterNewMonarchyArms0 = 0x3646cffb)] =
            'V300ArmorSkinsHunterNewMonarchyArms0'),
          (a[(a.V300ArmorSkinsHunterNewMonarchyChest0 = 0xf64ab755)] =
            'V300ArmorSkinsHunterNewMonarchyChest0'),
          (a[(a.V300ArmorSkinsHunterNewMonarchyClass0 = 0xc1f4b8a8)] =
            'V300ArmorSkinsHunterNewMonarchyClass0'),
          (a[(a.V300ArmorSkinsHunterNewMonarchyHead0 = 0x1a794092)] =
            'V300ArmorSkinsHunterNewMonarchyHead0'),
          (a[(a.V300ArmorSkinsHunterNewMonarchyLegs0 = 0xd9e44d6d)] =
            'V300ArmorSkinsHunterNewMonarchyLegs0'),
          (a[(a.V300ArmorSkinsHunterTrialsArms0 = 0xe3690636)] = 'V300ArmorSkinsHunterTrialsArms0'),
          (a[(a.V300ArmorSkinsHunterTrialsArms1 = 0xe3690637)] = 'V300ArmorSkinsHunterTrialsArms1'),
          (a[(a.V300ArmorSkinsHunterTrialsChest0 = 0xeb17fcfa)] =
            'V300ArmorSkinsHunterTrialsChest0'),
          (a[(a.V300ArmorSkinsHunterTrialsChest1 = 0xeb17fcfb)] =
            'V300ArmorSkinsHunterTrialsChest1'),
          (a[(a.V300ArmorSkinsHunterTrialsClass0 = 0xd623cfcb)] =
            'V300ArmorSkinsHunterTrialsClass0'),
          (a[(a.V300ArmorSkinsHunterTrialsClass1 = 0xd623cfca)] =
            'V300ArmorSkinsHunterTrialsClass1'),
          (a[(a.V300ArmorSkinsHunterTrialsHead0 = 0x656ebaaf)] = 'V300ArmorSkinsHunterTrialsHead0'),
          (a[(a.V300ArmorSkinsHunterTrialsHead1 = 0x656ebaae)] = 'V300ArmorSkinsHunterTrialsHead1'),
          (a[(a.V300ArmorSkinsHunterTrialsLegs0 = 0x2bac8290)] = 'V300ArmorSkinsHunterTrialsLegs0'),
          (a[(a.V300ArmorSkinsHunterTrialsLegs1 = 0x2bac8291)] = 'V300ArmorSkinsHunterTrialsLegs1'),
          (a[(a.V300ArmorSkinsHunterVanguardArms0 = 0x8524b803)] =
            'V300ArmorSkinsHunterVanguardArms0'),
          (a[(a.V300ArmorSkinsHunterVanguardChest0 = 0x2a09a5cd)] =
            'V300ArmorSkinsHunterVanguardChest0'),
          (a[(a.V300ArmorSkinsHunterVanguardClass0 = 0xbc18a0c0)] =
            'V300ArmorSkinsHunterVanguardClass0'),
          (a[(a.V300ArmorSkinsHunterVanguardHead0 = 0xffc9173a)] =
            'V300ArmorSkinsHunterVanguardHead0'),
          (a[(a.V300ArmorSkinsHunterVanguardLegs0 = 0x10efadb5)] =
            'V300ArmorSkinsHunterVanguardLegs0'),
          (a[(a.V300ArmorSkinsTitanCrucibleArms0 = 0xc936cade)] =
            'V300ArmorSkinsTitanCrucibleArms0'),
          (a[(a.V300ArmorSkinsTitanCrucibleChest0 = 0xe3382412)] =
            'V300ArmorSkinsTitanCrucibleChest0'),
          (a[(a.V300ArmorSkinsTitanCrucibleClass0 = 0x6b2cc23)] =
            'V300ArmorSkinsTitanCrucibleClass0'),
          (a[(a.V300ArmorSkinsTitanCrucibleHead0 = 7433047)] = 'V300ArmorSkinsTitanCrucibleHead0'),
          (a[(a.V300ArmorSkinsTitanCrucibleLegs0 = 0xfb8457b8)] =
            'V300ArmorSkinsTitanCrucibleLegs0'),
          (a[(a.V300ArmorSkinsTitanDeadOrbitArms0 = 0xb2455732)] =
            'V300ArmorSkinsTitanDeadOrbitArms0'),
          (a[(a.V300ArmorSkinsTitanDeadOrbitChest0 = 0x86704f76)] =
            'V300ArmorSkinsTitanDeadOrbitChest0'),
          (a[(a.V300ArmorSkinsTitanDeadOrbitClass0 = 0x77c7f01f)] =
            'V300ArmorSkinsTitanDeadOrbitClass0'),
          (a[(a.V300ArmorSkinsTitanDeadOrbitHead0 = 0x8a3efe63)] =
            'V300ArmorSkinsTitanDeadOrbitHead0'),
          (a[(a.V300ArmorSkinsTitanDeadOrbitLegs0 = 0xe37c754c)] =
            'V300ArmorSkinsTitanDeadOrbitLegs0'),
          (a[(a.V300ArmorSkinsTitanFutureWarCultArms0 = 0x803684f6)] =
            'V300ArmorSkinsTitanFutureWarCultArms0'),
          (a[(a.V300ArmorSkinsTitanFutureWarCultChest0 = 0x482181ba)] =
            'V300ArmorSkinsTitanFutureWarCultChest0'),
          (a[(a.V300ArmorSkinsTitanFutureWarCultClass0 = 0x19e09f8b)] =
            'V300ArmorSkinsTitanFutureWarCultClass0'),
          (a[(a.V300ArmorSkinsTitanFutureWarCultHead0 = 0xe673886f)] =
            'V300ArmorSkinsTitanFutureWarCultHead0'),
          (a[(a.V300ArmorSkinsTitanFutureWarCultLegs0 = 0xc8786e50)] =
            'V300ArmorSkinsTitanFutureWarCultLegs0'),
          (a[(a.V300ArmorSkinsTitanIronBannerArms0 = 0x7792aec4)] =
            'V300ArmorSkinsTitanIronBannerArms0'),
          (a[(a.V300ArmorSkinsTitanIronBannerChest0 = 0xf2f84dbc)] =
            'V300ArmorSkinsTitanIronBannerChest0'),
          (a[(a.V300ArmorSkinsTitanIronBannerClass0 = 0x5b63af31)] =
            'V300ArmorSkinsTitanIronBannerClass0'),
          (a[(a.V300ArmorSkinsTitanIronBannerHead0 = 0xc67fb675)] =
            'V300ArmorSkinsTitanIronBannerHead0'),
          (a[(a.V300ArmorSkinsTitanIronBannerLegs0 = 0xeaa600ee)] =
            'V300ArmorSkinsTitanIronBannerLegs0'),
          (a[(a.V300ArmorSkinsTitanNewMonarchyArms0 = 0x7c7d642f)] =
            'V300ArmorSkinsTitanNewMonarchyArms0'),
          (a[(a.V300ArmorSkinsTitanNewMonarchyChest0 = 0x24417189)] =
            'V300ArmorSkinsTitanNewMonarchyChest0'),
          (a[(a.V300ArmorSkinsTitanNewMonarchyClass0 = 0x8e5eb744)] =
            'V300ArmorSkinsTitanNewMonarchyClass0'),
          (a[(a.V300ArmorSkinsTitanNewMonarchyHead0 = 0xaa7b21fe)] =
            'V300ArmorSkinsTitanNewMonarchyHead0'),
          (a[(a.V300ArmorSkinsTitanNewMonarchyLegs0 = 0x856edc51)] =
            'V300ArmorSkinsTitanNewMonarchyLegs0'),
          (a[(a.V300ArmorSkinsTitanTrialsArms0 = 0xf9628de2)] = 'V300ArmorSkinsTitanTrialsArms0'),
          (a[(a.V300ArmorSkinsTitanTrialsArms1 = 0xf9628de3)] = 'V300ArmorSkinsTitanTrialsArms1'),
          (a[(a.V300ArmorSkinsTitanTrialsChest0 = 0x7a3c7c6)] = 'V300ArmorSkinsTitanTrialsChest0'),
          (a[(a.V300ArmorSkinsTitanTrialsChest1 = 0x7a3c7c7)] = 'V300ArmorSkinsTitanTrialsChest1'),
          (a[(a.V300ArmorSkinsTitanTrialsClass0 = 0x1a97f1af)] = 'V300ArmorSkinsTitanTrialsClass0'),
          (a[(a.V300ArmorSkinsTitanTrialsClass1 = 0x1a97f1ae)] = 'V300ArmorSkinsTitanTrialsClass1'),
          (a[(a.V300ArmorSkinsTitanTrialsHead0 = 0x8c5766d3)] = 'V300ArmorSkinsTitanTrialsHead0'),
          (a[(a.V300ArmorSkinsTitanTrialsHead1 = 0x8c5766d2)] = 'V300ArmorSkinsTitanTrialsHead1'),
          (a[(a.V300ArmorSkinsTitanTrialsLegs0 = 0x7339be1c)] = 'V300ArmorSkinsTitanTrialsLegs0'),
          (a[(a.V300ArmorSkinsTitanTrialsLegs1 = 0x7339be1d)] = 'V300ArmorSkinsTitanTrialsLegs1'),
          (a[(a.V300ArmorSkinsTitanVanguardArms0 = 0x47892497)] =
            'V300ArmorSkinsTitanVanguardArms0'),
          (a[(a.V300ArmorSkinsTitanVanguardChest0 = 0xd58108e1)] =
            'V300ArmorSkinsTitanVanguardChest0'),
          (a[(a.V300ArmorSkinsTitanVanguardClass0 = 0x1d73653c)] =
            'V300ArmorSkinsTitanVanguardClass0'),
          (a[(a.V300ArmorSkinsTitanVanguardHead0 = 0x6b7e32c6)] =
            'V300ArmorSkinsTitanVanguardHead0'),
          (a[(a.V300ArmorSkinsTitanVanguardLegs0 = 0x9a0a0fb9)] =
            'V300ArmorSkinsTitanVanguardLegs0'),
          (a[(a.V300ArmorSkinsWarlockCrucibleArms0 = 0xb416b25d)] =
            'V300ArmorSkinsWarlockCrucibleArms0'),
          (a[(a.V300ArmorSkinsWarlockCrucibleChest0 = 0x32ce9ae3)] =
            'V300ArmorSkinsWarlockCrucibleChest0'),
          (a[(a.V300ArmorSkinsWarlockCrucibleClass0 = 0xf12bf9da)] =
            'V300ArmorSkinsWarlockCrucibleClass0'),
          (a[(a.V300ArmorSkinsWarlockCrucibleHead0 = 0xce0ebd84)] =
            'V300ArmorSkinsWarlockCrucibleHead0'),
          (a[(a.V300ArmorSkinsWarlockCrucibleLegs0 = 0x3e9cdeff)] =
            'V300ArmorSkinsWarlockCrucibleLegs0'),
          (a[(a.V300ArmorSkinsWarlockDeadOrbitArms0 = 0x794c97dd)] =
            'V300ArmorSkinsWarlockDeadOrbitArms0'),
          (a[(a.V300ArmorSkinsWarlockDeadOrbitChest0 = 0x26a6e363)] =
            'V300ArmorSkinsWarlockDeadOrbitChest0'),
          (a[(a.V300ArmorSkinsWarlockDeadOrbitClass0 = 0xe504425a)] =
            'V300ArmorSkinsWarlockDeadOrbitClass0'),
          (a[(a.V300ArmorSkinsWarlockDeadOrbitHead0 = 0x9344a304)] =
            'V300ArmorSkinsWarlockDeadOrbitHead0'),
          (a[(a.V300ArmorSkinsWarlockDeadOrbitLegs0 = 0x3d2c47f)] =
            'V300ArmorSkinsWarlockDeadOrbitLegs0'),
          (a[(a.V300ArmorSkinsWarlockFutureWarCultArms0 = 0xc4628feb)] =
            'V300ArmorSkinsWarlockFutureWarCultArms0'),
          (a[(a.V300ArmorSkinsWarlockFutureWarCultChest0 = 0x83500c25)] =
            'V300ArmorSkinsWarlockFutureWarCultChest0'),
          (a[(a.V300ArmorSkinsWarlockFutureWarCultClass0 = 0x4efa0d78)] =
            'V300ArmorSkinsWarlockFutureWarCultClass0'),
          (a[(a.V300ArmorSkinsWarlockFutureWarCultHead0 = 0xebc05c82)] =
            'V300ArmorSkinsWarlockFutureWarCultHead0'),
          (a[(a.V300ArmorSkinsWarlockFutureWarCultLegs0 = 0x57575fd)] =
            'V300ArmorSkinsWarlockFutureWarCultLegs0'),
          (a[(a.V300ArmorSkinsWarlockIronBannerArms0 = 0xe8585bb5)] =
            'V300ArmorSkinsWarlockIronBannerArms0'),
          (a[(a.V300ArmorSkinsWarlockIronBannerChest0 = 0x65b2722b)] =
            'V300ArmorSkinsWarlockIronBannerChest0'),
          (a[(a.V300ArmorSkinsWarlockIronBannerClass0 = 0x3bfecc2)] =
            'V300ArmorSkinsWarlockIronBannerClass0'),
          (a[(a.V300ArmorSkinsWarlockIronBannerHead0 = 0x9798253c)] =
            'V300ArmorSkinsWarlockIronBannerHead0'),
          (a[(a.V300ArmorSkinsWarlockIronBannerLegs0 = 0x464a1297)] =
            'V300ArmorSkinsWarlockIronBannerLegs0'),
          (a[(a.V300ArmorSkinsWarlockNewMonarchyArms0 = 0x9e292120)] =
            'V300ArmorSkinsWarlockNewMonarchyArms0'),
          (a[(a.V300ArmorSkinsWarlockNewMonarchyChest0 = 0x2280a868)] =
            'V300ArmorSkinsWarlockNewMonarchyChest0'),
          (a[(a.V300ArmorSkinsWarlockNewMonarchyClass0 = 0x87f49a45)] =
            'V300ArmorSkinsWarlockNewMonarchyClass0'),
          (a[(a.V300ArmorSkinsWarlockNewMonarchyHead0 = 0x21cd8da9)] =
            'V300ArmorSkinsWarlockNewMonarchyHead0'),
          (a[(a.V300ArmorSkinsWarlockNewMonarchyLegs0 = 0x505f7cda)] =
            'V300ArmorSkinsWarlockNewMonarchyLegs0'),
          (a[(a.V300ArmorSkinsWarlockTrialsArms0 = 0xd8a21b0d)] =
            'V300ArmorSkinsWarlockTrialsArms0'),
          (a[(a.V300ArmorSkinsWarlockTrialsArms1 = 0xd8a21b0c)] =
            'V300ArmorSkinsWarlockTrialsArms1'),
          (a[(a.V300ArmorSkinsWarlockTrialsChest0 = 0x992af7b3)] =
            'V300ArmorSkinsWarlockTrialsChest0'),
          (a[(a.V300ArmorSkinsWarlockTrialsChest1 = 0x992af7b2)] =
            'V300ArmorSkinsWarlockTrialsChest1'),
          (a[(a.V300ArmorSkinsWarlockTrialsClass0 = 0x1c9f18ea)] =
            'V300ArmorSkinsWarlockTrialsClass0'),
          (a[(a.V300ArmorSkinsWarlockTrialsClass1 = 0x1c9f18eb)] =
            'V300ArmorSkinsWarlockTrialsClass1'),
          (a[(a.V300ArmorSkinsWarlockTrialsHead0 = 0x1bd7d6f4)] =
            'V300ArmorSkinsWarlockTrialsHead0'),
          (a[(a.V300ArmorSkinsWarlockTrialsHead1 = 0x1bd7d6f5)] =
            'V300ArmorSkinsWarlockTrialsHead1'),
          (a[(a.V300ArmorSkinsWarlockTrialsLegs0 = 0x9dafcf)] = 'V300ArmorSkinsWarlockTrialsLegs0'),
          (a[(a.V300ArmorSkinsWarlockTrialsLegs1 = 0x9dafce)] = 'V300ArmorSkinsWarlockTrialsLegs1'),
          (a[(a.V300ArmorSkinsWarlockVanguardArms0 = 0x56e51894)] =
            'V300ArmorSkinsWarlockVanguardArms0'),
          (a[(a.V300ArmorSkinsWarlockVanguardChest0 = 0x7e2106ac)] =
            'V300ArmorSkinsWarlockVanguardChest0'),
          (a[(a.V300ArmorSkinsWarlockVanguardClass0 = 0x1efb3ce1)] =
            'V300ArmorSkinsWarlockVanguardClass0'),
          (a[(a.V300ArmorSkinsWarlockVanguardHead0 = 0x2ad752c5)] =
            'V300ArmorSkinsWarlockVanguardHead0'),
          (a[(a.V300ArmorSkinsWarlockVanguardLegs0 = 0x4ebeee9e)] =
            'V300ArmorSkinsWarlockVanguardLegs0'),
          (a[(a.V300GhostsModsPerks = 0x6c863692)] = 'V300GhostsModsPerks'),
          (a[(a.V300NewAutoRifle0Masterwork = 0xd09d4fea)] = 'V300NewAutoRifle0Masterwork'),
          (a[(a.V300NewAutoRifle1Masterwork = 0x72ef3dd5)] = 'V300NewAutoRifle1Masterwork'),
          (a[(a.V300NewFusionRifle0Masterwork = 0x393eeaaf)] = 'V300NewFusionRifle0Masterwork'),
          (a[(a.V300NewGrenadeLauncher0Masterwork = 0x272a6f35)] =
            'V300NewGrenadeLauncher0Masterwork'),
          (a[(a.V300NewGrenadeLauncher1Masterwork = 0xfbde824a)] =
            'V300NewGrenadeLauncher1Masterwork'),
          (a[(a.V300NewHandCannon0Masterwork = 0x2c7bc661)] = 'V300NewHandCannon0Masterwork'),
          (a[(a.V300NewHandCannon1Masterwork = 0xfd47f306)] = 'V300NewHandCannon1Masterwork'),
          (a[(a.V300NewPulseRifle0Masterwork = 0x1f03ef2c)] = 'V300NewPulseRifle0Masterwork'),
          (a[(a.V300NewPulseRifle1Masterwork = 0xc514eb2f)] = 'V300NewPulseRifle1Masterwork'),
          (a[(a.V300NewRocketLauncher0Masterwork = 0x3cc9ae8b)] =
            'V300NewRocketLauncher0Masterwork'),
          (a[(a.V300NewScoutRifle0Masterwork = 0x510b7309)] = 'V300NewScoutRifle0Masterwork'),
          (a[(a.V300NewShotgun0Masterwork = 0xd58fd1e2)] = 'V300NewShotgun0Masterwork'),
          (a[(a.V300NewShotgun1Masterwork = 0x73a8524d)] = 'V300NewShotgun1Masterwork'),
          (a[(a.V300NewSidearm1Masterwork = 0x658ed75a)] = 'V300NewSidearm1Masterwork'),
          (a[(a.V300NewSniperRifle0Masterwork = 0xe9febe)] = 'V300NewSniperRifle0Masterwork'),
          (a[(a.V300NewSniperRifle0Skins = 0x9fb13027)] = 'V300NewSniperRifle0Skins'),
          (a[(a.V300NewSniperRifle1Masterwork = 0x45998a19)] = 'V300NewSniperRifle1Masterwork'),
          (a[(a.V300NewSubmachinegun1Masterwork = 0x108994e6)] = 'V300NewSubmachinegun1Masterwork'),
          (a[(a.V300PlugsMasterworksGenericArmorSuperDr = 0xd36debd3)] =
            'V300PlugsMasterworksGenericArmorSuperDr'),
          (a[(a.V300PlugsMasterworksGenericWeaponsKills = 0x7db7f382)] =
            'V300PlugsMasterworksGenericWeaponsKills'),
          (a[(a.V300PlugsMasterworksGenericWeaponsKillsPvp = 0xb2327a95)] =
            'V300PlugsMasterworksGenericWeaponsKillsPvp'),
          (a[(a.V300RepackageAutoRifle0Masterwork = 0xf1dc3927)] =
            'V300RepackageAutoRifle0Masterwork'),
          (a[(a.V300RepackageScoutRifle0Masterwork = 0xeb9f9e92)] =
            'V300RepackageScoutRifle0Masterwork'),
          (a[(a.V300VehiclesModControls = 0x5482601d)] = 'V300VehiclesModControls'),
          (a[(a.V300VehiclesModFunction = 0xd2cdd543)] = 'V300VehiclesModFunction'),
          (a[(a.V300VehiclesModHorn = 0x32b9ceb0)] = 'V300VehiclesModHorn'),
          (a[(a.V300VehiclesModSpeed = 0xdce6530)] = 'V300VehiclesModSpeed'),
          (a[(a.V300WeaponDamageTypeAttack = 0x282d1fb4)] = 'V300WeaponDamageTypeAttack'),
          (a[(a.V300WeaponDamageTypeEnergy = 0x576d3c7c)] = 'V300WeaponDamageTypeEnergy'),
          (a[(a.V300WeaponDamageTypeKinetic = 0x1828324d)] = 'V300WeaponDamageTypeKinetic'),
          (a[(a.V310ArmorSkinsHunterRaidArms0 = 0xd41cf35a)] = 'V310ArmorSkinsHunterRaidArms0'),
          (a[(a.V310ArmorSkinsHunterRaidChest0 = 0x2b77fae)] = 'V310ArmorSkinsHunterRaidChest0'),
          (a[(a.V310ArmorSkinsHunterRaidClass0 = 0x15ad3c77)] = 'V310ArmorSkinsHunterRaidClass0'),
          (a[(a.V310ArmorSkinsHunterRaidHead0 = 0x381d466b)] = 'V310ArmorSkinsHunterRaidHead0'),
          (a[(a.V310ArmorSkinsHunterRaidLegs0 = 0x1f013094)] = 'V310ArmorSkinsHunterRaidLegs0'),
          (a[(a.V310ArmorSkinsTitanRaidArms0 = 0xe3a9fffc)] = 'V310ArmorSkinsTitanRaidArms0'),
          (a[(a.V310ArmorSkinsTitanRaidChest0 = 0x83a2d664)] = 'V310ArmorSkinsTitanRaidChest0'),
          (a[(a.V310ArmorSkinsTitanRaidClass0 = 0xc9457db9)] = 'V310ArmorSkinsTitanRaidClass0'),
          (a[(a.V310ArmorSkinsTitanRaidHead0 = 0xbcc4af0d)] = 'V310ArmorSkinsTitanRaidHead0'),
          (a[(a.V310ArmorSkinsTitanRaidLegs0 = 0xa83be306)] = 'V310ArmorSkinsTitanRaidLegs0'),
          (a[(a.V310ArmorSkinsWarlockRaidArms0 = 0xc4f124df)] = 'V310ArmorSkinsWarlockRaidArms0'),
          (a[(a.V310ArmorSkinsWarlockRaidChest0 = 0x36de6219)] = 'V310ArmorSkinsWarlockRaidChest0'),
          (a[(a.V310ArmorSkinsWarlockRaidClass0 = 0x87ad5fd4)] = 'V310ArmorSkinsWarlockRaidClass0'),
          (a[(a.V310ArmorSkinsWarlockRaidHead0 = 0x6e89136e)] = 'V310ArmorSkinsWarlockRaidHead0'),
          (a[(a.V310ArmorSkinsWarlockRaidLegs0 = 0x84a4baa1)] = 'V310ArmorSkinsWarlockRaidLegs0'),
          (a[(a.V310NewAutoRifle0Masterwork = 0xcec7f14b)] = 'V310NewAutoRifle0Masterwork'),
          (a[(a.V310NewAutoRifle0Skins = 0x176113e8)] = 'V310NewAutoRifle0Skins'),
          (a[(a.V310NewGrenadeLauncher0Masterwork = 0x66c85048)] =
            'V310NewGrenadeLauncher0Masterwork'),
          (a[(a.V310NewGrenadeLauncher0Skins = 0xe85b253d)] = 'V310NewGrenadeLauncher0Skins'),
          (a[(a.V310NewHandCannon0Masterwork = 0x898ed992)] = 'V310NewHandCannon0Masterwork'),
          (a[(a.V310NewHandCannon0Skins = 0xcc666533)] = 'V310NewHandCannon0Skins'),
          (a[(a.V310RepackageFusionRifle0Masterwork = 0xceadda03)] =
            'V310RepackageFusionRifle0Masterwork'),
          (a[(a.V310RepackageFusionRifle0Skins = 0x4ef46790)] = 'V310RepackageFusionRifle0Skins'),
          (a[(a.V310RepackageScoutRifle0Masterwork = 0x9662ad4d)] =
            'V310RepackageScoutRifle0Masterwork'),
          (a[(a.V310RepackageScoutRifle0Skins = 0x6c2de676)] = 'V310RepackageScoutRifle0Skins'),
          (a[(a.V320ArmorSkinsHunterRaidArms0 = 0x90c24d5b)] = 'V320ArmorSkinsHunterRaidArms0'),
          (a[(a.V320ArmorSkinsHunterRaidChest0 = 0xc6b115b5)] = 'V320ArmorSkinsHunterRaidChest0'),
          (a[(a.V320ArmorSkinsHunterRaidClass0 = 0x790ff488)] = 'V320ArmorSkinsHunterRaidClass0'),
          (a[(a.V320ArmorSkinsHunterRaidHead0 = 0x7770ba72)] = 'V320ArmorSkinsHunterRaidHead0'),
          (a[(a.V320ArmorSkinsHunterRaidLegs0 = 0x345fcacd)] = 'V320ArmorSkinsHunterRaidLegs0'),
          (a[(a.V320ArmorSkinsTitanRaidArms0 = 0x7ffa1597)] = 'V320ArmorSkinsTitanRaidArms0'),
          (a[(a.V320ArmorSkinsTitanRaidChest0 = 0xaf4c6be1)] = 'V320ArmorSkinsTitanRaidChest0'),
          (a[(a.V320ArmorSkinsTitanRaidClass0 = 0xf73ec83c)] = 'V320ArmorSkinsTitanRaidClass0'),
          (a[(a.V320ArmorSkinsTitanRaidHead0 = 0xa3ef23c6)] = 'V320ArmorSkinsTitanRaidHead0'),
          (a[(a.V320ArmorSkinsTitanRaidLegs0 = 0xd27b00b9)] = 'V320ArmorSkinsTitanRaidLegs0'),
          (a[(a.V320ArmorSkinsWarlockRaidArms0 = 0x32024c28)] = 'V320ArmorSkinsWarlockRaidArms0'),
          (a[(a.V320ArmorSkinsWarlockRaidChest0 = 0xab2995a0)] = 'V320ArmorSkinsWarlockRaidChest0'),
          (a[(a.V320ArmorSkinsWarlockRaidClass0 = 0x6b38d8dd)] = 'V320ArmorSkinsWarlockRaidClass0'),
          (a[(a.V320ArmorSkinsWarlockRaidHead0 = 0x81fda251)] = 'V320ArmorSkinsWarlockRaidHead0'),
          (a[(a.V320ArmorSkinsWarlockRaidLegs0 = 0x57e1db82)] = 'V320ArmorSkinsWarlockRaidLegs0'),
          (a[(a.V320NewScoutRifle0Masterwork = 0x52162b33)] = 'V320NewScoutRifle0Masterwork'),
          (a[(a.V320NewScoutRifle0Skins = 0xbfa52100)] = 'V320NewScoutRifle0Skins'),
          (a[(a.V320NewSubmachinegun0Masterwork = 0xeb07684b)] = 'V320NewSubmachinegun0Masterwork'),
          (a[(a.V320NewSubmachinegun0Skins = 0x3a4350e8)] = 'V320NewSubmachinegun0Skins'),
          (a[(a.V320NewSword0Masterwork = 0x6989d65)] = 'V320NewSword0Masterwork'),
          (a[(a.V320NewSword0Skins = 0x8ff44d3e)] = 'V320NewSword0Skins'),
          (a[(a.V320RepackageAutoRifle0Masterwork = 0xcc71d4c5)] =
            'V320RepackageAutoRifle0Masterwork'),
          (a[(a.V320RepackageAutoRifle0Skins = 0xa944741e)] = 'V320RepackageAutoRifle0Skins'),
          (a[(a.V320RepackageFusionRifle0Masterwork = 0xd3a6fbbc)] =
            'V320RepackageFusionRifle0Masterwork'),
          (a[(a.V320RepackageFusionRifle0Skins = 0xf1836b29)] = 'V320RepackageFusionRifle0Skins'),
          (a[(a.V320RepackageSniperRifle0Masterwork = 0x1acb9e35)] =
            'V320RepackageSniperRifle0Masterwork'),
          (a[(a.V320RepackageSniperRifle0Skins = 0x5ea0028e)] = 'V320RepackageSniperRifle0Skins'),
          (a[(a.V350ParadeArmsGlow = 0xd66ec873)] = 'V350ParadeArmsGlow'),
          (a[(a.V350ParadeChestGlow = 0x6cfef61d)] = 'V350ParadeChestGlow'),
          (a[(a.V350ParadeClassGlow = 0xd54fa6d0)] = 'V350ParadeClassGlow'),
          (a[(a.V350ParadeHeadGlow = 0xd8ec48e2)] = 'V350ParadeHeadGlow'),
          (a[(a.V350ParadeLegsGlow = 0x42b27405)] = 'V350ParadeLegsGlow'),
          (a[(a.V350PlugsArmorSkinsHunterBrokenArms0 = 0x123cf8a7)] =
            'V350PlugsArmorSkinsHunterBrokenArms0'),
          (a[(a.V350PlugsArmorSkinsHunterBrokenChest0 = 0x68feccd1)] =
            'V350PlugsArmorSkinsHunterBrokenChest0'),
          (a[(a.V350PlugsArmorSkinsHunterBrokenClass0 = 0xd28db1ec)] =
            'V350PlugsArmorSkinsHunterBrokenClass0'),
          (a[(a.V350PlugsArmorSkinsHunterBrokenHead0 = 0xca77f5d6)] =
            'V350PlugsArmorSkinsHunterBrokenHead0'),
          (a[(a.V350PlugsArmorSkinsHunterBrokenLegs0 = 0xe13300e9)] =
            'V350PlugsArmorSkinsHunterBrokenLegs0'),
          (a[(a.V350PlugsArmorSkinsHunterMendedArms0 = 0xa11721e7)] =
            'V350PlugsArmorSkinsHunterMendedArms0'),
          (a[(a.V350PlugsArmorSkinsHunterMendedChest0 = 0xa6e8611)] =
            'V350PlugsArmorSkinsHunterMendedChest0'),
          (a[(a.V350PlugsArmorSkinsHunterMendedClass0 = 0x8d4a202c)] =
            'V350PlugsArmorSkinsHunterMendedClass0'),
          (a[(a.V350PlugsArmorSkinsHunterMendedHead0 = 0x59521f16)] =
            'V350PlugsArmorSkinsHunterMendedHead0'),
          (a[(a.V350PlugsArmorSkinsHunterMendedLegs0 = 0x56c07529)] =
            'V350PlugsArmorSkinsHunterMendedLegs0'),
          (a[(a.V350PlugsArmorSkinsTitanBrokenArms0 = 0x91c9aac9)] =
            'V350PlugsArmorSkinsTitanBrokenArms0'),
          (a[(a.V350PlugsArmorSkinsTitanBrokenChest0 = 0x53435ccf)] =
            'V350PlugsArmorSkinsTitanBrokenChest0'),
          (a[(a.V350PlugsArmorSkinsTitanBrokenClass0 = 0xb6e4a05e)] =
            'V350PlugsArmorSkinsTitanBrokenClass0'),
          (a[(a.V350PlugsArmorSkinsTitanBrokenHead0 = 0x76249678)] =
            'V350PlugsArmorSkinsTitanBrokenHead0'),
          (a[(a.V350PlugsArmorSkinsTitanBrokenLegs0 = 0xa330589b)] =
            'V350PlugsArmorSkinsTitanBrokenLegs0'),
          (a[(a.V350PlugsArmorSkinsTitanMendedArms0 = 0x8eba2009)] =
            'V350PlugsArmorSkinsTitanMendedArms0'),
          (a[(a.V350PlugsArmorSkinsTitanMendedChest0 = 0x2ed8cb0f)] =
            'V350PlugsArmorSkinsTitanMendedChest0'),
          (a[(a.V350PlugsArmorSkinsTitanMendedClass0 = 0x7ba9559e)] =
            'V350PlugsArmorSkinsTitanMendedClass0'),
          (a[(a.V350PlugsArmorSkinsTitanMendedHead0 = 0x8c6353b8)] =
            'V350PlugsArmorSkinsTitanMendedHead0'),
          (a[(a.V350PlugsArmorSkinsTitanMendedLegs0 = 0x9da7f7db)] =
            'V350PlugsArmorSkinsTitanMendedLegs0'),
          (a[(a.V350PlugsArmorSkinsWarlockBrokenArms0 = 0xec4bf7a2)] =
            'V350PlugsArmorSkinsWarlockBrokenArms0'),
          (a[(a.V350PlugsArmorSkinsWarlockBrokenChest0 = 0x93c7c286)] =
            'V350PlugsArmorSkinsWarlockBrokenChest0'),
          (a[(a.V350PlugsArmorSkinsWarlockBrokenClass0 = 0xc008a16f)] =
            'V350PlugsArmorSkinsWarlockBrokenClass0'),
          (a[(a.V350PlugsArmorSkinsWarlockBrokenHead0 = 0x81b9a693)] =
            'V350PlugsArmorSkinsWarlockBrokenHead0'),
          (a[(a.V350PlugsArmorSkinsWarlockBrokenLegs0 = 0x81ea45dc)] =
            'V350PlugsArmorSkinsWarlockBrokenLegs0'),
          (a[(a.V350PlugsArmorSkinsWarlockMendedArms0 = 0x73f0011e)] =
            'V350PlugsArmorSkinsWarlockMendedArms0'),
          (a[(a.V350PlugsArmorSkinsWarlockMendedChest0 = 0xa7dab152)] =
            'V350PlugsArmorSkinsWarlockMendedChest0'),
          (a[(a.V350PlugsArmorSkinsWarlockMendedClass0 = 0xcdcfc263)] =
            'V350PlugsArmorSkinsWarlockMendedClass0'),
          (a[(a.V350PlugsArmorSkinsWarlockMendedHead0 = 0xab290e97)] =
            'V350PlugsArmorSkinsWarlockMendedHead0'),
          (a[(a.V350PlugsArmorSkinsWarlockMendedLegs0 = 0x8cef45f8)] =
            'V350PlugsArmorSkinsWarlockMendedLegs0'),
          (a[(a.V400ActivitiesGambitAutoRifle0Skins = 0x807bff9a)] =
            'V400ActivitiesGambitAutoRifle0Skins'),
          (a[(a.V400ActivitiesGambitHandCannon0Skins = 0x52ee6e15)] =
            'V400ActivitiesGambitHandCannon0Skins'),
          (a[(a.V400ActivitiesGambitPulseRifle0Skins = 0x814a97d6)] =
            'V400ActivitiesGambitPulseRifle0Skins'),
          (a[(a.V400ActivitiesGambitRocketLauncher0Skins = 0xbd0c54d3)] =
            'V400ActivitiesGambitRocketLauncher0Skins'),
          (a[(a.V400ActivitiesGambitScoutRifle0Skins = 0x1b95ae6d)] =
            'V400ActivitiesGambitScoutRifle0Skins'),
          (a[(a.V400ActivitiesGambitShotgun0Skins = 0xeea7cc3c)] =
            'V400ActivitiesGambitShotgun0Skins'),
          (a[(a.V400ActivitiesGambitSniperRifle0Skins = 0x24a39892)] =
            'V400ActivitiesGambitSniperRifle0Skins'),
          (a[(a.V400ActivitiesGambitSubmachinegun0Skins = 0xbe3ef0e1)] =
            'V400ActivitiesGambitSubmachinegun0Skins'),
          (a[(a.V400DestinationsTangledShoreShotgun0Skins = 0xea6fbe5d)] =
            'V400DestinationsTangledShoreShotgun0Skins'),
          (a[(a.V400EmptyExoticMasterwork = 0x72334481)] = 'V400EmptyExoticMasterwork'),
          (a[(a.V400EndgameQuestsBow0Skins = 0x636ba7b1)] = 'V400EndgameQuestsBow0Skins'),
          (a[(a.V400EndgameQuestsGrenadeLauncher0Skins = 0xba2eddda)] =
            'V400EndgameQuestsGrenadeLauncher0Skins'),
          (a[(a.V400EndgameQuestsSidearm1Skins = 0xfdf8d637)] = 'V400EndgameQuestsSidearm1Skins'),
          (a[(a.V400FactionsVanguardFusionRifle0Skins = 0xe7de2bed)] =
            'V400FactionsVanguardFusionRifle0Skins'),
          (a[(a.V400NewAutoRifle0Masterwork = 0x81beeaee)] = 'V400NewAutoRifle0Masterwork'),
          (a[(a.V400NewAutoRifle0Skins = 0x3f8983b4)] = 'V400NewAutoRifle0Skins'),
          (a[(a.V400NewBow0Masterwork = 0x484400e6)] = 'V400NewBow0Masterwork'),
          (a[(a.V400NewBow0Skins = 0x507477c)] = 'V400NewBow0Skins'),
          (a[(a.V400NewBow1Masterwork = 0xf3ec44d)] = 'V400NewBow1Masterwork'),
          (a[(a.V400NewBow1Skins = 0x307e3e01)] = 'V400NewBow1Skins'),
          (a[(a.V400NewFusionRifle0Masterwork = 0x85dea453)] = 'V400NewFusionRifle0Masterwork'),
          (a[(a.V400NewFusionRifle0Skins = 0x6eb318a3)] = 'V400NewFusionRifle0Skins'),
          (a[(a.V400NewHandCannon0Masterwork = 0x4930b54f)] = 'V400NewHandCannon0Masterwork'),
          (a[(a.V400NewHandCannon0Skins = 0x6ade7b77)] = 'V400NewHandCannon0Skins'),
          (a[(a.V400NewRocketLauncher0Masterwork = 0xe1594205)] =
            'V400NewRocketLauncher0Masterwork'),
          (a[(a.V400NewRocketLauncher0Skins = 0x75d4bba9)] = 'V400NewRocketLauncher0Skins'),
          (a[(a.V400NewSword0Masterwork = 0x30177db9)] = 'V400NewSword0Masterwork'),
          (a[(a.V400NewSword0Skins = 0x676b377d)] = 'V400NewSword0Skins'),
          (a[(a.V400NewTraceRifle0Masterwork = 0xe791b756)] = 'V400NewTraceRifle0Masterwork'),
          (a[(a.V400NewTraceRifle0Skins = 0xd75a527c)] = 'V400NewTraceRifle0Skins'),
          (a[(a.V400PlugsArmorMasterworksStatResistance1 = 0x5a3ff73e)] =
            'V400PlugsArmorMasterworksStatResistance1'),
          (a[(a.V400PlugsArmorMasterworksStatResistance2 = 0x5a3ff73d)] =
            'V400PlugsArmorMasterworksStatResistance2'),
          (a[(a.V400PlugsArmorMasterworksStatResistance3 = 0x5a3ff73c)] =
            'V400PlugsArmorMasterworksStatResistance3'),
          (a[(a.V400PlugsArmorMasterworksStatResistance4 = 0x5a3ff73b)] =
            'V400PlugsArmorMasterworksStatResistance4'),
          (a[(a.V400PlugsWeaponsMasterworks = 0xbdda07fd)] = 'V400PlugsWeaponsMasterworks'),
          (a[(a.V400PlugsWeaponsMasterworksStatAccuracy = 0x49cb0a04)] =
            'V400PlugsWeaponsMasterworksStatAccuracy'),
          (a[(a.V400PlugsWeaponsMasterworksStatBlastRadius = 0x6e2064b8)] =
            'V400PlugsWeaponsMasterworksStatBlastRadius'),
          (a[(a.V400PlugsWeaponsMasterworksStatChargeTime = 0xa8872381)] =
            'V400PlugsWeaponsMasterworksStatChargeTime'),
          (a[(a.V400PlugsWeaponsMasterworksStatDamage = 0x928e7ef8)] =
            'V400PlugsWeaponsMasterworksStatDamage'),
          (a[(a.V400PlugsWeaponsMasterworksStatDrawTime = 0x1cbbcfaf)] =
            'V400PlugsWeaponsMasterworksStatDrawTime'),
          (a[(a.V400PlugsWeaponsMasterworksStatHandling = 0xbe88014)] =
            'V400PlugsWeaponsMasterworksStatHandling'),
          (a[(a.V400PlugsWeaponsMasterworksStatHeatEfficiency = 0x91439b47)] =
            'V400PlugsWeaponsMasterworksStatHeatEfficiency'),
          (a[(a.V400PlugsWeaponsMasterworksStatPersistence = 0x32ef5ba8)] =
            'V400PlugsWeaponsMasterworksStatPersistence'),
          (a[(a.V400PlugsWeaponsMasterworksStatProjectileSpeed = 0x8a600ef6)] =
            'V400PlugsWeaponsMasterworksStatProjectileSpeed'),
          (a[(a.V400PlugsWeaponsMasterworksStatRange = 0x52fbdc0e)] =
            'V400PlugsWeaponsMasterworksStatRange'),
          (a[(a.V400PlugsWeaponsMasterworksStatReload = 0x2ac66b0c)] =
            'V400PlugsWeaponsMasterworksStatReload'),
          (a[(a.V400PlugsWeaponsMasterworksStatStability = 0x690963b0)] =
            'V400PlugsWeaponsMasterworksStatStability'),
          (a[(a.V400PlugsWeaponsMasterworksStatVentSpeed = 0xab788402)] =
            'V400PlugsWeaponsMasterworksStatVentSpeed'),
          (a[(a.V400PlugsWeaponsMasterworksTrackers = 0xafb3306e)] =
            'V400PlugsWeaponsMasterworksTrackers'),
          (a[(a.V400QuestsBow1Skins = 0xa6b70658)] = 'V400QuestsBow1Skins'),
          (a[(a.V400RepackageHandCannon0Masterwork = 0x9c426d10)] =
            'V400RepackageHandCannon0Masterwork'),
          (a[(a.V400RepackageHandCannon0Skins = 0x1cf25a32)] = 'V400RepackageHandCannon0Skins'),
          (a[(a.V400RepackageLinearFunsionRifle0Skins = 0xf1731102)] =
            'V400RepackageLinearFunsionRifle0Skins'),
          (a[(a.V400RepackageLinearFusionRifle0Masterwork = 0x39e0fc64)] =
            'V400RepackageLinearFusionRifle0Masterwork'),
          (a[(a.V400RepackageShotgun0Masterwork = 0x9b97667b)] = 'V400RepackageShotgun0Masterwork'),
          (a[(a.V400RepackageShotgun0Skins = 0x81002613)] = 'V400RepackageShotgun0Skins'),
          (a[(a.V400RepackageShotgun1Masterwork = 0x34acd4cc)] = 'V400RepackageShotgun1Masterwork'),
          (a[(a.V400RepackagedShotgun1Skins = 0x14e0baec)] = 'V400RepackagedShotgun1Skins'),
          (a[(a.V400WeaponModDamage = 0x3a103d13)] = 'V400WeaponModDamage'),
          (a[(a.V400WeaponModEmpty = 0xeb2dcb93)] = 'V400WeaponModEmpty'),
          (a[(a.V400WeaponModGuns = 0x1e6f0bf1)] = 'V400WeaponModGuns'),
          (a[(a.V400WeaponModMagazine = 0xf39abe92)] = 'V400WeaponModMagazine'),
          (a[(a.V404ArmorFotlMasksAbyssPerks = 0x1b4804ed)] = 'V404ArmorFotlMasksAbyssPerks'),
          (a[(a.V404RepackageMachinegun0Masterwork = 0x15a5685e)] =
            'V404RepackageMachinegun0Masterwork'),
          (a[(a.V404RepackageMachinegun0Skins = 0xfeb627a4)] = 'V404RepackageMachinegun0Skins'),
          (a[(a.V410ActivitiesBlackArmoryMachinegun0Skins = 0xd915f212)] =
            'V410ActivitiesBlackArmoryMachinegun0Skins'),
          (a[(a.V410ActivitiesCrimsonBow0Skins = 0x5abc70ca)] = 'V410ActivitiesCrimsonBow0Skins'),
          (a[(a.V410ActivitiesPinnacleFusionRifle0Skins = 0xef1e561c)] =
            'V410ActivitiesPinnacleFusionRifle0Skins'),
          (a[(a.V410NewBow0Masterwork = 0xe293077d)] = 'V410NewBow0Masterwork'),
          (a[(a.V410NewBow0Skins = 0x3a3bc2a9)] = 'V410NewBow0Skins'),
          (a[(a.V410NewGrenadeLauncher0Masterwork = 0xd6aab230)] =
            'V410NewGrenadeLauncher0Masterwork'),
          (a[(a.V410NewGrenadeLauncher0Skins = 0x352d0c42)] = 'V410NewGrenadeLauncher0Skins'),
          (a[(a.V410NewScoutRifle0Masterwork = 0x28376794)] = 'V410NewScoutRifle0Masterwork'),
          (a[(a.V410NewScoutRifle0Skins = 0x1eee886e)] = 'V410NewScoutRifle0Skins'),
          (a[(a.V410NewSniperRifle0Masterwork = 0x1ffd3833)] = 'V410NewSniperRifle0Masterwork'),
          (a[(a.V410NewSniperRifle0Skins = 0x7566940b)] = 'V410NewSniperRifle0Skins'),
          (a[(a.V410RepackageHandCannon0Masterwork = 0xb90a03)] =
            'V410RepackageHandCannon0Masterwork'),
          (a[(a.V410RepackageHandCannon0Skins = 0x77e03183)] = 'V410RepackageHandCannon0Skins'),
          (a[(a.V420CruciblePulseRifle0Skins = 0x8a668825)] = 'V420CruciblePulseRifle0Skins'),
          (a[(a.V420HunterHead0Skins = 999254)] = 'V420HunterHead0Skins'),
          (a[(a.V420MambaAutoRifle0Skins = 0x1985cdf0)] = 'V420MambaAutoRifle0Skins'),
          (a[(a.V420MambaGrenadeLauncher0Skins = 0x23e544d5)] = 'V420MambaGrenadeLauncher0Skins'),
          (a[(a.V420MambaHandCannon0Skins = 0x87217a9b)] = 'V420MambaHandCannon0Skins'),
          (a[(a.V420MambaPulseRifle0Skins = 0xe63f0370)] = 'V420MambaPulseRifle0Skins'),
          (a[(a.V420MambaScoutRifle0Skins = 0xae970f2f)] = 'V420MambaScoutRifle0Skins'),
          (a[(a.V420MambaShotgun0Skins = 0xe09b8ce)] = 'V420MambaShotgun0Skins'),
          (a[(a.V420MambaSidearm0Skins = 0xefdb1d87)] = 'V420MambaSidearm0Skins'),
          (a[(a.V420MambaSniperRifle0Skins = 0x617b96d8)] = 'V420MambaSniperRifle0Skins'),
          (a[(a.V420MambaSubmachinegun0Skins = 0x76f56bc3)] = 'V420MambaSubmachinegun0Skins'),
          (a[(a.V420NewFusionRifle0Skins = 0xb3c87f39)] = 'V420NewFusionRifle0Skins'),
          (a[(a.V420NewLinearFusionRifle0Masterwork = 0x6abe2eb5)] =
            'V420NewLinearFusionRifle0Masterwork'),
          (a[(a.V420PinnacleMachinegun0Skins = 0xe70be9d3)] = 'V420PinnacleMachinegun0Skins'),
          (a[(a.V420PinnacleScoutRifle0Skins = 0x6a4e6fef)] = 'V420PinnacleScoutRifle0Skins'),
          (a[(a.V420PinnacleSubmachinegun0Skins = 0x92104483)] = 'V420PinnacleSubmachinegun0Skins'),
          (a[(a.V420PlugsWeaponsMasterworksToggleVfx = 0x13035fd1)] =
            'V420PlugsWeaponsMasterworksToggleVfx'),
          (a[(a.V420RepackageHandCannon0Masterwork = 0xd904d026)] =
            'V420RepackageHandCannon0Masterwork'),
          (a[(a.V420RepackageHandCannon0Skins = 0x9034a4e4)] = 'V420RepackageHandCannon0Skins'),
          (a[(a.V420RepackagePulseRifle0Masterwork = 0x67ad980f)] =
            'V420RepackagePulseRifle0Masterwork'),
          (a[(a.V420RepackagePulseRifle0Skins = 0x57eb4f07)] = 'V420RepackagePulseRifle0Skins'),
          (a[(a.V420TitanHead0Skins = 0xb8229d02)] = 'V420TitanHead0Skins'),
          (a[(a.V420WarlockHead0Skins = 0x4a0011f3)] = 'V420WarlockHead0Skins'),
          (a[(a.V450ActivitiesCaluseumFusionRifle0Skins = 0x53f029b7)] =
            'V450ActivitiesCaluseumFusionRifle0Skins'),
          (a[(a.V450ActivitiesCaluseumHandCannon0Skins = 0x430ff3ab)] =
            'V450ActivitiesCaluseumHandCannon0Skins'),
          (a[(a.V450ActivitiesCaluseumMachinegun0Skins = 0x75e4eac3)] =
            'V450ActivitiesCaluseumMachinegun0Skins'),
          (a[(a.V450ActivitiesCaluseumShotgun0Skins = 0x385dc01e)] =
            'V450ActivitiesCaluseumShotgun0Skins'),
          (a[(a.V450ActivitiesCaluseumSidearm0Skins = 0x58902bf7)] =
            'V450ActivitiesCaluseumSidearm0Skins'),
          (a[(a.V450ActivitiesCaluseumSniperRifle0Skins = 0x359636c8)] =
            'V450ActivitiesCaluseumSniperRifle0Skins'),
          (a[(a.V450ActivitiesCaluseumSubmachinegun0Skins = 0xe3e51613)] =
            'V450ActivitiesCaluseumSubmachinegun0Skins'),
          (a[(a.V450ActivitiesPinnacleBow0Skins = 0xa2669589)] = 'V450ActivitiesPinnacleBow0Skins'),
          (a[(a.V450ActivitiesPinnacleGrenadeLauncher0Skins = 0xff5a8fe2)] =
            'V450ActivitiesPinnacleGrenadeLauncher0Skins'),
          (a[(a.V450ActivitiesPinnacleSniperRifle0Skins = 0x6f3f8d2b)] =
            'V450ActivitiesPinnacleSniperRifle0Skins'),
          (a[(a.V450NewHandCannon0Masterwork = 0x5b7bebb0)] = 'V450NewHandCannon0Masterwork'),
          (a[(a.V450NewHandCannon0Skins = 0xb8302a22)] = 'V450NewHandCannon0Skins'),
          (a[(a.V450NewSubmachinegun0Masterwork = 0xaeba2a90)] = 'V450NewSubmachinegun0Masterwork'),
          (a[(a.V450NewSubmachinegun0Skins = 0x922dab82)] = 'V450NewSubmachinegun0Skins'),
          (a[(a.V450RepackagePulseRifle0Masterwork = 0x42dcdb6)] =
            'V450RepackagePulseRifle0Masterwork'),
          (a[(a.V450RepackagePulseRifle0Skins = 0xc2146904)] = 'V450RepackagePulseRifle0Skins'),
          (a[(a.V450RepackageRocketLauncher0Masterwork = 0x7bc526d)] =
            'V450RepackageRocketLauncher0Masterwork'),
          (a[(a.V450RepackageRocketLauncher0Skins = 0xcee94221)] =
            'V450RepackageRocketLauncher0Skins'),
          (a[(a.V450SummerArmsGlow = 0x13f5b02)] = 'V450SummerArmsGlow'),
          (a[(a.V450SummerChestGlow = 0xfca5442e)] = 'V450SummerChestGlow'),
          (a[(a.V450SummerClassGlow = 0x1a33c89f)] = 'V450SummerClassGlow'),
          (a[(a.V450SummerHeadGlow = 0x617421ab)] = 'V450SummerHeadGlow'),
          (a[(a.V450SummerLegsGlow = 0xfca1981c)] = 'V450SummerLegsGlow'),
          (a[(a.V460ActivitiesSeasonPassAutoRifle0Skins = 0xef9c8377)] =
            'V460ActivitiesSeasonPassAutoRifle0Skins'),
          (a[(a.V460ActivitiesSeasonPassMachinegun0Skins = 0x66a41b84)] =
            'V460ActivitiesSeasonPassMachinegun0Skins'),
          (a[(a.V460NewBow0Masterwork = 0xc55e81a8)] = 'V460NewBow0Masterwork'),
          (a[(a.V460NewBow0Skins = 0x6814fb5a)] = 'V460NewBow0Skins'),
          (a[(a.V460NewHandCannon0Masterwork = 0xbf810ef9)] = 'V460NewHandCannon0Masterwork'),
          (a[(a.V460NewHandCannon0Skins = 0xa614bb1d)] = 'V460NewHandCannon0Skins'),
          (a[(a.V460NewMachinegun0Masterwork = 0xf57f3b31)] = 'V460NewMachinegun0Masterwork'),
          (a[(a.V460NewMachinegun0Skins = 0xdd04f4e5)] = 'V460NewMachinegun0Skins'),
          (a[(a.V460NewRocketLauncher0Masterwork = 0x64a9ed63)] =
            'V460NewRocketLauncher0Masterwork'),
          (a[(a.V460NewRocketLauncher0Skins = 0x2a6480b)] = 'V460NewRocketLauncher0Skins'),
          (a[(a.V460NewTraceRifle0Masterwork = 0xc15b3aa0)] = 'V460NewTraceRifle0Masterwork'),
          (a[(a.V460NewTraceRifle0Skins = 0xc2d78572)] = 'V460NewTraceRifle0Skins'),
          (a[(a.V460PlugsArmorMasterworks = 0x83040ad1)] = 'V460PlugsArmorMasterworks'),
          (a[(a.V460PlugsArmorMasterworksStatResistance1 = 0x17e3ebf0)] =
            'V460PlugsArmorMasterworksStatResistance1'),
          (a[(a.V460PlugsArmorMasterworksStatResistance2 = 0x17e3ebf3)] =
            'V460PlugsArmorMasterworksStatResistance2'),
          (a[(a.V460PlugsArmorMasterworksStatResistance3 = 0x17e3ebf2)] =
            'V460PlugsArmorMasterworksStatResistance3'),
          (a[(a.V460PlugsArmorMasterworksStatResistance4 = 0x17e3ebf5)] =
            'V460PlugsArmorMasterworksStatResistance4'),
          (a[(a.V460PlugsArmorMasterworksStatResistance5 = 0x17e3ebf4)] =
            'V460PlugsArmorMasterworksStatResistance5'),
          (a[(a.V460RepackageAutoRifle0Masterwork = 0xa2dc1ab5)] =
            'V460RepackageAutoRifle0Masterwork'),
          (a[(a.V460RepackageAutoRifle0Skins = 0x1454dae9)] = 'V460RepackageAutoRifle0Skins'),
          (a[(a.V460RepackageRocketLauncher0Masterwork = 0xa8bc94f0)] =
            'V460RepackageRocketLauncher0Masterwork'),
          (a[(a.V460WeaponModSword = 0x288ece65)] = 'V460WeaponModSword'),
          (a[(a.V470ActivitiesIronBannerBow0Skins = 0x15928f78)] =
            'V470ActivitiesIronBannerBow0Skins'),
          (a[(a.V470ActivitiesSeasonPassRocketLauncher0Skins = 0x7cd73857)] =
            'V470ActivitiesSeasonPassRocketLauncher0Skins'),
          (a[(a.V470ActivitiesSeasonPassSniperRifle0Skins = 0x243c153e)] =
            'V470ActivitiesSeasonPassSniperRifle0Skins'),
          (a[(a.V470EventsDawningSubmachinegun0Skins = 0x4fae1238)] =
            'V470EventsDawningSubmachinegun0Skins'),
          (a[(a.V470NewFusionRifle0Masterwork = 0x7c5c8168)] = 'V470NewFusionRifle0Masterwork'),
          (a[(a.V470NewFusionRifle0Skins = 0x2661cbda)] = 'V470NewFusionRifle0Skins'),
          (a[(a.V470NewScoutRifle0Masterwork = 4058834)] = 'V470NewScoutRifle0Masterwork'),
          (a[(a.V470NewScoutRifle0Skins = 0xc6ac4c00)] = 'V470NewScoutRifle0Skins'),
          (a[(a.V470NewSidearm0Masterwork = 0x69311306)] = 'V470NewSidearm0Masterwork'),
          (a[(a.V470NewSidearm0Skins = 0xbb7c13cc)] = 'V470NewSidearm0Skins'),
          (a[(a.V480NewAutoRifle0Masterwork = 0x515c8fd6)] = 'V480NewAutoRifle0Masterwork'),
          (a[(a.V480NewAutoRifle0Skins = 0xd2e5d8c)] = 'V480NewAutoRifle0Skins'),
          (a[(a.V480NewMachinegun0Masterwork = 0xe77f266f)] = 'V480NewMachinegun0Masterwork'),
          (a[(a.V480NewMachinegun0Skins = 0xa5c09977)] = 'V480NewMachinegun0Skins'),
          (a[(a.V480PursuitShotgun0Skins = 0x82433492)] = 'V480PursuitShotgun0Skins'),
          (a[(a.V480RepackageShotgun0Masterwork = 0x1bb66c03)] = 'V480RepackageShotgun0Masterwork'),
          (a[(a.V480RepackageShotgun0Skins = 0x6586324b)] = 'V480RepackageShotgun0Skins'),
          (a[(a.V480SeasonPassShotgun0Skins = 0x31cd081f)] = 'V480SeasonPassShotgun0Skins'),
          (a[(a.V480SeasonPassSubmachinegun0Skins = 0x18fa924e)] =
            'V480SeasonPassSubmachinegun0Skins'),
          (a[(a.V490NewGrenadeLauncher0Masterwork = 0xfca423c8)] =
            'V490NewGrenadeLauncher0Masterwork'),
          (a[(a.V490NewGrenadeLauncher0Skins = 0xbc3d502a)] = 'V490NewGrenadeLauncher0Skins'),
          (a[(a.V490NewSidearm0Masterwork = 0xf6673e98)] = 'V490NewSidearm0Masterwork'),
          (a[(a.V490NewSidearm0Skins = 0x3f75c00a)] = 'V490NewSidearm0Skins'),
          (a[(a.V490NewTraceRifle0Masterwork = 0x2dda6a9d)] = 'V490NewTraceRifle0Masterwork'),
          (a[(a.V490NewTraceRifle0Skins = 0x9c1cf969)] = 'V490NewTraceRifle0Skins'),
          (a[(a.V490WeaponsActivitiesSeasonPassPulseRifle0Skins = 0xcc54d40e)] =
            'V490WeaponsActivitiesSeasonPassPulseRifle0Skins'),
          (a[(a.V490WeaponsActivitiesSeasonPassSword0Skins = 0x55df7e47)] =
            'V490WeaponsActivitiesSeasonPassSword0Skins'),
          (a[(a.V500NewGrenadeLauncher0Masterwork = 0xee9145d6)] =
            'V500NewGrenadeLauncher0Masterwork'),
          (a[(a.V500NewGrenadeLauncher0Skins = 0x443561ec)] = 'V500NewGrenadeLauncher0Skins'),
          (a[(a.V500NewRocketLauncher0Masterwork = 0x9c31a3c)] =
            'V500NewRocketLauncher0Masterwork'),
          (a[(a.V500NewRocketLauncher0Skins = 0x25e6053e)] = 'V500NewRocketLauncher0Skins'),
          (a[(a.V500NewShotgun0Masterwork = 0xd7d6050d)] = 'V500NewShotgun0Masterwork'),
          (a[(a.V500NewShotgun0Skins = 0xf9ab9d11)] = 'V500NewShotgun0Skins'),
          (a[(a.V500NewSniperRifle0Masterwork = 0x13755405)] = 'V500NewSniperRifle0Masterwork'),
          (a[(a.V500NewSniperRifle0Skins = 0x3a46f7f9)] = 'V500NewSniperRifle0Skins'),
          (a[(a.V500NewSword0Masterwork = 0x5dae2df4)] = 'V500NewSword0Masterwork'),
          (a[(a.V500NewSword0Skins = 0x4ece296e)] = 'V500NewSword0Skins'),
          (a[(a.V500PursuitSniperRifle0Skins = 0x3f5a92e5)] = 'V500PursuitSniperRifle0Skins'),
          (a[(a.V500RepackageHandCannon0Masterwork = 0xbb29f36d)] =
            'V500RepackageHandCannon0Masterwork'),
          (a[(a.V500RepackageHandCannon0Skins = 0xc7f433a1)] = 'V500RepackageHandCannon0Skins'),
          (a[(a.V500RepackagePulseRifle0Masterwork = 0xc8e49af0)] =
            'V500RepackagePulseRifle0Masterwork'),
          (a[(a.V500RepackagePulseRifle0Skins = 0x38047b12)] = 'V500RepackagePulseRifle0Skins'),
          (a[(a.V500ShipsEventsDawningExoticShip0Engines = 0xdfc46b12)] =
            'V500ShipsEventsDawningExoticShip0Engines'),
          (a[(a.V500WeaponsActivitiesRaidHandCannon0Skins = 0xacac44c4)] =
            'V500WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V500WeaponsActivitiesRaidMachinegun0Skins = 0x3c7b87ba)] =
            'V500WeaponsActivitiesRaidMachinegun0Skins'),
          (a[(a.V500WeaponsActivitiesRaidScoutRifle0Skins = 0x21021ab0)] =
            'V500WeaponsActivitiesRaidScoutRifle0Skins'),
          (a[(a.V500WeaponsActivitiesRaidShotgun0Skins = 0x753bec91)] =
            'V500WeaponsActivitiesRaidShotgun0Skins'),
          (a[(a.V500WeaponsActivitiesRaidSniperRifle0Skins = 0x3bc00679)] =
            'V500WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V500WeaponsActivitiesRaidSword0Skins = 0x8f570cee)] =
            'V500WeaponsActivitiesRaidSword0Skins'),
          (a[(a.V510NewBow0Masterwork = 0xaa3a68f8)] = 'V510NewBow0Masterwork'),
          (a[(a.V510NewBow0Skins = 0xae17454a)] = 'V510NewBow0Skins'),
          (a[(a.V510NewScoutRifle0Skins = 0x17668c75)] = 'V510NewScoutRifle0Skins'),
          (a[(a.V510PursuitGrenadeLauncher0Skins = 0xea244a73)] =
            'V510PursuitGrenadeLauncher0Skins'),
          (a[(a.V520NewSidearm0Masterwork = 0x4f906a74)] = 'V520NewSidearm0Masterwork'),
          (a[(a.V520NewSidearm0Skins = 0xd5ba84ae)] = 'V520NewSidearm0Skins'),
          (a[(a.V520PursuitFusionRifle0Skins = 0x85373b40)] = 'V520PursuitFusionRifle0Skins'),
          (a[(a.V520RepackageFusionRifle0Masterwork = 0x744ddb5b)] =
            'V520RepackageFusionRifle0Masterwork'),
          (a[(a.V520RepackageFusionRifle0Skins = 0xe062dd1b)] = 'V520RepackageFusionRifle0Skins'),
          (a[(a.V530NewLinearFusionRifle0Masterwork = 0xbb5544f)] =
            'V530NewLinearFusionRifle0Masterwork'),
          (a[(a.V530NewLinearFusionRifle0Skins = 0xa15778bf)] = 'V530NewLinearFusionRifle0Skins'),
          (a[(a.V530NewTraceRifle0Masterwork = 0xb156dc52)] = 'V530NewTraceRifle0Masterwork'),
          (a[(a.V530NewTraceRifleSkins = 0x4df60720)] = 'V530NewTraceRifleSkins'),
          (a[(a.V530PursuitRocketLauncher0Skins = 0xb14684ed)] = 'V530PursuitRocketLauncher0Skins'),
          (a[(a.V540NewHandCannon0Masterwork = 0xc9769e1a)] = 'V540NewHandCannon0Masterwork'),
          (a[(a.V540NewHandCannon0Skins = 0x63a20c28)] = 'V540NewHandCannon0Skins'),
          (a[(a.V540RepackageRocketLauncher0Masterwork = 0xc509be33)] =
            'V540RepackageRocketLauncher0Masterwork'),
          (a[(a.V540RepackageRocketLauncher0Skins = 0xdfa6af33)] =
            'V540RepackageRocketLauncher0Skins'),
          (a[(a.V540WeaponModConfetti = 0x4b6e28b5)] = 'V540WeaponModConfetti'),
          (a[(a.V540WeaponsActivitiesDaresGrenadeLauncher0Skins = 0xd8e46b59)] =
            'V540WeaponsActivitiesDaresGrenadeLauncher0Skins'),
          (a[(a.V540WeaponsActivitiesDaresPulseRifle0Skins = 0xb2379ec4)] =
            'V540WeaponsActivitiesDaresPulseRifle0Skins'),
          (a[(a.V540WeaponsActivitiesDaresShotgun0Skins = 0x23b214d2)] =
            'V540WeaponsActivitiesDaresShotgun0Skins'),
          (a[(a.V540WeaponsActivitiesDaresSword0Skins = 0x388d245)] =
            'V540WeaponsActivitiesDaresSword0Skins'),
          (a[(a.V540WeaponsActivitiesDaresSword1Skins = 0x982247c0)] =
            'V540WeaponsActivitiesDaresSword1Skins'),
          (a[(a.V540WeaponsActivitiesDaresTraceRifle0Skins = 0xdcff9c24)] =
            'V540WeaponsActivitiesDaresTraceRifle0Skins'),
          (a[(a.V600NewGrenadeLauncher0Masterwork = 0xfc8e3c2f)] =
            'V600NewGrenadeLauncher0Masterwork'),
          (a[(a.V600NewGrenadeLauncher0Skins = 0xdaa22a97)] = 'V600NewGrenadeLauncher0Skins'),
          (a[(a.V600NewGrenadeLauncher1Masterwork = 0x8393d710)] =
            'V600NewGrenadeLauncher1Masterwork'),
          (a[(a.V600NewGrenadeLauncher1Skins = 0x8bb9aa3a)] = 'V600NewGrenadeLauncher1Skins'),
          (a[(a.V600NewMachinegun0Masterwork = 0x5516aad5)] = 'V600NewMachinegun0Masterwork'),
          (a[(a.V600NewMachinegun0Skins = 0x871262d1)] = 'V600NewMachinegun0Skins'),
          (a[(a.V600NewPulseRifle0Masterwork = 0xb8a81a40)] = 'V600NewPulseRifle0Masterwork'),
          (a[(a.V600NewPulseRifle0Skins = 0x89b0ff5a)] = 'V600NewPulseRifle0Skins'),
          (a[(a.V600NewSubmachinegun0Skins = 0x652ba6a5)] = 'V600NewSubmachinegun0Skins'),
          (a[(a.V600PlugsWeaponsMasterworksStatShieldDuration = 0x4828e8d9)] =
            'V600PlugsWeaponsMasterworksStatShieldDuration'),
          (a[(a.V600PursuitShotgun0Skins = 0xa906adb8)] = 'V600PursuitShotgun0Skins'),
          (a[(a.V600WeaponsActivitiesEnigmaGlaive0Skins = 0x1164c4b)] =
            'V600WeaponsActivitiesEnigmaGlaive0Skins'),
          (a[(a.V600WeaponsActivitiesFootholdAutoRifle0Skins = 0x19d09d79)] =
            'V600WeaponsActivitiesFootholdAutoRifle0Skins'),
          (a[(a.V600WeaponsActivitiesFootholdBow0Skins = 0x275d92b)] =
            'V600WeaponsActivitiesFootholdBow0Skins'),
          (a[(a.V600WeaponsActivitiesFootholdGrenadeLauncher0Skins = 0x70260f88)] =
            'V600WeaponsActivitiesFootholdGrenadeLauncher0Skins'),
          (a[(a.V600WeaponsActivitiesFootholdSniperRifle0Skins = 0x59fb49c5)] =
            'V600WeaponsActivitiesFootholdSniperRifle0Skins'),
          (a[(a.V600WeaponsActivitiesRaidFusionRifle0Skins = 0x7fcbd3ad)] =
            'V600WeaponsActivitiesRaidFusionRifle0Skins'),
          (a[(a.V600WeaponsActivitiesRaidGlaive0Skins = 0x6e2e3434)] =
            'V600WeaponsActivitiesRaidGlaive0Skins'),
          (a[(a.V600WeaponsActivitiesRaidGrenadeLauncher0Skins = 0x73feaca3)] =
            'V600WeaponsActivitiesRaidGrenadeLauncher0Skins'),
          (a[(a.V600WeaponsActivitiesRaidLinearFusionRifle0Skins = 0x5d57be5)] =
            'V600WeaponsActivitiesRaidLinearFusionRifle0Skins'),
          (a[(a.V600WeaponsActivitiesRaidPulseRifle0Skins = 0x914ef5c6)] =
            'V600WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V600WeaponsActivitiesRaidSubmachinegun0Skins = 0x1065fa91)] =
            'V600WeaponsActivitiesRaidSubmachinegun0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonPassPulseRifle0Skins = 0xf7639c87)] =
            'V600WeaponsActivitiesSeasonPassPulseRifle0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonPassSniperRifle0Skins = 0x25820f99)] =
            'V600WeaponsActivitiesSeasonPassSniperRifle0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonalAutoRifle0Skins = 0xd21e59aa)] =
            'V600WeaponsActivitiesSeasonalAutoRifle0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonalBow0Skins = 0xf5a8f082)] =
            'V600WeaponsActivitiesSeasonalBow0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonalGrenadeLauncher0Skins = 0xe877efc3)] =
            'V600WeaponsActivitiesSeasonalGrenadeLauncher0Skins'),
          (a[(a.V600WeaponsActivitiesSeasonalMachinegun0Skins = 0x6722971d)] =
            'V600WeaponsActivitiesSeasonalMachinegun0Skins'),
          (a[(a.V600WeaponsDestinationsThroneworldFusionRifle0Skins = 0x42b11165)] =
            'V600WeaponsDestinationsThroneworldFusionRifle0Skins'),
          (a[(a.V600WeaponsDestinationsThroneworldRocketLauncher0Skins = 0x10e18c6b)] =
            'V600WeaponsDestinationsThroneworldRocketLauncher0Skins'),
          (a[(a.V600WeaponsDestinationsThroneworldScoutRifle0Skins = 0x10b96e65)] =
            'V600WeaponsDestinationsThroneworldScoutRifle0Skins'),
          (a[(a.V600WeaponsDestinationsThroneworldSidearm0Skins = 0xf040f04d)] =
            'V600WeaponsDestinationsThroneworldSidearm0Skins'),
          (a[(a.V600WeaponsDestinationsThroneworldSubmachinegun0Skins = 0x89b86a49)] =
            'V600WeaponsDestinationsThroneworldSubmachinegun0Skins'),
          (a[(a.V600WeaponsFoundriesHakkeRocketLauncher0Skins = 0xe89e7109)] =
            'V600WeaponsFoundriesHakkeRocketLauncher0Skins'),
          (a[(a.V600WeaponsFoundriesHakkeShotgun0Skins = 0x3c3d388a)] =
            'V600WeaponsFoundriesHakkeShotgun0Skins'),
          (a[(a.V600WeaponsFoundriesSurosPulseRifle0Skins = 0x8b85f28c)] =
            'V600WeaponsFoundriesSurosPulseRifle0Skins'),
          (a[(a.V610NewMachinegun0Skins = 0x1957ddf6)] = 'V610NewMachinegun0Skins'),
          (a[(a.V610NewSidearm0Masterwork = 0xa4d2cfca)] = 'V610NewSidearm0Masterwork'),
          (a[(a.V610NewSidearm0Skins = 0xcceb108)] = 'V610NewSidearm0Skins'),
          (a[(a.V610NewSword0Masterwork = 0x979651c8)] = 'V610NewSword0Masterwork'),
          (a[(a.V610NewSword0Skins = 0xdac86c1a)] = 'V610NewSword0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonPassAutoRifle0Skins = 0x38314e40)] =
            'V610WeaponsActivitiesSeasonPassAutoRifle0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonPassShotgun0Skins = 0x45039a9e)] =
            'V610WeaponsActivitiesSeasonPassShotgun0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonalGlaive0Skins = 0xbe7a4fb7)] =
            'V610WeaponsActivitiesSeasonalGlaive0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonalRocketLauncher0Skins = 0xbb17b24e)] =
            'V610WeaponsActivitiesSeasonalRocketLauncher0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonalScoutRifle0Skins = 0xdc432180)] =
            'V610WeaponsActivitiesSeasonalScoutRifle0Skins'),
          (a[(a.V610WeaponsActivitiesSeasonalTraceRifle0Skins = 0x98d84a7f)] =
            'V610WeaponsActivitiesSeasonalTraceRifle0Skins'),
          (a[(a.V620ExoticWeaponMasterwork = 0x1e07c77c)] = 'V620ExoticWeaponMasterwork'),
          (a[(a.V620NewAutoRifle0Skins = 0xae0bda2c)] = 'V620NewAutoRifle0Skins'),
          (a[(a.V620NewFusionRifle0Skins = 0x3977051b)] = 'V620NewFusionRifle0Skins'),
          (a[(a.V620PursuitGrenadeLauncher0Skins = 0x3c004fb9)] =
            'V620PursuitGrenadeLauncher0Skins'),
          (a[(a.V620RepackageScoutRifle0Skins = 0x98e67872)] = 'V620RepackageScoutRifle0Skins'),
          (a[(a.V620WeaponsActivitiesMenagerieSword0Skins = 0x19f931f6)] =
            'V620WeaponsActivitiesMenagerieSword0Skins'),
          (a[(a.V620WeaponsActivitiesMenagerieSword1Skins = 0xdac6c603)] =
            'V620WeaponsActivitiesMenagerieSword1Skins'),
          (a[(a.V620WeaponsActivitiesMenagerieSword2Skins = 0xa54ee4d4)] =
            'V620WeaponsActivitiesMenagerieSword2Skins'),
          (a[(a.V620WeaponsActivitiesRaidFusionRifle0Skins = 0x91c134f)] =
            'V620WeaponsActivitiesRaidFusionRifle0Skins'),
          (a[(a.V620WeaponsActivitiesRaidHandCannon0Skins = 0x7b53a983)] =
            'V620WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V620WeaponsActivitiesRaidMachinegun0Skins = 0xb02f46cb)] =
            'V620WeaponsActivitiesRaidMachinegun0Skins'),
          (a[(a.V620WeaponsActivitiesRaidPulseRifle0Skins = 0xa13fd8e8)] =
            'V620WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V620WeaponsActivitiesRaidScoutRifle0Skins = 0xe218ee27)] =
            'V620WeaponsActivitiesRaidScoutRifle0Skins'),
          (a[(a.V620WeaponsActivitiesRaidSniperRifle0Skins = 0x220d0390)] =
            'V620WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonPassMachinegun0Skins = 0x289ddd7c)] =
            'V620WeaponsActivitiesSeasonPassMachinegun0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonPassSidearm0Skins = 0x2aedeb8a)] =
            'V620WeaponsActivitiesSeasonPassSidearm0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonalLinearFusionRifle0Skins = 0x47ae9a03)] =
            'V620WeaponsActivitiesSeasonalLinearFusionRifle0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonalScoutRifle0Skins = 0x60819673)] =
            'V620WeaponsActivitiesSeasonalScoutRifle0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonalShotgun0Skins = 0x91a07a52)] =
            'V620WeaponsActivitiesSeasonalShotgun0Skins'),
          (a[(a.V620WeaponsActivitiesSeasonalSubmachinegun0Skins = 0x146df47)] =
            'V620WeaponsActivitiesSeasonalSubmachinegun0Skins'),
          (a[(a.V620WeaponsFoundriesOmolonAutoRifle0Skins = 0x451ab5e2)] =
            'V620WeaponsFoundriesOmolonAutoRifle0Skins'),
          (a[(a.V620WeaponsFoundriesVeistLinearFusionRifle0Skins = 2466798)] =
            'V620WeaponsFoundriesVeistLinearFusionRifle0Skins'),
          (a[(a.V630NewBow0Masterwork = 0x436c04e5)] = 'V630NewBow0Masterwork'),
          (a[(a.V630NewBow0Skins = 0x39d44821)] = 'V630NewBow0Skins'),
          (a[(a.V630NewPulseRifle0Skins = 0xcd73eaa5)] = 'V630NewPulseRifle0Skins'),
          (a[(a.V630NewSubmachinegun0Masterwork = 0x2b3edf34)] = 'V630NewSubmachinegun0Masterwork'),
          (a[(a.V630NewSubmachinegun0Skins = 0x73c9face)] = 'V630NewSubmachinegun0Skins'),
          (a[(a.V630PursuitPulseRifle0Skins = 0xbd942ae1)] = 'V630PursuitPulseRifle0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonPassGlaive0Skins = 0x9104cd2c)] =
            'V630WeaponsActivitiesSeasonPassGlaive0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonPassMachinegun0Skins = 0x155c3a25)] =
            'V630WeaponsActivitiesSeasonPassMachinegun0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonalBow0Skins = 0xf2d11b31)] =
            'V630WeaponsActivitiesSeasonalBow0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonalLinearFusionRifle0Skins = 0xe5b90e1a)] =
            'V630WeaponsActivitiesSeasonalLinearFusionRifle0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonalPulseRifle0Skins = 0x61c253f5)] =
            'V630WeaponsActivitiesSeasonalPulseRifle0Skins'),
          (a[(a.V630WeaponsActivitiesSeasonalTraceRifle0Skins = 0xd5f3a839)] =
            'V630WeaponsActivitiesSeasonalTraceRifle0Skins'),
          (a[(a.V630WeaponsFoundriesIkelosHandCannon0Skins = 0x7dd6bcf)] =
            'V630WeaponsFoundriesIkelosHandCannon0Skins'),
          (a[(a.V630WeaponsFoundriesIkelosShotgun0Skins = 0xa3b99c22)] =
            'V630WeaponsFoundriesIkelosShotgun0Skins'),
          (a[(a.V630WeaponsFoundriesIkelosSniperRifle0Skins = 0x1713ed3c)] =
            'V630WeaponsFoundriesIkelosSniperRifle0Skins'),
          (a[(a.V630WeaponsFoundriesIkelosSubmachinegun0Skins = 0xf7990197)] =
            'V630WeaponsFoundriesIkelosSubmachinegun0Skins'),
          (a[(a.V700ExoticWeaponMasterwork = 0xf4f26925)] = 'V700ExoticWeaponMasterwork'),
          (a[(a.V700NewBow0Skins = 0x4a09f111)] = 'V700NewBow0Skins'),
          (a[(a.V700NewGlaive0Skins = 0x8c9fa2c9)] = 'V700NewGlaive0Skins'),
          (a[(a.V700NewGlaive1Skins = 0x3e37e9a4)] = 'V700NewGlaive1Skins'),
          (a[(a.V700NewMachinegun0Skins = 0x6850366c)] = 'V700NewMachinegun0Skins'),
          (a[(a.V700NewShotgun0Skins = 0x986a72cf)] = 'V700NewShotgun0Skins'),
          (a[(a.V700NewSidearm0Skins = 0xe152bba)] = 'V700NewSidearm0Skins'),
          (a[(a.V700PursuitGlaive0Skins = 0x7612a015)] = 'V700PursuitGlaive0Skins'),
          (a[(a.V700WeaponsActivitiesRaidAutoRifle0Skins = 0x34caab8f)] =
            'V700WeaponsActivitiesRaidAutoRifle0Skins'),
          (a[(a.V700WeaponsActivitiesRaidGrenadeLauncher0Skins = 0xe127f21a)] =
            'V700WeaponsActivitiesRaidGrenadeLauncher0Skins'),
          (a[(a.V700WeaponsActivitiesRaidLinearFusionRifle0Skins = 0x6fe4d4da)] =
            'V700WeaponsActivitiesRaidLinearFusionRifle0Skins'),
          (a[(a.V700WeaponsActivitiesRaidShotgun0Skins = 0x3f84932f)] =
            'V700WeaponsActivitiesRaidShotgun0Skins'),
          (a[(a.V700WeaponsActivitiesRaidSidearm0Skins = 0x3a046f1a)] =
            'V700WeaponsActivitiesRaidSidearm0Skins'),
          (a[(a.V700WeaponsActivitiesRaidTraceRifle0Skins = 0xf1915f9)] =
            'V700WeaponsActivitiesRaidTraceRifle0Skins'),
          (a[(a.V700WeaponsActivitiesSeasonPassBow0Skins = 0xd377b0aa)] =
            'V700WeaponsActivitiesSeasonPassBow0Skins'),
          (a[(a.V700WeaponsActivitiesSeasonPassFusionRifle0Skins = 0x73cc1055)] =
            'V700WeaponsActivitiesSeasonPassFusionRifle0Skins'),
          (a[(a.V700WeaponsActivitiesSeasonalAutoRifle0Skins = 0x2e289ff)] =
            'V700WeaponsActivitiesSeasonalAutoRifle0Skins'),
          (a[(a.V700WeaponsActivitiesSeasonalGrenadeLauncher0Skins = 0xafad7a4a)] =
            'V700WeaponsActivitiesSeasonalGrenadeLauncher0Skins'),
          (a[(a.V700WeaponsActivitiesSeasonalGrenadeLauncher1Skins = 0x620aa1e7)] =
            'V700WeaponsActivitiesSeasonalGrenadeLauncher1Skins'),
          (a[(a.V700WeaponsActivitiesSeasonalSword0Skins = 0xfa612414)] =
            'V700WeaponsActivitiesSeasonalSword0Skins'),
          (a[(a.V700WeaponsDestinationsTridentFusionRifle0Skins = 0x7b8cab00)] =
            'V700WeaponsDestinationsTridentFusionRifle0Skins'),
          (a[(a.V700WeaponsDestinationsTridentGrenadeLauncher0Skins = 0xfa6e319a)] =
            'V700WeaponsDestinationsTridentGrenadeLauncher0Skins'),
          (a[(a.V700WeaponsDestinationsTridentHandCannon0Skins = 0xc96564fe)] =
            'V700WeaponsDestinationsTridentHandCannon0Skins'),
          (a[(a.V700WeaponsDestinationsTridentPulseRifle0Skins = 0x8326d335)] =
            'V700WeaponsDestinationsTridentPulseRifle0Skins'),
          (a[(a.V700WeaponsDestinationsTridentSniperRifle0Skins = 0x1cde6d43)] =
            'V700WeaponsDestinationsTridentSniperRifle0Skins'),
          (a[(a.V700WeaponsModsMissionAvalon = 0x2a4fa138)] = 'V700WeaponsModsMissionAvalon'),
          (a[(a.V710NewAutoRifle0Masterwork = 0x5f80a846)] = 'V710NewAutoRifle0Masterwork'),
          (a[(a.V710NewAutoRifle0Skins = 0xb9e3159c)] = 'V710NewAutoRifle0Skins'),
          (a[(a.V710NewScoutRifle0Masterwork = 0xaf8453f3)] = 'V710NewScoutRifle0Masterwork'),
          (a[(a.V710NewScoutRifle0Skins = 0x7bdbc3b3)] = 'V710NewScoutRifle0Skins'),
          (a[(a.V710NewTraceRifle0Masterwork = 0x347eb7ae)] = 'V710NewTraceRifle0Masterwork'),
          (a[(a.V710NewTraceRifle0Skins = 0xa567e8e4)] = 'V710NewTraceRifle0Skins'),
          (a[(a.V710PursuitScoutRifle0Skins = 0x27358ba3)] = 'V710PursuitScoutRifle0Skins'),
          (a[(a.V710WeaponsActivitiesRaidAutoRifle0Skins = 0x7ba1d288)] =
            'V710WeaponsActivitiesRaidAutoRifle0Skins'),
          (a[(a.V710WeaponsActivitiesRaidBow0Skins = 0x439f8190)] =
            'V710WeaponsActivitiesRaidBow0Skins'),
          (a[(a.V710WeaponsActivitiesRaidFusionRifle0Skins = 0xf588b65f)] =
            'V710WeaponsActivitiesRaidFusionRifle0Skins'),
          (a[(a.V710WeaponsActivitiesRaidHandCannon0Skins = 0x31240853)] =
            'V710WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V710WeaponsActivitiesRaidPulseRifle0Skins = 0x441fc138)] =
            'V710WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V710WeaponsActivitiesRaidRocketLauncher0Skins = 0x58a642ad)] =
            'V710WeaponsActivitiesRaidRocketLauncher0Skins'),
          (a[(a.V710WeaponsActivitiesRaidScoutRifle0Skins = 0x18927f77)] =
            'V710WeaponsActivitiesRaidScoutRifle0Skins'),
          (a[(a.V710WeaponsActivitiesRaidSniperRifle0Skins = 0x71190240)] =
            'V710WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V710WeaponsActivitiesSeasonalSword0Skins = 0x8425e875)] =
            'V710WeaponsActivitiesSeasonalSword0Skins'),
          (a[(a.V720NewFusionRifle0Masterwork = 0x4ddbf7cc)] = 'V720NewFusionRifle0Masterwork'),
          (a[(a.V720NewFusionRifle0Skins = 0x7b8ff56)] = 'V720NewFusionRifle0Skins'),
          (a[(a.V720NewGrenadeLauncher0Masterwork = 0xd2b5edea)] =
            'V720NewGrenadeLauncher0Masterwork'),
          (a[(a.V720NewGrenadeLauncher0Skins = 0x4a8d5a18)] = 'V720NewGrenadeLauncher0Skins'),
          (a[(a.V720PursuitHandcannon0Skins = 0xc7c79943)] = 'V720PursuitHandcannon0Skins'),
          (a[(a.V720RepackageAutoRifle0Masterwork = 0x10db2108)] =
            'V720RepackageAutoRifle0Masterwork'),
          (a[(a.V720RepackageAutoRifle0Skins = 0xb992adb2)] = 'V720RepackageAutoRifle0Skins'),
          (a[(a.V720WeaponsActivitiesRaidAutoRifle0Skins = 0x85dde9e9)] =
            'V720WeaponsActivitiesRaidAutoRifle0Skins'),
          (a[(a.V720WeaponsActivitiesRaidHandCannon0Skins = 0x99944760)] =
            'V720WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V720WeaponsActivitiesRaidMachinegun0Skins = 0x783fe326)] =
            'V720WeaponsActivitiesRaidMachinegun0Skins'),
          (a[(a.V720WeaponsActivitiesRaidPulseRifle0Skins = 0xb42c64d3)] =
            'V720WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V720WeaponsActivitiesRaidScoutRifle0Skins = 0x3a20144c)] =
            'V720WeaponsActivitiesRaidScoutRifle0Skins'),
          (a[(a.V720WeaponsActivitiesRaidShotgun0Skins = 0x17c6a6ed)] =
            'V720WeaponsActivitiesRaidShotgun0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonPassFusionRifle0Skins = 0x12b80ec7)] =
            'V720WeaponsActivitiesSeasonPassFusionRifle0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonPassScoutRifle0Skins = 0x3371950f)] =
            'V720WeaponsActivitiesSeasonPassScoutRifle0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonalHandCannon0Skins = 0xee296404)] =
            'V720WeaponsActivitiesSeasonalHandCannon0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonalMachinegun0Skins = 0x49ce2ffa)] =
            'V720WeaponsActivitiesSeasonalMachinegun0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonalRocketLauncher0Skins = 0xf503b1fe)] =
            'V720WeaponsActivitiesSeasonalRocketLauncher0Skins'),
          (a[(a.V720WeaponsActivitiesSeasonalSniperRifle0Skins = 0xb6c7eb9)] =
            'V720WeaponsActivitiesSeasonalSniperRifle0Skins'),
          (a[(a.V730NewBow0Skins = 0xcf74d79e)] = 'V730NewBow0Skins'),
          (a[(a.V730NewSidearm0Masterwork = 0xf49ac47d)] = 'V730NewSidearm0Masterwork'),
          (a[(a.V730NewSidearm0Skins = 0xbf1f43b9)] = 'V730NewSidearm0Skins'),
          (a[(a.V730PursuitSword0Skins = 0xf85f367b)] = 'V730PursuitSword0Skins'),
          (a[(a.V730RepackageRocketLauncher0Masterwork = 0xe67f96cc)] =
            'V730RepackageRocketLauncher0Masterwork'),
          (a[(a.V730RepackageRocketLauncher0Skins = 0xe463c196)] =
            'V730RepackageRocketLauncher0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonPassPulseRifle0Skins = 0x9af545d7)] =
            'V730WeaponsActivitiesSeasonPassPulseRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonPassTraceRifle0Skins = 0x283a795f)] =
            'V730WeaponsActivitiesSeasonPassTraceRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalBow0Skins = 0x845e4732)] =
            'V730WeaponsActivitiesSeasonalBow0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalFusionRifle0Skins = 0x982168bd)] =
            'V730WeaponsActivitiesSeasonalFusionRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalLinearFusionRifle0Skins = 0xe9e80655)] =
            'V730WeaponsActivitiesSeasonalLinearFusionRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalRepriseHandCannon0Skins = 0xda536768)] =
            'V730WeaponsActivitiesSeasonalRepriseHandCannon0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalReprisePulseRifle0Skins = 0x4b0d36cb)] =
            'V730WeaponsActivitiesSeasonalReprisePulseRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalRepriseScoutRifle0Skins = 0x3dbfc664)] =
            'V730WeaponsActivitiesSeasonalRepriseScoutRifle0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalRepriseSubmachinegun0Skins = 0x1a0f9e6c)] =
            'V730WeaponsActivitiesSeasonalRepriseSubmachinegun0Skins'),
          (a[(a.V730WeaponsActivitiesSeasonalShotgun0Skins = 0xb6429e7c)] =
            'V730WeaponsActivitiesSeasonalShotgun0Skins'),
          (a[(a.V800NewAutoRifle0Skins = 0xc871d048)] = 'V800NewAutoRifle0Skins'),
          (a[(a.V800NewGrenadeLauncher0Masterwork = 0xab6e19)] =
            'V800NewGrenadeLauncher0Masterwork'),
          (a[(a.V800NewLinearFusionRifle0Masterwork = 0xc49308bf)] =
            'V800NewLinearFusionRifle0Masterwork'),
          (a[(a.V800NewLinearFusionRifle0Skins = 0xa8e1e78f)] = 'V800NewLinearFusionRifle0Skins'),
          (a[(a.V800NewSniperRifle0Masterwork = 0x60463cca)] = 'V800NewSniperRifle0Masterwork'),
          (a[(a.V800NewSniperRifle0Skins = 0x3501a000)] = 'V800NewSniperRifle0Skins'),
          (a[(a.V800NewSword0Masterwork = 0x4967fe4d)] = 'V800NewSword0Masterwork'),
          (a[(a.V800NewSword0Skins = 0x6c73ba39)] = 'V800NewSword0Skins'),
          (a[(a.V800NewTraceRifle0Masterwork = 0xa9217b02)] = 'V800NewTraceRifle0Masterwork'),
          (a[(a.V800NewTraceRifle0Skins = 0x9f53d100)] = 'V800NewTraceRifle0Skins'),
          (a[(a.V800PursuitSubmachinegun0Skins = 0xf0f7e946)] = 'V800PursuitSubmachinegun0Skins'),
          (a[(a.V800RepackageAutoRifle0Masterwork = 0x4434f437)] =
            'V800RepackageAutoRifle0Masterwork'),
          (a[(a.V800RepackageAutoRifle0Skins = 0x45856fbf)] = 'V800RepackageAutoRifle0Skins'),
          (a[(a.V800RepackagePulseRifle0Masterwork = 0x24224ff9)] =
            'V800RepackagePulseRifle0Masterwork'),
          (a[(a.V800RepackagePulseRifle0Skins = 0x2f561d65)] = 'V800RepackagePulseRifle0Skins'),
          (a[(a.V800RepackageSniperRifle0Masterwork = 0x92717bcb)] =
            'V800RepackageSniperRifle0Masterwork'),
          (a[(a.V800WeaponsActivitiesRaidBow0Skins = 0x6df471ec)] =
            'V800WeaponsActivitiesRaidBow0Skins'),
          (a[(a.V800WeaponsActivitiesRaidGlaive0Skins = 0x7a963796)] =
            'V800WeaponsActivitiesRaidGlaive0Skins'),
          (a[(a.V800WeaponsActivitiesRaidPulseRifle0Skins = 0x8125e7c)] =
            'V800WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V800WeaponsActivitiesRaidSniperRifle0Skins = 0x5fe77d04)] =
            'V800WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V800WeaponsActivitiesRaidSubmachinegun0Skins = 0xbe7968f)] =
            'V800WeaponsActivitiesRaidSubmachinegun0Skins'),
          (a[(a.V800WeaponsActivitiesRaidSword0Skins = 0x4531cf6d)] =
            'V800WeaponsActivitiesRaidSword0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalAutoRifle0Skins = 0x9b783b90)] =
            'V800WeaponsActivitiesSeasonalAutoRifle0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalGrenadeLauncher0Skins = 0xb0ccf0f5)] =
            'V800WeaponsActivitiesSeasonalGrenadeLauncher0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalHandCannon0Skins = 0xffc0a7bb)] =
            'V800WeaponsActivitiesSeasonalHandCannon0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalMachinegun0Skins = 0xfcfd2ff3)] =
            'V800WeaponsActivitiesSeasonalMachinegun0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalPulseRifle0Skins = 0xbd4e9390)] =
            'V800WeaponsActivitiesSeasonalPulseRifle0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalRocketLauncher0Skins = 0xd2e0cba5)] =
            'V800WeaponsActivitiesSeasonalRocketLauncher0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalScoutRifle0Skins = 0x9a79094f)] =
            'V800WeaponsActivitiesSeasonalScoutRifle0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalSidearm0Skins = 0x569a70e7)] =
            'V800WeaponsActivitiesSeasonalSidearm0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalSword0Skins = 0x5ced5ec1)] =
            'V800WeaponsActivitiesSeasonalSword0Skins'),
          (a[(a.V800WeaponsActivitiesSeasonalTraceRifle0Skins = 0x8183ee8)] =
            'V800WeaponsActivitiesSeasonalTraceRifle0Skins'),
          (a[(a.V800WeaponsDestinationsSchismAutoRifle0Skins = 0xb70f9e17)] =
            'V800WeaponsDestinationsSchismAutoRifle0Skins'),
          (a[(a.V800WeaponsDestinationsSchismFusionRifle0Skins = 0xeb090b88)] =
            'V800WeaponsDestinationsSchismFusionRifle0Skins'),
          (a[(a.V800WeaponsDestinationsSchismHandCannon0Skins = 0x436432c6)] =
            'V800WeaponsDestinationsSchismHandCannon0Skins'),
          (a[(a.V800WeaponsDestinationsSchismMachinegun0Skins = 0xf4ac0764)] =
            'V800WeaponsDestinationsSchismMachinegun0Skins'),
          (a[(a.V800WeaponsDestinationsSchismShotgun0Skins = 0x80c05cf7)] =
            'V800WeaponsDestinationsSchismShotgun0Skins'),
          (a[(a.V800WeaponsDestinationsSchismSidearm0Skins = 0xbf817eb2)] =
            'V800WeaponsDestinationsSchismSidearm0Skins'),
          (a[(a.V800WeaponsDestinationsSchismSniperRifle0Skins = 0x71ac3f9b)] =
            'V800WeaponsDestinationsSchismSniperRifle0Skins'),
          (a[(a.V800WeaponsDestinationsSchismSword0Skins = 0x76021d4c)] =
            'V800WeaponsDestinationsSchismSword0Skins'),
          (a[(a.V810NewGrenadeLauncher0Skins = 0xce1c86e)] = 'V810NewGrenadeLauncher0Skins'),
          (a[(a.V810NewShotgun0Skins = 0x7cc5d123)] = 'V810NewShotgun0Skins'),
          (a[(a.V810PursuitAutoRifle0Skins = 0xf5636d2f)] = 'V810PursuitAutoRifle0Skins'),
          (a[(a.V810RepackageSniperRifle0Skins = 0x5521a0ac)] = 'V810RepackageSniperRifle0Skins'),
          (a[(a.V810WeaponsActivitiesRaidAutoRifle0Skins = 0x8e0e388b)] =
            'V810WeaponsActivitiesRaidAutoRifle0Skins'),
          (a[(a.V810WeaponsActivitiesRaidBow0Skins = 0xfc9034dd)] =
            'V810WeaponsActivitiesRaidBow0Skins'),
          (a[(a.V810WeaponsActivitiesRaidFusionRifle0Skins = 0x2e3f1464)] =
            'V810WeaponsActivitiesRaidFusionRifle0Skins'),
          (a[(a.V810WeaponsActivitiesRaidHandCannon0Skins = 0x2c685d2)] =
            'V810WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V810WeaponsActivitiesRaidPulseRifle0Skins = 0xf15b2a09)] =
            'V810WeaponsActivitiesRaidPulseRifle0Skins'),
          (a[(a.V810WeaponsActivitiesRaidShotgun0Skins = 0xf6d88ff3)] =
            'V810WeaponsActivitiesRaidShotgun0Skins'),
          (a[(a.V810WeaponsActivitiesRaidSniperRifle0Skins = 0x732fac37)] =
            'V810WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V820NewLinearFusionRifle0Masterwork = 0xbbcd6d81)] =
            'V820NewLinearFusionRifle0Masterwork'),
          (a[(a.V820NewLinearFusionRifle0Skins = 0x4eccdd0d)] = 'V820NewLinearFusionRifle0Skins'),
          (a[(a.V820NewPulseRifle0Masterwork = 0x35e83bc)] = 'V820NewPulseRifle0Masterwork'),
          (a[(a.V820NewPulseRifle0Skins = 0x16d3a50e)] = 'V820NewPulseRifle0Skins'),
          (a[(a.V820NewSubmachinegun0Skins = 0xa3d08bc9)] = 'V820NewSubmachinegun0Skins'),
          (a[(a.V820PursuitFusionRifle0Skins = 0x29c1954e)] = 'V820PursuitFusionRifle0Skins'),
          (a[(a.V820RepackageSniperRifle0Masterwork = 0xa1408271)] =
            'V820RepackageSniperRifle0Masterwork'),
          (a[(a.V820RepackageSniperRifle0Skins = 0xeb527f75)] = 'V820RepackageSniperRifle0Skins'),
          (a[(a.V820WeaponsActivitiesRaidHandCannon0Skins = 0x86a15ca9)] =
            'V820WeaponsActivitiesRaidHandCannon0Skins'),
          (a[(a.V820WeaponsActivitiesRaidMachinegun0Skins = 0x363c8b01)] =
            'V820WeaponsActivitiesRaidMachinegun0Skins'),
          (a[(a.V820WeaponsActivitiesRaidRocketLauncher0Skins = 0xf85ef5ef)] =
            'V820WeaponsActivitiesRaidRocketLauncher0Skins'),
          (a[(a.V820WeaponsActivitiesRaidScoutRifle0Skins = 0xb0c5af51)] =
            'V820WeaponsActivitiesRaidScoutRifle0Skins'),
          (a[(a.V820WeaponsActivitiesRaidShotgun0Skins = 0xcb7db7a0)] =
            'V820WeaponsActivitiesRaidShotgun0Skins'),
          (a[(a.V820WeaponsActivitiesRaidSniperRifle0Skins = 0x4d3a4bf6)] =
            'V820WeaponsActivitiesRaidSniperRifle0Skins'),
          (a[(a.V900CrucibleHandCannon0Skins = 0xa37c3f8d)] = 'V900CrucibleHandCannon0Skins'),
          (a[(a.V900CruciblePulseRifle0Skins = 0xbafef2de)] = 'V900CruciblePulseRifle0Skins'),
          (a[(a.V900CrucibleShotgun0Skins = 0x55121674)] = 'V900CrucibleShotgun0Skins'),
          (a[(a.V900CrucibleSidearm0Skins = 0xb555c73d)] = 'V900CrucibleSidearm0Skins'),
          (a[(a.V900FireteamBow0Skins = 0xfc24f476)] = 'V900FireteamBow0Skins'),
          (a[(a.V900FireteamLinearFusionRifle0Skins = 0x81116799)] =
            'V900FireteamLinearFusionRifle0Skins'),
          (a[(a.V900FireteamSubmachinegun0Skins = 0xd5abf88d)] = 'V900FireteamSubmachinegun0Skins'),
          (a[(a.V900FireteamSword0Skins = 0xe9f29feb)] = 'V900FireteamSword0Skins'),
          (a[(a.V900KeplerAutoRifle0Skins = 0x5fc54d7c)] = 'V900KeplerAutoRifle0Skins'),
          (a[(a.V900KeplerHandCannon0Skins = 0x6beedc9f)] = 'V900KeplerHandCannon0Skins'),
          (a[(a.V900KeplerMachinegun0Skins = 0x69a21987)] = 'V900KeplerMachinegun0Skins'),
          (a[(a.V900KeplerPulseRifle0Skins = 0x2dd4b264)] = 'V900KeplerPulseRifle0Skins'),
          (a[(a.V900KeplerScoutRifle0Skins = 0xea747e13)] = 'V900KeplerScoutRifle0Skins'),
          (a[(a.V900KeplerShotgun0Skins = 0x2c54c9b2)] = 'V900KeplerShotgun0Skins'),
          (a[(a.V900NewHandCannon0Skins = 0xc219b000)] = 'V900NewHandCannon0Skins'),
          (a[(a.V900NewRocketLauncher0Masterwork = 0xc01185f8)] =
            'V900NewRocketLauncher0Masterwork'),
          (a[(a.V900NewRocketLauncher0Skins = 0x74f3ca42)] = 'V900NewRocketLauncher0Skins'),
          (a[(a.V900NewScoutRifle0Masterwork = 0x3a712266)] = 'V900NewScoutRifle0Masterwork'),
          (a[(a.V900NewScoutRifle0Skins = 0x2cda086c)] = 'V900NewScoutRifle0Skins'),
          (a[(a.V900PinnacleBow0Skins = 0x2b7e84bf)] = 'V900PinnacleBow0Skins'),
          (a[(a.V900PinnacleFusionRifle0Skins = 0x69236062)] = 'V900PinnacleFusionRifle0Skins'),
          (a[(a.V900PinnacleGrenadeLauncher0Skins = 0x58f1f2d4)] =
            'V900PinnacleGrenadeLauncher0Skins'),
          (a[(a.V900PinnacleGrenadeLauncher1Skins = 0x40cccb79)] =
            'V900PinnacleGrenadeLauncher1Skins'),
          (a[(a.V900PinnaclePulseRifle0Skins = 0xb89ca10f)] = 'V900PinnaclePulseRifle0Skins'),
          (a[(a.V900RaidAutoRifle0Skins = 0x259207e1)] = 'V900RaidAutoRifle0Skins'),
          (a[(a.V900RaidBow0Skins = 0x7e3671f3)] = 'V900RaidBow0Skins'),
          (a[(a.V900RaidFusionRifle0Skins = 0x826e9f4e)] = 'V900RaidFusionRifle0Skins'),
          (a[(a.V900RaidRocketLauncher0Skins = 0x93ba0faa)] = 'V900RaidRocketLauncher0Skins'),
          (a[(a.V900RaidSniperRifle0Skins = 0xe888353d)] = 'V900RaidSniperRifle0Skins'),
          (a[(a.V900RaidSubmachinegun0Skins = 0xe8d690bc)] = 'V900RaidSubmachinegun0Skins'),
          (a[(a.V900SeasonalAutoRifle0Skins = 0x586e7861)] = 'V900SeasonalAutoRifle0Skins'),
          (a[(a.V900SeasonalScoutRifle0Skins = 0x3327f2f4)] = 'V900SeasonalScoutRifle0Skins'),
          (a[(a.V900SeasonalSidearm0Skins = 0x2ba05740)] = 'V900SeasonalSidearm0Skins'),
          (a[(a.V900SeasonalSniperRifle0Skins = 0xb38f59bd)] = 'V900SeasonalSniperRifle0Skins'),
          (a[(a.V900SeasonalSword0Skins = 0x4be17582)] = 'V900SeasonalSword0Skins'),
          (a[(a.V900SharedHandCannon0Skins = 0x3fa0e0cd)] = 'V900SharedHandCannon0Skins'),
          (a[(a.V900SharedShotgun0Skins = 0xb0344db4)] = 'V900SharedShotgun0Skins'),
          (a[(a.V900SharedSword0Skins = 0xb570e157)] = 'V900SharedSword0Skins'),
          (a[(a.V900SharedTraceRifle0Skins = 0xe2ad24c2)] = 'V900SharedTraceRifle0Skins'),
          (a[(a.V900SolsticeBow0Skins = 0x2f0e192b)] = 'V900SolsticeBow0Skins'),
          (a[(a.V900SolsticeGrenadeLauncher0Skins = 0xe836cf88)] =
            'V900SolsticeGrenadeLauncher0Skins'),
          (a[(a.V900SolsticeSubmachinegun0Skins = 0x71364ad4)] = 'V900SolsticeSubmachinegun0Skins'),
          (a[(a.V900TrialsAutoRifle0Skins = 0xad61a96e)] = 'V900TrialsAutoRifle0Skins'),
          (a[(a.V900TrialsHandCannon0Skins = 0xe1ee26e1)] = 'V900TrialsHandCannon0Skins'),
          (a[(a.V900TrialsMachinegun0Skins = 0xda4f90a9)] = 'V900TrialsMachinegun0Skins'),
          (a[(a.V900TrialsScoutRifle0Skins = 0x62f4c4b9)] = 'V900TrialsScoutRifle0Skins'),
          (a[(a.V900TrialsSidearm0Skins = 0xf2158381)] = 'V900TrialsSidearm0Skins'),
          (a[(a.V900WeaponModMagAdjusting = 0xb62eabdc)] = 'V900WeaponModMagAdjusting'),
          (a[(a.V900weaponModConfetti = 0x1b889c4b)] = 'V900weaponModConfetti'),
          (a[(a.V910CrucibleShotgun0Skins = 0x859e8dc7)] = 'V910CrucibleShotgun0Skins'),
          (a[(a.V910FireteamSidearm0Skins = 0x167face2)] = 'V910FireteamSidearm0Skins'),
          (a[(a.V910FotlBow0Skins = 0xe0cb8107)] = 'V910FotlBow0Skins'),
          (a[(a.V910FotlShotgun0Skins = 0x27f28151)] = 'V910FotlShotgun0Skins'),
          (a[(a.V910FotlSubmachinegun0Skins = 0xfdfbe858)] = 'V910FotlSubmachinegun0Skins'),
          (a[(a.V910IronBannerHandCannon0Skins = 0xbd85323e)] = 'V910IronBannerHandCannon0Skins'),
          (a[(a.V910NewPulseRifle0Masterwork = 0xdd984150)] = 'V910NewPulseRifle0Masterwork'),
          (a[(a.V910NewPulseRifle0Skins = 0xd4a91f8a)] = 'V910NewPulseRifle0Skins'),
          (a[(a.V910NewSword0Skins = 0x446910b3)] = 'V910NewSword0Skins'),
          (a[(a.V910PinnacleScoutRifle0Skins = 0x388fbf67)] = 'V910PinnacleScoutRifle0Skins'),
          (a[(a.V910PinnacleSubmachinegun0Skins = 0xa82e95cb)] = 'V910PinnacleSubmachinegun0Skins'),
          (a[(a.V910RaidAutoRifle0Skins = 0x5dcc6eac)] = 'V910RaidAutoRifle0Skins'),
          (a[(a.V910RaidGrenadeLauncher0Skins = 0xfd00eee9)] = 'V910RaidGrenadeLauncher0Skins'),
          (a[(a.V910RaidShotgun0Skins = 0xad8e50a2)] = 'V910RaidShotgun0Skins'),
          (a[(a.V910RallyBow0Skins = 0x8942b9f0)] = 'V910RallyBow0Skins'),
          (a[(a.V910SeasonalRocketLauncher0Skins = 0xd70aba89)] =
            'V910SeasonalRocketLauncher0Skins'),
          (a[(a.V910SeasonalSidearm0Skins = 0x72902d63)] = 'V910SeasonalSidearm0Skins'),
          (a[(a.V910SeasonalSubmachinegun0Skins = 0x93a0987f)] = 'V910SeasonalSubmachinegun0Skins'),
          (a[(a.V910SharedGrenadeLauncher0Skins = 0x9f553eca)] = 'V910SharedGrenadeLauncher0Skins'),
          (a[(a.V910SharedRocketLauncher0Skins = 0xa590279c)] = 'V910SharedRocketLauncher0Skins'),
          (a[(a.V910TrialsAutoRifle0Skins = 0x68b0ac8f)] = 'V910TrialsAutoRifle0Skins'),
          (a[(a.V910TrialsFusionRifle0Skins = 0x1e43cc80)] = 'V910TrialsFusionRifle0Skins'),
          (a[(a.V950CrucibleFusionRifle0Skins = 0x5595227c)] = 'V950CrucibleFusionRifle0Skins'),
          (a[(a.V950CrucibleHandCannon0Skins = 0xc3abb3ea)] = 'V950CrucibleHandCannon0Skins'),
          (a[(a.V950CrucibleMachinegun0Skins = 0xf72f4188)] = 'V950CrucibleMachinegun0Skins'),
          (a[(a.V950CrucibleSubmachinegun0Skins = 0xdf738f6a)] = 'V950CrucibleSubmachinegun0Skins'),
          (a[(a.V950DawningGrenadeLauncher0Skins = 0xd5371cbb)] =
            'V950DawningGrenadeLauncher0Skins'),
          (a[(a.V950DawningLinearFusionRifle0Skins = 0x52e09bfd)] =
            'V950DawningLinearFusionRifle0Skins'),
          (a[(a.V950DawningSidearm0Skins = 0x7efc687d)] = 'V950DawningSidearm0Skins'),
          (a[(a.V950DungeonAutoRifle0Skins = 0x3d90c0b6)] = 'V950DungeonAutoRifle0Skins'),
          (a[(a.V950DungeonMachinegun0Skins = 0xc72effe1)] = 'V950DungeonMachinegun0Skins'),
          (a[(a.V950DungeonPulseRifle0Skins = 0xc1ec818a)] = 'V950DungeonPulseRifle0Skins'),
          (a[(a.V950DungeonScoutRifle0Skins = 0x5bb2ae71)] = 'V950DungeonScoutRifle0Skins'),
          (a[(a.V950DungeonSniperRifle0Skins = 0xc9885816)] = 'V950DungeonSniperRifle0Skins'),
          (a[(a.V950DungeonSword0Skins = 0x8e9402b3)] = 'V950DungeonSword0Skins'),
          (a[(a.V950ExpansionHandCannon0Skins = 0x90cd037a)] = 'V950ExpansionHandCannon0Skins'),
          (a[(a.V950ExpansionHandCannon1Skins = 0xdfb583d7)] = 'V950ExpansionHandCannon1Skins'),
          (a[(a.V950ExpansionPulseRifle0Skins = 0x70be0341)] = 'V950ExpansionPulseRifle0Skins'),
          (a[(a.V950ExpansionSidearm0Skins = 0x5f779f06)] = 'V950ExpansionSidearm0Skins'),
          (a[(a.V950ExpansionSniperRifle0Skins = 0x77caaa4f)] = 'V950ExpansionSniperRifle0Skins'),
          (a[(a.V950ExpansionSubmachinegun0Skins = 0x80e92d3a)] =
            'V950ExpansionSubmachinegun0Skins'),
          (a[(a.V950FireteamFusionRifle0Skins = 0xd87fa7fc)] = 'V950FireteamFusionRifle0Skins'),
          (a[(a.V950FireteamPulseRifle0Skins = 0x241219f1)] = 'V950FireteamPulseRifle0Skins'),
          (a[(a.V950FireteamSidearm0Skins = 0x37fec716)] = 'V950FireteamSidearm0Skins'),
          (a[(a.V950FireteamSniperRifle0Skins = 0x552cc95f)] = 'V950FireteamSniperRifle0Skins'),
          (a[(a.V950GuardianGamesFusionRifle0Skins = 0x9e0d86ae)] =
            'V950GuardianGamesFusionRifle0Skins'),
          (a[(a.V950GuardianGamesHandCannon0Skins = 3624687e3)] =
            'V950GuardianGamesHandCannon0Skins'),
          (a[(a.V950GuardianGamesTraceRifle0Skins = 0xe48469cb)] =
            'V950GuardianGamesTraceRifle0Skins'),
          (a[(a.V950IronBannerAutoRifle0Skins = 0x54fdc3fb)] = 'V950IronBannerAutoRifle0Skins'),
          (a[(a.V950NewBow0Masterwork = 0x212ecf60)] = 'V950NewBow0Masterwork'),
          (a[(a.V950NewBow0Skins = 0xfbdc322)] = 'V950NewBow0Skins'),
          (a[(a.V950NewMachinegun0Masterwork = 0x1841f9d9)] = 'V950NewMachinegun0Masterwork'),
          (a[(a.V950NewMachinegun0Skins = 0xb1ad53d)] = 'V950NewMachinegun0Skins'),
          (a[(a.V950NewSword0Blades = 0xe038f597)] = 'V950NewSword0Blades'),
          (a[(a.V950NewSword0Cosmetics = 0x8a6d1e92)] = 'V950NewSword0Cosmetics'),
          (a[(a.V950NewSword0Forms = 0xf5289bbf)] = 'V950NewSword0Forms'),
          (a[(a.V950NewSword0Guards = 0xb5659a0)] = 'V950NewSword0Guards'),
          (a[(a.V950NewSword0Masterwork = 0x897bd217)] = 'V950NewSword0Masterwork'),
          (a[(a.V950NewSword0PerkUpgrades = 0x4898eb12)] = 'V950NewSword0PerkUpgrades'),
          (a[(a.V950NewSword0Skins = 0x1d78d56f)] = 'V950NewSword0Skins'),
          (a[(a.V950NewSword0StatUpgrades = 0x2ff74d2c)] = 'V950NewSword0StatUpgrades'),
          (a[(a.V950PinnacleAutoRifle0Skins = 0xfb8e3ecc)] = 'V950PinnacleAutoRifle0Skins'),
          (a[(a.V950PinnacleBow0Skins = 0x9e1c2934)] = 'V950PinnacleBow0Skins'),
          (a[(a.V950PinnacleHandCannon0Skins = 0xf513ba6f)] = 'V950PinnacleHandCannon0Skins'),
          (a[(a.V950PinnaclePulseRifle0Skins = 0x15e23ef4)] = 'V950PinnaclePulseRifle0Skins'),
          (a[(a.V950PinnacleScoutRifle0Skins = 0xacde01e3)] = 'V950PinnacleScoutRifle0Skins'),
          (a[(a.V950RallyGrenadeLauncher0Skins = 0xa8238951)] = 'V950RallyGrenadeLauncher0Skins'),
          (a[(a.V950SeasonalFusionRifle0Skins = 0x9bb19b9f)] = 'V950SeasonalFusionRifle0Skins'),
          (a[(a.V950SeasonalGrenadeLauncher0Skins = 0xdb25159d)] =
            'V950SeasonalGrenadeLauncher0Skins'),
          (a[(a.V950SeasonalShotgun0Skins = 0x811e4086)] = 'V950SeasonalShotgun0Skins'),
          (a[(a.V950SeasonalSword0Skins = 0xd7764db9)] = 'V950SeasonalSword0Skins'),
          (a[(a.V950SharedBow0Skins = 0x55c93b55)] = 'V950SharedBow0Skins'),
          (a[(a.V950SharedGlaive0Skins = 0x397d3795)] = 'V950SharedGlaive0Skins'),
          (a[(a.V950SharedRocketLauncher0Skins = 0x3e13d300)] = 'V950SharedRocketLauncher0Skins'),
          (a[(a.V950SharedTraceRifle0Skins = 0x8aa60c5d)] = 'V950SharedTraceRifle0Skins'),
          (a[(a.V950TrialsGrenadeLauncher0Skins = 0x8693236)] = 'V950TrialsGrenadeLauncher0Skins'),
          (a[(a.V950TrialsHandCannon0Skins = 0x9b0fb39a)] = 'V950TrialsHandCannon0Skins'),
          (a[(a.V950TrialsPulseRifle0Skins = 0x3a29bd61)] = 'V950TrialsPulseRifle0Skins'),
          (a[(a.V950TrialsShotgun0Skins = 0x84a7b8fb)] = 'V950TrialsShotgun0Skins'),
          (a[(a.V950TrialsSubmachinegun0Skins = 0x702ca69a)] = 'V950TrialsSubmachinegun0Skins'),
          (a[(a.V960CrucibleSniperRifle0 = 0x5deb60a7)] = 'V960CrucibleSniperRifle0'),
          (a[(a.V960FireteamBow0 = 0xc49d7583)] = 'V960FireteamBow0'),
          (a[(a.V960IronBannerShotgun0 = 0x16f8b87b)] = 'V960IronBannerShotgun0'),
          (a[(a.V960NewHandCannon0Masterwork = 0x99ebddc8)] = 'V960NewHandCannon0Masterwork'),
          (a[(a.V960NewHandCannon0Skins = 0x7ba4bdaa)] = 'V960NewHandCannon0Skins'),
          (a[(a.V960PinnacleGrenadeLauncher0 = 0x3b2ae7c5)] = 'V960PinnacleGrenadeLauncher0'),
          (a[(a.V960PinnacleSubmachinegun0 = 0x2a694289)] = 'V960PinnacleSubmachinegun0'),
          (a[(a.V960SeasonalAutoRifle0 = 0xea44701c)] = 'V960SeasonalAutoRifle0'),
          (a[(a.V960SeasonalScoutRifle0 = 0xdd49c6b1)] = 'V960SeasonalScoutRifle0'),
          (a[(a.V960SharedHandCannon0 = 0xc82f0658)] = 'V960SharedHandCannon0'),
          (a[(a.V960SharedSword0 = 0x5227db6a)] = 'V960SharedSword0'),
          (a[(a.V960SolsticeHandCannon0 = 0x6fb3dc01)] = 'V960SolsticeHandCannon0'),
          (a[(a.V960SolsticeMachinegun0 = 0x6f26ca23)] = 'V960SolsticeMachinegun0'),
          (a[(a.V960SolsticeSniperRifle0 = 0xd3f4e928)] = 'V960SolsticeSniperRifle0'),
          (a[(a.V960TrialsLinearFusionRifle0 = 0x594515f8)] = 'V960TrialsLinearFusionRifle0'),
          (a[(a.V960TrialsPulseRifle0 = 0xf782580b)] = 'V960TrialsPulseRifle0'),
          (a[(a.V970NewFusionRifle0Masterwork = 0xf1e1a85f)] = 'V970NewFusionRifle0Masterwork'),
          (a[(a.V970NewFusionRifle0Skins = 0x4ef99fa7)] = 'V970NewFusionRifle0Skins'),
          (a[(a.V970NewLinearFusionRifle0Masterwork = 0x714fcd27)] =
            'V970NewLinearFusionRifle0Masterwork'),
          (a[(a.V970NewLinearFusionRifle0Skins = 0xc73c50a7)] = 'V970NewLinearFusionRifle0Skins'),
          (a[(a.V970RaidAutoRifle0 = 0x1e39a571)] = 'V970RaidAutoRifle0'),
          (a[(a.V970RaidHandCannon0 = 0xc6067e22)] = 'V970RaidHandCannon0'),
          (a[(a.V970RaidMachinegun0 = 0xbf794da)] = 'V970RaidMachinegun0'),
          (a[(a.V970RaidPulseRifle0 = 0x4c3f01c5)] = 'V970RaidPulseRifle0'),
          (a[(a.V970RaidShotgun0 = 0x40c7dd0f)] = 'V970RaidShotgun0'),
          (a[(a.V970RaidSniperRifle0 = 0xc86c26b1)] = 'V970RaidSniperRifle0'),
          (a[(a.V970WeaponsActivitiesBlackArmoryAutoRifle0Skins = 0x3cb59872)] =
            'V970WeaponsActivitiesBlackArmoryAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryBow0Skins = 9206698)] =
            'V970WeaponsActivitiesBlackArmoryBow0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryFusionRifle0Skins = 0xeec8c155)] =
            'V970WeaponsActivitiesBlackArmoryFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryHandCannon0Skins = 0xc093a5ad)] =
            'V970WeaponsActivitiesBlackArmoryHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryMachinegun0Skins = 0x173cfcd5)] =
            'V970WeaponsActivitiesBlackArmoryMachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryPulseRifle0Skins = 0x3173e77e)] =
            'V970WeaponsActivitiesBlackArmoryPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryRocketLauncher0Skins = 0x94c28ddb)] =
            'V970WeaponsActivitiesBlackArmoryRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmoryScoutRifle0Skins = 0xfb070a95)] =
            'V970WeaponsActivitiesBlackArmoryScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmorySniperRifle0Skins = 0x113877fa)] =
            'V970WeaponsActivitiesBlackArmorySniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesBlackArmorySword0Skins = 0x800f1677)] =
            'V970WeaponsActivitiesBlackArmorySword0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleAutoRifle0Skins = 0x1811bb07)] =
            'V970WeaponsActivitiesCrucibleAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleHandCannon0Skins = 0x3cb0e236)] =
            'V970WeaponsActivitiesCrucibleHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleHandCannon1Skins = 0xfd7ce443)] =
            'V970WeaponsActivitiesCrucibleHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesCruciblePulseRifle0Skins = 0x85f8e87d)] =
            'V970WeaponsActivitiesCruciblePulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesCruciblePulseRifle1Skins = 0xddf15eb8)] =
            'V970WeaponsActivitiesCruciblePulseRifle1Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleScoutRifle0Skins = 0x6f44a88e)] =
            'V970WeaponsActivitiesCrucibleScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleSidearm0Skins = 0xd898a5c2)] =
            'V970WeaponsActivitiesCrucibleSidearm0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleSniperRifle0Skins = 0x1276b92b)] =
            'V970WeaponsActivitiesCrucibleSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleSubmachinegun0Skins = 0x9530db56)] =
            'V970WeaponsActivitiesCrucibleSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesCrucibleSubmachinegun1Skins = 0x29bdcc63)] =
            'V970WeaponsActivitiesCrucibleSubmachinegun1Skins'),
          (a[(a.V970WeaponsActivitiesDungeonDualityGrenadeLauncher0Skins = 0x763180f6)] =
            'V970WeaponsActivitiesDungeonDualityGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonDualityLinearFusionRifle0Skins = 0x5cbaf5e)] =
            'V970WeaponsActivitiesDungeonDualityLinearFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonDualityPulseRifle0Skins = 0xc9072e21)] =
            'V970WeaponsActivitiesDungeonDualityPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonDualitySubmachinegun0Skins = 0x5eea1a5a)] =
            'V970WeaponsActivitiesDungeonDualitySubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGhostsGlaive0Skins = 0x13f28e43)] =
            'V970WeaponsActivitiesDungeonGhostsGlaive0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGhostsGrenadeLauncher0Skins = 0x7838fc08)] =
            'V970WeaponsActivitiesDungeonGhostsGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGhostsRocketLauncher0Skins = 0x15a284f2)] =
            'V970WeaponsActivitiesDungeonGhostsRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGhostsSubmachinegun0Skins = 0x7d948054)] =
            'V970WeaponsActivitiesDungeonGhostsSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGraspHandCannon0Skins = 0x7701756b)] =
            'V970WeaponsActivitiesDungeonGraspHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGraspShotgun0Skins = 0x848b67de)] =
            'V970WeaponsActivitiesDungeonGraspShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGraspSniperRifle0Skins = 0x60726188)] =
            'V970WeaponsActivitiesDungeonGraspSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonGraspSword0Skins = 0x9abc5431)] =
            'V970WeaponsActivitiesDungeonGraspSword0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonPitAutoRifle0Skins = 0xcc30eef6)] =
            'V970WeaponsActivitiesDungeonPitAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonPitGlaive0Skins = 0x16653e68)] =
            'V970WeaponsActivitiesDungeonPitGlaive0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonPitGrenadeLauncher0Skins = 0x656765c7)] =
            'V970WeaponsActivitiesDungeonPitGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonPitLinearFusionRifle0Skins = 0x53b6eb91)] =
            'V970WeaponsActivitiesDungeonPitLinearFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecyAutoRifle0Skins = 0xf9a6b03)] =
            'V970WeaponsActivitiesDungeonProphecyAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecyHandCannon0Skins = 0x757ab42a)] =
            'V970WeaponsActivitiesDungeonProphecyHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecyPulseRifle0Skins = 0x1ac6fab1)] =
            'V970WeaponsActivitiesDungeonProphecyPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecyPulseRifle1Skins = 0x5d9281ac)] =
            'V970WeaponsActivitiesDungeonProphecyPulseRifle1Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecyShotgun0Skins = 0x5590208b)] =
            'V970WeaponsActivitiesDungeonProphecyShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonProphecySubmachinegun0Skins = 0x63efa1aa)] =
            'V970WeaponsActivitiesDungeonProphecySubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonShatteredAutoRifle0Skins = 0x5e591ef1)] =
            'V970WeaponsActivitiesDungeonShatteredAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonShatteredGrenadeLauncher0Skins = 0xc71fa710)] =
            'V970WeaponsActivitiesDungeonShatteredGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonShatteredHandCannon0Skins = 0x165a0508)] =
            'V970WeaponsActivitiesDungeonShatteredHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonShatteredShotgun0Skins = 0xc5ed4fb5)] =
            'V970WeaponsActivitiesDungeonShatteredShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSpireGrenadeLauncher0Skins = 0x55665d55)] =
            'V970WeaponsActivitiesDungeonSpireGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSpireMachinegun0Skins = 0xee0ffb93)] =
            'V970WeaponsActivitiesDungeonSpireMachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSpireScoutRifle0Skins = 0xb5488caf)] =
            'V970WeaponsActivitiesDungeonSpireScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSpireSidearm0Skins = 0x3507c307)] =
            'V970WeaponsActivitiesDungeonSpireSidearm0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSunderedHandCannon0Skins = 0xe1948160)] =
            'V970WeaponsActivitiesDungeonSunderedHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSunderedScoutRifle0Skins = 0x82204e4c)] =
            'V970WeaponsActivitiesDungeonSunderedScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSunderedShotgun0Skins = 0x40d740ed)] =
            'V970WeaponsActivitiesDungeonSunderedShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonSunderedTraceRifle0Skins = 0x7f951513)] =
            'V970WeaponsActivitiesDungeonSunderedTraceRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonVesperAutoRifle0Skins = 0xe6fe627a)] =
            'V970WeaponsActivitiesDungeonVesperAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonVesperFusionRifle0Skins = 0x14edfcdd)] =
            'V970WeaponsActivitiesDungeonVesperFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonVesperGrenadeLauncher0Skins = 0x7f6d2f93)] =
            'V970WeaponsActivitiesDungeonVesperGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonVesperGrenadeLauncher1Skins = 0x864aa7c6)] =
            'V970WeaponsActivitiesDungeonVesperGrenadeLauncher1Skins'),
          (a[(a.V970WeaponsActivitiesDungeonWarlordBow0Skins = 0xc39cbf42)] =
            'V970WeaponsActivitiesDungeonWarlordBow0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonWarlordSidearm0Skins = 0x106ee205)] =
            'V970WeaponsActivitiesDungeonWarlordSidearm0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonWarlordSniperRifle0Skins = 0x9a1e41c2)] =
            'V970WeaponsActivitiesDungeonWarlordSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesDungeonWarlordSword0Skins = 0xd1cf780f)] =
            'V970WeaponsActivitiesDungeonWarlordSword0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamAutoRifle0Skins = 0x84d91443)] =
            'V970WeaponsActivitiesFireteamAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamFusionRifle0Skins = 0x950bcdfc)] =
            'V970WeaponsActivitiesFireteamFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamHandCannon0Skins = 0xb8138a6a)] =
            'V970WeaponsActivitiesFireteamHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamPulseRifle0Skins = 0xaf051bf1)] =
            'V970WeaponsActivitiesFireteamPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamRocketLauncher0Skins = 0xcca9e740)] =
            'V970WeaponsActivitiesFireteamRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamScoutRifle0Skins = 0x188cfd52)] =
            'V970WeaponsActivitiesFireteamScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamSidearm0Skins = 0xeae5a916)] =
            'V970WeaponsActivitiesFireteamSidearm0Skins'),
          (a[(a.V970WeaponsActivitiesFireteamSubmachinegun0Skins = 0x474389ea)] =
            'V970WeaponsActivitiesFireteamSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesGambitAutoRifle0Skins = 0xe821ed32)] =
            'V970WeaponsActivitiesGambitAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesGambitBow0Skins = 0xca135f6a)] =
            'V970WeaponsActivitiesGambitBow0Skins'),
          (a[(a.V970WeaponsActivitiesGambitGrenadeLauncher0Skins = 0x8a4274db)] =
            'V970WeaponsActivitiesGambitGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesGambitHandCannon0Skins = 0x5637ba6d)] =
            'V970WeaponsActivitiesGambitHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesGambitHandCannon1Skins = 0xd2e4ca8)] =
            'V970WeaponsActivitiesGambitHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesGambitMachinegun0Skins = 0x2a0ca395)] =
            'V970WeaponsActivitiesGambitMachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesGambitPulseRifle0Skins = 0xdbd09e3e)] =
            'V970WeaponsActivitiesGambitPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesGambitRocketLauncher0Skins = 0x90369b9b)] =
            'V970WeaponsActivitiesGambitRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesGambitShotgun0Skins = 0xf9293114)] =
            'V970WeaponsActivitiesGambitShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesGambitShotgun1Skins = 0xb4c4f8b9)] =
            'V970WeaponsActivitiesGambitShotgun1Skins'),
          (a[(a.V970WeaponsActivitiesGambitSniperRifle0Skins = 0x9c0884ba)] =
            'V970WeaponsActivitiesGambitSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesGambitSubmachinegun0Skins = 0xdd573639)] =
            'V970WeaponsActivitiesGambitSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesGloryAutoRifle0Skins = 0x526af165)] =
            'V970WeaponsActivitiesGloryAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesGloryHandCannon0Skins = 0xa9357e44)] =
            'V970WeaponsActivitiesGloryHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesGloryHandCannon1Skins = 0x1f0207e9)] =
            'V970WeaponsActivitiesGloryHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesGloryPulseRifle0Skins = 0xb0504b67)] =
            'V970WeaponsActivitiesGloryPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesGloryPulseRifle1Skins = 0xfdf323ca)] =
            'V970WeaponsActivitiesGloryPulseRifle1Skins'),
          (a[(a.V970WeaponsActivitiesGloryShotgun0Skins = 0xdbfc8e11)] =
            'V970WeaponsActivitiesGloryShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesGlorySniperRifle0Skins = 0x47c58af9)] =
            'V970WeaponsActivitiesGlorySniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightGrenadeLauncher0Skins = 0xd4abdeda)] =
            'V970WeaponsActivitiesIntoTheLightGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightGrenadeLauncher1Skins = 0x23945f37)] =
            'V970WeaponsActivitiesIntoTheLightGrenadeLauncher1Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightGrenadeLauncher2Skins = 0xbfcc7368)] =
            'V970WeaponsActivitiesIntoTheLightGrenadeLauncher2Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightHandCannon0Skins = 0xa52a23e)] =
            'V970WeaponsActivitiesIntoTheLightHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightHandCannon1Skins = 0x4cae47ab)] =
            'V970WeaponsActivitiesIntoTheLightHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightPulseRifle0Skins = 0x571db75)] =
            'V970WeaponsActivitiesIntoTheLightPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightScoutRifle0Skins = 0xbaed04e6)] =
            'V970WeaponsActivitiesIntoTheLightScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightSniperRifle0Skins = 0xc363b883)] =
            'V970WeaponsActivitiesIntoTheLightSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightSubmachinegun0Skins = 0xcc1e085e)] =
            'V970WeaponsActivitiesIntoTheLightSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesIntoTheLightSword0Skins = 0x45c11224)] =
            'V970WeaponsActivitiesIntoTheLightSword0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerAutoRifle0Skins = 0xf8b207f1)] =
            'V970WeaponsActivitiesIronBannerAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerAutoRifle1Skins = 0x7e907eec)] =
            'V970WeaponsActivitiesIronBannerAutoRifle1Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerBow0Skins = 0x33896243)] =
            'V970WeaponsActivitiesIronBannerBow0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerFusionRifle0Skins = 0x769cc89e)] =
            'V970WeaponsActivitiesIronBannerFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerFusionRifle1Skins = 0x3b54368b)] =
            'V970WeaponsActivitiesIronBannerFusionRifle1Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerHandCannon0Skins = 0x1050d008)] =
            'V970WeaponsActivitiesIronBannerHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerPulseRifle0Skins = 0xfd40c1eb)] =
            'V970WeaponsActivitiesIronBannerPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerRocketLauncher0Skins = 0xc08673fa)] =
            'V970WeaponsActivitiesIronBannerRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerShotgun1Skins = 0x3aed2a70)] =
            'V970WeaponsActivitiesIronBannerShotgun1Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerSniperRifle0Skins = 0x353b4fed)] =
            'V970WeaponsActivitiesIronBannerSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesIronBannerSubmachinegun0Skins = 0x8d1a0ccc)] =
            'V970WeaponsActivitiesIronBannerSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleFusionRifle0Skins = 0x71810def)] =
            'V970WeaponsActivitiesPinnacleFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleGrenadeLauncher0Skins = 0x75e2eded)] =
            'V970WeaponsActivitiesPinnacleGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleHandCannon0Skins = 0x47ed00a3)] =
            'V970WeaponsActivitiesPinnacleHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleHandCannon1Skins = 0x6dd2b696)] =
            'V970WeaponsActivitiesPinnacleHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesPinnaclePulseRifle0Skins = 0x4c616588)] =
            'V970WeaponsActivitiesPinnaclePulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleRocketLauncher0Skins = 0x590b393d)] =
            'V970WeaponsActivitiesPinnacleRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleSidearm0Skins = 0x97dd867f)] =
            'V970WeaponsActivitiesPinnacleSidearm0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleSniperRifle0Skins = 9012016)] =
            'V970WeaponsActivitiesPinnacleSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesPinnacleSword0Skins = 0x854639c9)] =
            'V970WeaponsActivitiesPinnacleSword0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsAutoRifle0Skins = 0x525b9604)] =
            'V970WeaponsActivitiesSoloOpsAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsFusionRifle0Skins = 0xeaf9fe73)] =
            'V970WeaponsActivitiesSoloOpsFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsGlaive0Skins = 0x65d162b6)] =
            'V970WeaponsActivitiesSoloOpsGlaive0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsGrenadeLauncher0Skins = 0x89426511)] =
            'V970WeaponsActivitiesSoloOpsGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsHandCannon0Skins = 0xb0d1cec7)] =
            'V970WeaponsActivitiesSoloOpsHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsMachinegun0Skins = 0x5f7ac57f)] =
            'V970WeaponsActivitiesSoloOpsMachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsPulseRifle0Skins = 0x7f59485c)] =
            'V970WeaponsActivitiesSoloOpsPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsRocketLauncher0Skins = 0xf8de5f9)] =
            'V970WeaponsActivitiesSoloOpsRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsScoutRifle0Skins = 0x3c4ea90b)] =
            'V970WeaponsActivitiesSoloOpsScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsShotgun0Skins = 0xb3f0d4fa)] =
            'V970WeaponsActivitiesSoloOpsShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsSubmachinegun0Skins = 0x5552e92f)] =
            'V970WeaponsActivitiesSoloOpsSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesSoloOpsSword0Skins = 0x2262e58d)] =
            'V970WeaponsActivitiesSoloOpsSword0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsAutoRifle0Skins = 0xef01d2fb)] =
            'V970WeaponsActivitiesTrialsAutoRifle0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsFusionRifle0Skins = 0x7b452994)] =
            'V970WeaponsActivitiesTrialsFusionRifle0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsHandCannon0Skins = 0xfe461142)] =
            'V970WeaponsActivitiesTrialsHandCannon0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsHandCannon1Skins = 0xed0cf11f)] =
            'V970WeaponsActivitiesTrialsHandCannon1Skins'),
          (a[(a.V970WeaponsActivitiesTrialsPulseRifle0Skins = 0x5dfa0b39)] =
            'V970WeaponsActivitiesTrialsPulseRifle0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsRocketLauncher0Skins = 0xf8c2db48)] =
            'V970WeaponsActivitiesTrialsRocketLauncher0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsScoutRifle0Skins = 0xc120b6da)] =
            'V970WeaponsActivitiesTrialsScoutRifle0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsShotgun0Skins = 0x4e06e5e3)] =
            'V970WeaponsActivitiesTrialsShotgun0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsSniperRifle0Skins = 0x6bec3bc7)] =
            'V970WeaponsActivitiesTrialsSniperRifle0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsSniperRifle1Skins = 0x8fafdaaa)] =
            'V970WeaponsActivitiesTrialsSniperRifle1Skins'),
          (a[(a.V970WeaponsActivitiesTrialsSubmachinegun0Skins = 0x7b033862)] =
            'V970WeaponsActivitiesTrialsSubmachinegun0Skins'),
          (a[(a.V970WeaponsActivitiesTrialsSword0Skins = 0x828e668)] =
            'V970WeaponsActivitiesTrialsSword0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeAutoRifle0Skins = 0xae200ce0)] =
            'V970WeaponsDestinationsCosmodromeAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeHandCannon0Skins = 0xd5807e4b)] =
            'V970WeaponsDestinationsCosmodromeHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeMachinegun0Skins = 0x52535c23)] =
            'V970WeaponsDestinationsCosmodromeMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeShotgun0Skins = 0x77f4f77e)] =
            'V970WeaponsDestinationsCosmodromeShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeSidearm0Skins = 0x11bbaed7)] =
            'V970WeaponsDestinationsCosmodromeSidearm0Skins'),
          (a[(a.V970WeaponsDestinationsCosmodromeSubmachinegun0Skins = 0xd4c74173)] =
            'V970WeaponsDestinationsCosmodromeSubmachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCityAutoRifle0Skins = 0x397b7ccd)] =
            'V970WeaponsDestinationsDreamingCityAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCityHandCannon0Skins = 0x9c335dac)] =
            'V970WeaponsDestinationsDreamingCityHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCityRocketLauncher0Skins = 0xe4057d76)] =
            'V970WeaponsDestinationsDreamingCityRocketLauncher0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCityScoutRifle0Skins = 0xcd94c268)] =
            'V970WeaponsDestinationsDreamingCityScoutRifle0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCityShotgun0Skins = 0x6fca7c99)] =
            'V970WeaponsDestinationsDreamingCityShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCitySniperRifle0Skins = 0x22bb25f1)] =
            'V970WeaponsDestinationsDreamingCitySniperRifle0Skins'),
          (a[(a.V970WeaponsDestinationsDreamingCitySword0Skins = 0x8d310596)] =
            'V970WeaponsDestinationsDreamingCitySword0Skins'),
          (a[(a.V970WeaponsDestinationsEdzAutoRifle0Skins = 0x31de09f9)] =
            'V970WeaponsDestinationsEdzAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEdzFusionRifle0Skins = 0x2e0bd586)] =
            'V970WeaponsDestinationsEdzFusionRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEdzPulseRifle0Skins = 0xa46da9a3)] =
            'V970WeaponsDestinationsEdzPulseRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEdzSniperRifle0Skins = 0x7631ca45)] =
            'V970WeaponsDestinationsEdzSniperRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEdzSubmachinegun0Skins = 0xbe085454)] =
            'V970WeaponsDestinationsEdzSubmachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsEdzSword0Skins = 0x4316d1ba)] =
            'V970WeaponsDestinationsEdzSword0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaAutoRifle0Skins = 0x69fa7852)] =
            'V970WeaponsDestinationsEuropaAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaBow0Skins = 0xf0a15dca)] =
            'V970WeaponsDestinationsEuropaBow0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaFusionRifle0Skins = 0xd1fa0f35)] =
            'V970WeaponsDestinationsEuropaFusionRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaMachinegun0Skins = 0xcc117975)] =
            'V970WeaponsDestinationsEuropaMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaPulseRifle0Skins = 0x2b157c5e)] =
            'V970WeaponsDestinationsEuropaPulseRifle0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaRocketLauncher0Skins = 0xe534563b)] =
            'V970WeaponsDestinationsEuropaRocketLauncher0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaShotgun0Skins = 0x8e2b07f4)] =
            'V970WeaponsDestinationsEuropaShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsEuropaSidearm0Skins = 0xee6eb8bd)] =
            'V970WeaponsDestinationsEuropaSidearm0Skins'),
          (a[(a.V970WeaponsDestinationsMoonAutoRifle0Skins = 0x77100653)] =
            'V970WeaponsDestinationsMoonAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsMoonFusionRifle0Skins = 0x1275b70c)] =
            'V970WeaponsDestinationsMoonFusionRifle0Skins'),
          (a[(a.V970WeaponsDestinationsMoonGrenadeLauncher0Skins = 0x128393d6)] =
            'V970WeaponsDestinationsMoonGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsDestinationsMoonHandCannon0Skins = 0xda8ee0ba)] =
            'V970WeaponsDestinationsMoonHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsMoonMachinegun0Skins = 0xde6c2138)] =
            'V970WeaponsDestinationsMoonMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsMoonPulseRifle0Skins = 0x1dabc981)] =
            'V970WeaponsDestinationsMoonPulseRifle0Skins'),
          (a[(a.V970WeaponsDestinationsMoonRocketLauncher0Skins = 0x8d713850)] =
            'V970WeaponsDestinationsMoonRocketLauncher0Skins'),
          (a[(a.V970WeaponsDestinationsMoonShotgun0Skins = 0x82ee44db)] =
            'V970WeaponsDestinationsMoonShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsMoonShotgun1Skins = 0xa6ab452e)] =
            'V970WeaponsDestinationsMoonShotgun1Skins'),
          (a[(a.V970WeaponsDestinationsMoonSniperRifle0Skins = 0x75ee398f)] =
            'V970WeaponsDestinationsMoonSniperRifle0Skins'),
          (a[(a.V970WeaponsDestinationsMoonSniperRifle1Skins = 0xfedee172)] =
            'V970WeaponsDestinationsMoonSniperRifle1Skins'),
          (a[(a.V970WeaponsDestinationsMoonSubmachinegun0Skins = 0xa032817a)] =
            'V970WeaponsDestinationsMoonSubmachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsMoonSword0Skins = 0x133a140)] =
            'V970WeaponsDestinationsMoonSword0Skins'),
          (a[(a.V970WeaponsDestinationsNeomunaHandCannon0Skins = 0xb5972568)] =
            'V970WeaponsDestinationsNeomunaHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsNeomunaMachinegun0Skins = 0x95caccfe)] =
            'V970WeaponsDestinationsNeomunaMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsNeomunaShotgun0Skins = 0x9330cb55)] =
            'V970WeaponsDestinationsNeomunaShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsNeomunaSubmachinegun0Skins = 0xcd648c6c)] =
            'V970WeaponsDestinationsNeomunaSubmachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsNessusAutoRifle0Skins = 0x79e64861)] =
            'V970WeaponsDestinationsNessusAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsNessusHandCannon0Skins = 0x827b1d38)] =
            'V970WeaponsDestinationsNessusHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsNessusMachinegun0Skins = 0xd0d5022e)] =
            'V970WeaponsDestinationsNessusMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsNessusRocketLauncher0Skins = 0x414ab12a)] =
            'V970WeaponsDestinationsNessusRocketLauncher0Skins'),
          (a[(a.V970WeaponsDestinationsNessusShotgun0Skins = 0x80b7bf65)] =
            'V970WeaponsDestinationsNessusShotgun0Skins'),
          (a[(a.V970WeaponsDestinationsNessusSniperRifle0Skins = 0x26d3a9bd)] =
            'V970WeaponsDestinationsNessusSniperRifle0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightAutoRifle0Skins = 0xd380cd6)] =
            'V970WeaponsDestinationsSpotlightAutoRifle0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightFusionRifle0Skins = 0xbfca9341)] =
            'V970WeaponsDestinationsSpotlightFusionRifle0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightHandCannon0Skins = 0xba438c69)] =
            'V970WeaponsDestinationsSpotlightHandCannon0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightMachinegun0Skins = 0x1efaabc1)] =
            'V970WeaponsDestinationsSpotlightMachinegun0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightSniperRifle0Skins = 0xf6ff0eb6)] =
            'V970WeaponsDestinationsSpotlightSniperRifle0Skins'),
          (a[(a.V970WeaponsDestinationsSpotlightSubmachinegun0Skins = 0x65487ef5)] =
            'V970WeaponsDestinationsSpotlightSubmachinegun0Skins'),
          (a[(a.V970WeaponsEventsDawningGlaive0Skins = 0x5fae69fe)] =
            'V970WeaponsEventsDawningGlaive0Skins'),
          (a[(a.V970WeaponsEventsDawningPulseRifle0Skins = 0xa5fbad54)] =
            'V970WeaponsEventsDawningPulseRifle0Skins'),
          (a[(a.V970WeaponsEventsDawningSword0Skins = 0xdc0a5295)] =
            'V970WeaponsEventsDawningSword0Skins'),
          (a[(a.V970WeaponsEventsFotlAutoRifle0Skins = 0xb98b87f9)] =
            'V970WeaponsEventsFotlAutoRifle0Skins'),
          (a[(a.V970WeaponsEventsFotlGrenadeLauncher0Skins = 0x1b5a608)] =
            'V970WeaponsEventsFotlGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsEventsFotlSniperRifle0Skins = 0xc6667845)] =
            'V970WeaponsEventsFotlSniperRifle0Skins'),
          (a[(a.V970WeaponsEventsGgGrenadeLauncher0Skins = 0x4a302d9b)] =
            'V970WeaponsEventsGgGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsEventsGgScoutRifle0Skins = 0x6aae8315)] =
            'V970WeaponsEventsGgScoutRifle0Skins'),
          (a[(a.V970WeaponsEventsGgSubmachinegun0Skins = 0xb0b3bcf9)] =
            'V970WeaponsEventsGgSubmachinegun0Skins'),
          (a[(a.V970WeaponsEventsSolsticeRocketLauncher0Skins = 0xf0423fa5)] =
            'V970WeaponsEventsSolsticeRocketLauncher0Skins'),
          (a[(a.V970WeaponsEventsSolsticeShotgun0Skins = 0x59e9abae)] =
            'V970WeaponsEventsSolsticeShotgun0Skins'),
          (a[(a.V970WeaponsEventsSrlAutoRifle0Skins = 0x7ff4bb37)] =
            'V970WeaponsEventsSrlAutoRifle0Skins'),
          (a[(a.V970WeaponsEventsSrlFusionRifle0Skins = 0xa30fefa8)] =
            'V970WeaponsEventsSrlFusionRifle0Skins'),
          (a[(a.V970WeaponsEventsSrlPulseRifle0Skins = 0x5511e62d)] =
            'V970WeaponsEventsSrlPulseRifle0Skins'),
          (a[(a.V970WeaponsEventsSrlRocketLauncher0Skins = 0x921554e4)] =
            'V970WeaponsEventsSrlRocketLauncher0Skins'),
          (a[(a.V970WeaponsEventsSrlSubmachinegun0Skins = 0xe45ee6c6)] =
            'V970WeaponsEventsSrlSubmachinegun0Skins'),
          (a[(a.V970WeaponsEventsSrlSword0Skins = 0xe50b002c)] = 'V970WeaponsEventsSrlSword0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithFusionRifle0Skins = 0x895baccd)] =
            'V970WeaponsFocusingGunsmithFusionRifle0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithHandCannon0Skins = 0xd2d492a5)] =
            'V970WeaponsFocusingGunsmithHandCannon0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithMachinegun0Skins = 0x9ece0a1d)] =
            'V970WeaponsFocusingGunsmithMachinegun0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithPulseRifle0Skins = 0xf7056e6)] =
            'V970WeaponsFocusingGunsmithPulseRifle0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithPulseRifle1Skins = 0x6f633733)] =
            'V970WeaponsFocusingGunsmithPulseRifle1Skins'),
          (a[(a.V970WeaponsFocusingGunsmithScoutRifle0Skins = 0x2286fbfd)] =
            'V970WeaponsFocusingGunsmithScoutRifle0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithScoutRifle1Skins = 0x7a7f7238)] =
            'V970WeaponsFocusingGunsmithScoutRifle1Skins'),
          (a[(a.V970WeaponsFocusingGunsmithScoutRifle2Skins = 0xf1694e07)] =
            'V970WeaponsFocusingGunsmithScoutRifle2Skins'),
          (a[(a.V970WeaponsFocusingGunsmithScoutRifle3Skins = 0x152cedea)] =
            'V970WeaponsFocusingGunsmithScoutRifle3Skins'),
          (a[(a.V970WeaponsFocusingGunsmithShotgun0Skins = 0x256d348c)] =
            'V970WeaponsFocusingGunsmithShotgun0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithSidearm0Skins = 0x2ab64545)] =
            'V970WeaponsFocusingGunsmithSidearm0Skins'),
          (a[(a.V970WeaponsFocusingGunsmithSword0Skins = 0xe967574f)] =
            'V970WeaponsFocusingGunsmithSword0Skins'),
          (a[(a.V970WeaponsFocusingWorldAutoRifle0Skins = 0x1d33fb05)] =
            'V970WeaponsFocusingWorldAutoRifle0Skins'),
          (a[(a.V970WeaponsFocusingWorldAutoRifle1Skins = 0xf1376580)] =
            'V970WeaponsFocusingWorldAutoRifle1Skins'),
          (a[(a.V970WeaponsFocusingWorldFusionRifle0Skins = 0x511a82ea)] =
            'V970WeaponsFocusingWorldFusionRifle0Skins'),
          (a[(a.V970WeaponsFocusingWorldGrenadeLauncher0Skins = 0x6398580c)] =
            'V970WeaponsFocusingWorldGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsFocusingWorldPulseRifle0Skins = 0xbeb56b87)] =
            'V970WeaponsFocusingWorldPulseRifle0Skins'),
          (a[(a.V970WeaponsFocusingWorldPulseRifle1Skins = 0xe2790b6a)] =
            'V970WeaponsFocusingWorldPulseRifle1Skins'),
          (a[(a.V970WeaponsFocusingWorldScoutRifle0Skins = 0xb794f1d0)] =
            'V970WeaponsFocusingWorldScoutRifle0Skins'),
          (a[(a.V970WeaponsFocusingWorldShotgun0Skins = 0xd0d7c0f1)] =
            'V970WeaponsFocusingWorldShotgun0Skins'),
          (a[(a.V970WeaponsFocusingWorldSidearm0Skins = 0x446b04bc)] =
            'V970WeaponsFocusingWorldSidearm0Skins'),
          (a[(a.V970WeaponsFocusingWorldSidearm1Skins = 0x5cefa041)] =
            'V970WeaponsFocusingWorldSidearm1Skins'),
          (a[(a.V970WeaponsFocusingWorldSubmachinegun0Skins = 0xa98d64f8)] =
            'V970WeaponsFocusingWorldSubmachinegun0Skins'),
          (a[(a.V970WeaponsFocusingWorldSword0Skins = 0x8e8f25ce)] =
            'V970WeaponsFocusingWorldSword0Skins'),
          (a[(a.V970WeaponsRepriseCruciblePulseRifle0Skins = 0x519bdad0)] =
            'V970WeaponsRepriseCruciblePulseRifle0Skins'),
          (a[(a.V970WeaponsRepriseCrucibleShotgun0Skins = 0xcd8d27ee)] =
            'V970WeaponsRepriseCrucibleShotgun0Skins'),
          (a[(a.V970WeaponsRepriseCrucibleSidearm0Skins = 0x5b463927)] =
            'V970WeaponsRepriseCrucibleSidearm0Skins'),
          (a[(a.V970WeaponsRepriseGambitAutoRifle0Skins = 0xdb4892d)] =
            'V970WeaponsRepriseGambitAutoRifle0Skins'),
          (a[(a.V970WeaponsRepriseGambitAutoRifle1Skins = 0xd7d79368)] =
            'V970WeaponsRepriseGambitAutoRifle1Skins'),
          (a[(a.V970WeaponsRepriseGambitGlaive0Skins = 0xd3a9ec8f)] =
            'V970WeaponsRepriseGambitGlaive0Skins'),
          (a[(a.V970WeaponsRepriseGambitHandCannon0Skins = 0xf9e2f00c)] =
            'V970WeaponsRepriseGambitHandCannon0Skins'),
          (a[(a.V970WeaponsRepriseGambitLinearFusionRifle0Skins = 0x6343b644)] =
            'V970WeaponsRepriseGambitLinearFusionRifle0Skins'),
          (a[(a.V970WeaponsRepriseGambitPulseRifle0Skins = 0xecf30df)] =
            'V970WeaponsRepriseGambitPulseRifle0Skins'),
          (a[(a.V970WeaponsRepriseGambitScoutRifle0Skins = 0x9905f948)] =
            'V970WeaponsRepriseGambitScoutRifle0Skins'),
          (a[(a.V970WeaponsRepriseGambitSidearm0Skins = 0xce908e34)] =
            'V970WeaponsRepriseGambitSidearm0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerGrenadeLauncher0Skins = 0x17a20c5d)] =
            'V970WeaponsRepriseIronBannerGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerHandCannon0Skins = 0xcec41353)] =
            'V970WeaponsRepriseIronBannerHandCannon0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerMachinegun0Skins = 0x239f9cfb)] =
            'V970WeaponsRepriseIronBannerMachinegun0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerPulseRifle0Skins = 0xe1bfcc38)] =
            'V970WeaponsRepriseIronBannerPulseRifle0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerPulseRifle1Skins = 0x89c755fd)] =
            'V970WeaponsRepriseIronBannerPulseRifle1Skins'),
          (a[(a.V970WeaponsRepriseIronBannerShotgun0Skins = 0x5a476a46)] =
            'V970WeaponsRepriseIronBannerShotgun0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerSidearm0Skins = 0x26467bcf)] =
            'V970WeaponsRepriseIronBannerSidearm0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerSidearm1Skins = 0x3d3230b2)] =
            'V970WeaponsRepriseIronBannerSidearm1Skins'),
          (a[(a.V970WeaponsRepriseIronBannerSidearm2Skins = 0xb2d48565)] =
            'V970WeaponsRepriseIronBannerSidearm2Skins'),
          (a[(a.V970WeaponsRepriseIronBannerSniperRifle0Skins = 0x940a5340)] =
            'V970WeaponsRepriseIronBannerSniperRifle0Skins'),
          (a[(a.V970WeaponsRepriseIronBannerSubmachinegun0Skins = 0xf0bc1d1b)] =
            'V970WeaponsRepriseIronBannerSubmachinegun0Skins'),
          (a[(a.V970WeaponsRepriseNightfallAutoRifle0Skins = 0x4476a17a)] =
            'V970WeaponsRepriseNightfallAutoRifle0Skins'),
          (a[(a.V970WeaponsRepriseNightfallFusionRifle0Skins = 0x3745d3dd)] =
            'V970WeaponsRepriseNightfallFusionRifle0Skins'),
          (a[(a.V970WeaponsRepriseNightfallFusionRifle1Skins = 0x8cc3e118)] =
            'V970WeaponsRepriseNightfallFusionRifle1Skins'),
          (a[(a.V970WeaponsRepriseNightfallGlaive0Skins = 0xb2590004)] =
            'V970WeaponsRepriseNightfallGlaive0Skins'),
          (a[(a.V970WeaponsRepriseNightfallGrenadeLauncher0Skins = 0x592b7693)] =
            'V970WeaponsRepriseNightfallGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsRepriseNightfallGrenadeLauncher1Skins = 0x6008eec6)] =
            'V970WeaponsRepriseNightfallGrenadeLauncher1Skins'),
          (a[(a.V970WeaponsRepriseNightfallHandCannon0Skins = 0x94f504f5)] =
            'V970WeaponsRepriseNightfallHandCannon0Skins'),
          (a[(a.V970WeaponsRepriseNightfallLinearFusionRifle0Skins = 0xfd2a9eb5)] =
            'V970WeaponsRepriseNightfallLinearFusionRifle0Skins'),
          (a[(a.V970WeaponsRepriseNightfallPulseRifle0Skins = 0x7ebccc36)] =
            'V970WeaponsRepriseNightfallPulseRifle0Skins'),
          (a[(a.V970WeaponsRepriseNightfallShotgun0Skins = 0xc880125c)] =
            'V970WeaponsRepriseNightfallShotgun0Skins'),
          (a[(a.V970WeaponsRepriseNightfallSidearm0Skins = 0x903c9bf5)] =
            'V970WeaponsRepriseNightfallSidearm0Skins'),
          (a[(a.V970WeaponsRepriseNightfallSniperRifle0Skins = 0x1cf0f0f2)] =
            'V970WeaponsRepriseNightfallSniperRifle0Skins'),
          (a[(a.V970WeaponsRepriseTrialsHandCannon0Skins = 0x63fc0983)] =
            'V970WeaponsRepriseTrialsHandCannon0Skins'),
          (a[(a.V970WeaponsRepriseTrialsLinearFusionRifle0Skins = 0x4fdbdb9f)] =
            'V970WeaponsRepriseTrialsLinearFusionRifle0Skins'),
          (a[(a.V970WeaponsRepriseVanguardAutoRifle0Skins = 0xbc454afd)] =
            'V970WeaponsRepriseVanguardAutoRifle0Skins'),
          (a[(a.V970WeaponsRepriseVanguardGrenadeLauncher0Skins = 0x6c52774)] =
            'V970WeaponsRepriseVanguardGrenadeLauncher0Skins'),
          (a[(a.V970WeaponsRepriseVanguardPulseRifle0Skins = 0x8f5aa2af)] =
            'V970WeaponsRepriseVanguardPulseRifle0Skins'),
          (a[(a.V970WeaponsRepriseVanguardShotgun0Skins = 0x2c8b749)] =
            'V970WeaponsRepriseVanguardShotgun0Skins'),
          (a[(a.V970WeaponsRepriseVanguardShotgun1Skins = 0xb460fe24)] =
            'V970WeaponsRepriseVanguardShotgun1Skins'),
          (a[(a.V970WeaponsRepriseVanguardSidearm0Skins = 0xe28389e4)] =
            'V970WeaponsRepriseVanguardSidearm0Skins'),
          (a[(a.V970WeaponsRepriseVanguardSidearm1Skins = 0xa9798b09)] =
            'V970WeaponsRepriseVanguardSidearm1Skins'),
          (a[(a.WarlockArcAspects = 0x7dd98c0f)] = 'WarlockArcAspects'),
          (a[(a.WarlockArcClassAbilities = 0x4df7c773)] = 'WarlockArcClassAbilities'),
          (a[(a.WarlockArcMelee = 0x52b52e78)] = 'WarlockArcMelee'),
          (a[(a.WarlockArcMovement = 0x73d77d5b)] = 'WarlockArcMovement'),
          (a[(a.WarlockArcSupers = 0x8838598c)] = 'WarlockArcSupers'),
          (a[(a.WarlockPrismAspects = 0x2de388b4)] = 'WarlockPrismAspects'),
          (a[(a.WarlockPrismClassAbilities = 0xc70729c0)] = 'WarlockPrismClassAbilities'),
          (a[(a.WarlockPrismGrenades = 0xc3f86978)] = 'WarlockPrismGrenades'),
          (a[(a.WarlockPrismMelee = 0xc33866f)] = 'WarlockPrismMelee'),
          (a[(a.WarlockPrismMovement = 0xabda0986)] = 'WarlockPrismMovement'),
          (a[(a.WarlockPrismPrismGrenade = 0x4ff56ecb)] = 'WarlockPrismPrismGrenade'),
          (a[(a.WarlockPrismSupers = 0x646b7a65)] = 'WarlockPrismSupers'),
          (a[(a.WarlockPrismTranscendence = 0x42d56c7a)] = 'WarlockPrismTranscendence'),
          (a[(a.WarlockSharedAspects = 0xe8fc7cc0)] = 'WarlockSharedAspects'),
          (a[(a.WarlockSolarAspects = 0x4e106bc)] = 'WarlockSolarAspects'),
          (a[(a.WarlockSolarClassAbilities = 0x631625c8)] = 'WarlockSolarClassAbilities'),
          (a[(a.WarlockSolarMelee = 0xa8433637)] = 'WarlockSolarMelee'),
          (a[(a.WarlockSolarMovement = 0x6919ce9e)] = 'WarlockSolarMovement'),
          (a[(a.WarlockSolarSupers = 0xb2a8df3d)] = 'WarlockSolarSupers'),
          (a[(a.WarlockStasisClassAbilities = 0x74df6242)] = 'WarlockStasisClassAbilities'),
          (a[(a.WarlockStasisMelee = 0xf048eda1)] = 'WarlockStasisMelee'),
          (a[(a.WarlockStasisMovement = 0x4704e180)] = 'WarlockStasisMovement'),
          (a[(a.WarlockStasisSupers = 0xc971571f)] = 'WarlockStasisSupers'),
          (a[(a.WarlockStasisTotems = 0xb2adaa2d)] = 'WarlockStasisTotems'),
          (a[(a.WarlockStrandAspects = 0x9876ffff)] = 'WarlockStrandAspects'),
          (a[(a.WarlockStrandClassAbilities = 0x832f1a83)] = 'WarlockStrandClassAbilities'),
          (a[(a.WarlockStrandMelee = 0xe8b3b068)] = 'WarlockStrandMelee'),
          (a[(a.WarlockStrandMovement = 0xde3ba0ab)] = 'WarlockStrandMovement'),
          (a[(a.WarlockStrandSupers = 0x69bd7e3c)] = 'WarlockStrandSupers'),
          (a[(a.WarlockVoidAspects = 0xd91a091)] = 'WarlockVoidAspects'),
          (a[(a.WarlockVoidClassAbilities = 0xbedb1f61)] = 'WarlockVoidClassAbilities'),
          (a[(a.WarlockVoidMelee = 0xacdaf546)] = 'WarlockVoidMelee'),
          (a[(a.WarlockVoidMovement = 0xcc51be79)] = 'WarlockVoidMovement'),
          (a[(a.WarlockVoidSupers = 0xf6d6607a)] = 'WarlockVoidSupers'),
          (a[(a.WeaponTieringKillVfx = 0x8b716872)] = 'WeaponTieringKillVfx'),
          (a[(a.WeaponTieringPlugsModsEnhancers = 0xfece86a3)] = 'WeaponTieringPlugsModsEnhancers'),
          (a[(a.WeaponTieringTier5Skins = 0x411db5c3)] = 'WeaponTieringTier5Skins'),
          ((t = p || (p = {}))[(t.Accuracy = 0x5edb5727)] = 'Accuracy'),
          (t[(t.AimAssistance = 0x50345f6f)] = 'AimAssistance'),
          (t[(t.AirborneEffectiveness = 0xa1cb5450)] = 'AirborneEffectiveness'),
          (t[(t.AmmoCapacity = 0x372e157c)] = 'AmmoCapacity'),
          (t[(t.AmmoGeneration = 0x732305cc)] = 'AmmoGeneration'),
          (t[(t.AnyEnergyTypeCost = 0xd544e708)] = 'AnyEnergyTypeCost'),
          (t[(t.ArcCost = 0xe144fa36)] = 'ArcCost'),
          (t[(t.ArcDamageResistance = 0x5c2f5d6a)] = 'ArcDamageResistance'),
          (t[(t.ArmorEnergyCapacity_16120457 = 0xf5fa89)] = 'ArmorEnergyCapacity_16120457'),
          (t[(t.ArmorEnergyCapacity_2018193158 = 0x784b2f06)] = 'ArmorEnergyCapacity_2018193158'),
          (t[(t.ArmorEnergyCapacity_2441327376 = 0x9183b310)] = 'ArmorEnergyCapacity_2441327376'),
          (t[(t.ArmorEnergyCapacity_3625423501 = 0xd817928d)] = 'ArmorEnergyCapacity_3625423501'),
          (t[(t.ArmorEnergyCapacity_3950461274 = 0xeb77415a)] = 'ArmorEnergyCapacity_3950461274'),
          (t[(t.AspectEnergyCapacity = 0x848f74fd)] = 'AspectEnergyCapacity'),
          (t[(t.Attack = 0x583d2dbe)] = 'Attack'),
          (t[(t.BlastRadius = 0xd7738abf)] = 'BlastRadius'),
          (t[(t.Boost = 0xb3dd905f)] = 'Boost'),
          (t[(t.ChargeRate = 0xb424a9f3)] = 'ChargeRate'),
          (t[(t.ChargeTime = 0xb08353a0)] = 'ChargeTime'),
          (t[(t.Class = 0x73d4c363)] = 'Class'),
          (t[(t.ClassDupe = 0x7f4e98b5)] = 'ClassDupe'),
          (t[(t.CoolingEfficiency = 0xeeccbb65)] = 'CoolingEfficiency'),
          (t[(t.Defense = 0xe854fa8e)] = 'Defense'),
          (t[(t.DrawTime = 0x1aaedef2)] = 'DrawTime'),
          (t[(t.Durability = 0x157aa4e5)] = 'Durability'),
          (t[(t.FragmentCost = 0x71ae8ea)] = 'FragmentCost'),
          (t[(t.GhostEnergyCapacity = 0xe2bfccc)] = 'GhostEnergyCapacity'),
          (t[(t.Grenade = 0x6775dce1)] = 'Grenade'),
          (t[(t.GuardEfficiency = 0xa4a1dc9b)] = 'GuardEfficiency'),
          (t[(t.GuardEndurance = 0xdebbc6dc)] = 'GuardEndurance'),
          (t[(t.GuardResistance = 0xc7b98e4)] = 'GuardResistance'),
          (t[(t.Handicap = 0x8b94849a)] = 'Handicap'),
          (t[(t.Handling = 0x383d6dbc)] = 'Handling'),
          (t[(t.Health = 0x1769266f)] = 'Health'),
          (t[(t.HeatGenerated = 0xcf8057aa)] = 'HeatGenerated'),
          (t[(t.HeroicResistance = 0x5c2f5d69)] = 'HeroicResistance'),
          (t[(t.Impact = 0xf10346eb)] = 'Impact'),
          (t[(t.Magazine = 0xe6be4c5a)] = 'Magazine'),
          (t[(t.Melee = 0xfcfef4b2)] = 'Melee'),
          (t[(t.MeleeDupe = 0xd0403702)] = 'MeleeDupe'),
          (t[(t.ModCost = 0x1ea41d4f)] = 'ModCost'),
          (t[(t.MoveSpeed = 0xe8e882df)] = 'MoveSpeed'),
          (t[(t.Persistence = 0xb7e76585)] = 'Persistence'),
          (t[(t.Power = 0x735cf023)] = 'Power'),
          (t[(t.PowerBonus = 0xc40b3932)] = 'PowerBonus'),
          (t[(t.PrecisionDamage = 0xd672c034)] = 'PrecisionDamage'),
          (t[(t.Range = 0x49f1f137)] = 'Range'),
          (t[(t.RecoilDirection = 0xa1e06b6c)] = 'RecoilDirection'),
          (t[(t.ReloadSpeed = 0xf9a04987)] = 'ReloadSpeed'),
          (t[(t.RoundsPerMinute = 0xff664809)] = 'RoundsPerMinute'),
          (t[(t.ScoreMultiplier = 0xa2ea4fd8)] = 'ScoreMultiplier'),
          (t[(t.ShieldDuration = 0x6dcef0ba)] = 'ShieldDuration'),
          (t[(t.SolarCost = 0xc75cc36d)] = 'SolarCost'),
          (t[(t.SolarDamageResistance = 0x5c2f5d6b)] = 'SolarDamageResistance'),
          (t[(t.Speed = 0x5979cecb)] = 'Speed'),
          (t[(t.Stability = 0x946a299)] = 'Stability'),
          (t[(t.StasisCost = 0x3b887613)] = 'StasisCost'),
          (t[(t.Super = 0x89e7467)] = 'Super'),
          (t[(t.SwingSpeed = 0xa91c5ac2)] = 'SwingSpeed'),
          (t[(t.TimeToAimDownSights = 0xedba7186)] = 'TimeToAimDownSights'),
          (t[(t.Velocity = 0x96690871)] = 'Velocity'),
          (t[(t.VentSpeed = 0x23ea7dc9)] = 'VentSpeed'),
          (t[(t.VoidCost = 0x8f0ce088)] = 'VoidCost'),
          (t[(t.VoidDamageResistance = 0x5c2f5d6c)] = 'VoidDamageResistance'),
          (t[(t.Weapons = 0xb295931f)] = 'Weapons'),
          (t[(t.Zoom = 0xd3e91ada)] = 'Zoom'),
          ((o = m || (m = {}))[(o.AdventureTokens = 0xbad4feba)] = 'AdventureTokens'),
          (o[(o.Armor = 20)] = 'Armor'),
          (o[(o.ArmorMods = 0xf4a5e6cb)] = 'ArmorMods'),
          (o[(o.ArmorModsChest = 0xddf2cc11)] = 'ArmorModsChest'),
          (o[(o.ArmorModsClass = 0xbe80b5c8)] = 'ArmorModsClass'),
          (o[(o.ArmorModsClassHunter = 0x3dd73d61)] = 'ArmorModsClassHunter'),
          (o[(o.ArmorModsClassTitan = 0x625dc1c3)] = 'ArmorModsClassTitan'),
          (o[(o.ArmorModsClassWarlock = 0xb0277796)] = 'ArmorModsClassWarlock'),
          (o[(o.ArmorModsGameplay = 0xf22bf02e)] = 'ArmorModsGameplay'),
          (o[(o.ArmorModsGauntlets = 0xe6d4aa80)] = 'ArmorModsGauntlets'),
          (o[(o.ArmorModsGlowEffects = 0x6fcb66bd)] = 'ArmorModsGlowEffects'),
          (o[(o.ArmorModsHelmet = 0x5132854d)] = 'ArmorModsHelmet'),
          (o[(o.ArmorModsLegs = 0xd70420d2)] = 'ArmorModsLegs'),
          (o[(o.ArmorModsOrnaments = 0x67de3c1a)] = 'ArmorModsOrnaments'),
          (o[(o.ArmorModsOrnamentsHunter = 0xdb89f0bb)] = 'ArmorModsOrnamentsHunter'),
          (o[(o.ArmorModsOrnamentsTitan = 0xc07ededd)] = 'ArmorModsOrnamentsTitan'),
          (o[(o.ArmorModsOrnamentsWarlock = 0xdb9824b8)] = 'ArmorModsOrnamentsWarlock'),
          (o[(o.Arms = 46)] = 'Arms'),
          (o[(o.Aura = 57)] = 'Aura'),
          (o[(o.AutoRifle = 5)] = 'AutoRifle'),
          (o[(o.Blueprint = 51)] = 'Blueprint'),
          (o[(o.BonusMods = 0x12173bf3)] = 'BonusMods'),
          (o[(o.Bounties = 0x6a5945cd)] = 'Bounties'),
          (o[(o.Bows = 0xc5bd9f10)] = 'Bows'),
          (o[(o.BreakerDisruption = 0x3978f74e)] = 'BreakerDisruption'),
          (o[(o.BreakerPiercing = 0x6aea1f34)] = 'BreakerPiercing'),
          (o[(o.BreakerStagger = 0xad3fe822)] = 'BreakerStagger'),
          (o[(o.ChallengeCards = 0xb54dbbf0)] = 'ChallengeCards'),
          (o[(o.Chest = 47)] = 'Chest'),
          (o[(o.ClanBanner = 58)] = 'ClanBanner'),
          (o[(o.ClanBanners = 0x3422076f)] = 'ClanBanners'),
          (o[(o.ClanBannersPerks = 0x5dfb1269)] = 'ClanBannersPerks'),
          (o[(o.ClanBannersStaff = 0x6fb234f4)] = 'ClanBannersStaff'),
          (o[(o.ClassItems = 49)] = 'ClassItems'),
          (o[(o.Consumables = 35)] = 'Consumables'),
          (o[(o.Currencies = 18)] = 'Currencies'),
          (o[(o.Dummies = 0xb95a1168)] = 'Dummies'),
          (o[(o.Emblems = 19)] = 'Emblems'),
          (o[(o.Emotes = 44)] = 'Emotes'),
          (o[(o.EnergyWeapon = 3)] = 'EnergyWeapon'),
          (o[(o.Engrams = 34)] = 'Engrams'),
          (o[(o.Finishers = 0x424f3b10)] = 'Finishers'),
          (o[(o.FusionRifle = 9)] = 'FusionRifle'),
          (o[(o.GagPrizes = 0x802c88ca)] = 'GagPrizes'),
          (o[(o.Ghost = 39)] = 'Ghost'),
          (o[(o.GhostMods = 0x56672f2b)] = 'GhostMods'),
          (o[(o.GhostModsPerks = 0xf8f562b2)] = 'GhostModsPerks'),
          (o[(o.GhostModsProjections = 0x53bb6b7a)] = 'GhostModsProjections'),
          (o[(o.GhostModsTrackers = 0x6cd724a6)] = 'GhostModsTrackers'),
          (o[(o.Glaives = 0xe6c61898)] = 'Glaives'),
          (o[(o.GrenadeLaunchers = 0x92d1a25)] = 'GrenadeLaunchers'),
          (o[(o.HandCannon = 6)] = 'HandCannon'),
          (o[(o.Helmets = 45)] = 'Helmets'),
          (o[(o.Hunter = 23)] = 'Hunter'),
          (o[(o.InfusionMaterials = 0x87196f7b)] = 'InfusionMaterials'),
          (o[(o.Inventory = 52)] = 'Inventory'),
          (o[(o.ItemSets = 0x906f1bdf)] = 'ItemSets'),
          (o[(o.KineticWeapon = 2)] = 'KineticWeapon'),
          (o[(o.Legs = 48)] = 'Legs'),
          (o[(o.LinearFusionRifles = 0x59b3a580)] = 'LinearFusionRifles'),
          (o[(o.MachineGun = 12)] = 'MachineGun'),
          (o[(o.Mask = 55)] = 'Mask'),
          (o[(o.MasterworksMods = 0x86a56f4)] = 'MasterworksMods'),
          (o[(o.Materials = 40)] = 'Materials'),
          (o[(o.Mods_Mod = 59)] = 'Mods_Mod'),
          (o[(o.Mods_Ornament = 56)] = 'Mods_Ornament'),
          (o[(o.Packages = 0x10027d54)] = 'Packages'),
          (o[(o.Patterns = 0xde171592)] = 'Patterns'),
          (o[(o.PowerWeapon = 4)] = 'PowerWeapon'),
          (o[(o.ProphecyOfferings = 0x778b05eb)] = 'ProphecyOfferings'),
          (o[(o.ProphecyTablets = 0x861cfc21)] = 'ProphecyTablets'),
          (o[(o.PulseRifle = 7)] = 'PulseRifle'),
          (o[(o.Quest = 53)] = 'Quest'),
          (o[(o.QuestStep = 16)] = 'QuestStep'),
          (o[(o.RepeatableBounties = 0x2a81f4d0)] = 'RepeatableBounties'),
          (o[(o.ReputationTokens = 0x7c7e0ffb)] = 'ReputationTokens'),
          (o[(o.RocketLauncher = 13)] = 'RocketLauncher'),
          (o[(o.ScoutRifle = 8)] = 'ScoutRifle'),
          (o[(o.SeasonalArtifacts = 0x5225fff5)] = 'SeasonalArtifacts'),
          (o[(o.Shaders = 41)] = 'Shaders'),
          (o[(o.ShipMods = 0xa90c632)] = 'ShipMods'),
          (o[(o.ShipModsTransmatEffects = 0xc74ce80)] = 'ShipModsTransmatEffects'),
          (o[(o.Ships = 42)] = 'Ships'),
          (o[(o.Shotgun = 11)] = 'Shotgun'),
          (o[(o.Sidearm = 14)] = 'Sidearm'),
          (o[(o.SniperRifle = 10)] = 'SniperRifle'),
          (o[(o.SparrowMods = 0x9189d14)] = 'SparrowMods'),
          (o[(o.SparrowModsPerks = 0x1307d158)] = 'SparrowModsPerks'),
          (o[(o.SparrowModsSpeed = 0x88c889ec)] = 'SparrowModsSpeed'),
          (o[(o.Sparrows = 43)] = 'Sparrows'),
          (o[(o.StoryPrizes = 0xdf5ab466)] = 'StoryPrizes'),
          (o[(o.SubclassMods = 0x3e3025ba)] = 'SubclassMods'),
          (o[(o.Subclasses = 50)] = 'Subclasses'),
          (o[(o.SubmachineGuns = 0xebb7b65e)] = 'SubmachineGuns'),
          (o[(o.Sword = 54)] = 'Sword'),
          (o[(o.TicketMods = 0xcd855c48)] = 'TicketMods'),
          (o[(o.Titan = 22)] = 'Titan'),
          (o[(o.TraceRifles = 0x94654278)] = 'TraceRifles'),
          (o[(o.TreasureMaps = 0x8654449c)] = 'TreasureMaps'),
          (o[(o.VendorWrappedItems = 0xc4c478de)] = 'VendorWrappedItems'),
          (o[(o.Warlock = 21)] = 'Warlock'),
          (o[(o.Weapon = 1)] = 'Weapon'),
          (o[(o.WeaponMods = 0x24617020)] = 'WeaponMods'),
          (o[(o.WeaponModsArrows = 0xc852365a)] = 'WeaponModsArrows'),
          (o[(o.WeaponModsBarrels = 0xb7e42413)] = 'WeaponModsBarrels'),
          (o[(o.WeaponModsBatteries = 0x4f840db2)] = 'WeaponModsBatteries'),
          (o[(o.WeaponModsBowstring = 0x1a827052)] = 'WeaponModsBowstring'),
          (o[(o.WeaponModsDamage = 0x3eb72b08)] = 'WeaponModsDamage'),
          (o[(o.WeaponModsFrame = 0xdd0dd45a)] = 'WeaponModsFrame'),
          (o[(o.WeaponModsGameplay = 0x3858977f)] = 'WeaponModsGameplay'),
          (o[(o.WeaponModsGrips = 0xe4aa5387)] = 'WeaponModsGrips'),
          (o[(o.WeaponModsHafts = 0xa953b280)] = 'WeaponModsHafts'),
          (o[(o.WeaponModsIntrinsic = 0x85567ef8)] = 'WeaponModsIntrinsic'),
          (o[(o.WeaponModsLaunchTubes = 0x7bcb4153)] = 'WeaponModsLaunchTubes'),
          (o[(o.WeaponModsMagazines = 0xf968fd89)] = 'WeaponModsMagazines'),
          (o[(o.WeaponModsOriginTraits = 0xa5a6bc44)] = 'WeaponModsOriginTraits'),
          (o[(o.WeaponModsOrnaments = 0xba3ff0ef)] = 'WeaponModsOrnaments'),
          (o[(o.WeaponModsScopes = 0x8fc0ac01)] = 'WeaponModsScopes'),
          (o[(o.WeaponModsSights = 0xe6764252)] = 'WeaponModsSights'),
          (o[(o.WeaponModsStocks = 0xb619ff1f)] = 'WeaponModsStocks'),
          (o[(o.WeaponModsSwordBlades = 0x65ea7115)] = 'WeaponModsSwordBlades'),
          (o[(o.WeaponModsSwordGuards = 0xb724f320)] = 'WeaponModsSwordGuards'),
          ((r = x || (x = {}))[(r.Abilities_Abilities = 0x1275ff61)] = 'Abilities_Abilities'),
          (r[(r.Abilities_Abilities_Ikora = 0xbfdb1bfd)] = 'Abilities_Abilities_Ikora'),
          (r[(r.ArmorCosmetics = 0x72cec245)] = 'ArmorCosmetics'),
          (r[(r.ArmorMods = 0x232c3572)] = 'ArmorMods'),
          (r[(r.ArmorPerks_LargePerk = 0xbc098343)] = 'ArmorPerks_LargePerk'),
          (r[(r.ArmorPerks_Reusable = 0x961b10e4)] = 'ArmorPerks_Reusable'),
          (r[(r.ArmorTier = 0x2d52680d)] = 'ArmorTier'),
          (r[(r.Aspects_Abilities = 0x7a0d2576)] = 'Aspects_Abilities'),
          (r[(r.Aspects_Abilities_Ikora = 0x7f9c0fb3)] = 'Aspects_Abilities_Ikora'),
          (r[(r.Aspects_Abilities_Neomuna = 0x2d9472b3)] = 'Aspects_Abilities_Neomuna'),
          (r[(r.Aspects_Abilities_Stranger = 0xcab5fb06)] = 'Aspects_Abilities_Stranger'),
          (r[(r.ClanPerks_Unlockable_ClanBanner = 0xe85927a0)] = 'ClanPerks_Unlockable_ClanBanner'),
          (r[(r.ClanPerks_Unlockable_UNUSED = 0x645960d2)] = 'ClanPerks_Unlockable_UNUSED'),
          (r[(r.ClanStaves = 0xebb6b1f9)] = 'ClanStaves'),
          (r[(r.DestinationMods = 0xa621a266)] = 'DestinationMods'),
          (r[(r.EmblemBonuses = 0x1e9c1cc5)] = 'EmblemBonuses'),
          (r[(r.EmblemCustomization = 0x10ac7788)] = 'EmblemCustomization'),
          (r[(r.Emotes = 0x41273b3c)] = 'Emotes'),
          (r[(r.ForgeMaterials = 0xeca4443a)] = 'ForgeMaterials'),
          (r[(r.Fragments_Abilities = 0x102e2c68)] = 'Fragments_Abilities'),
          (r[(r.Fragments_Abilities_Ikora = 0x4e4a4031)] = 'Fragments_Abilities_Ikora'),
          (r[(r.Fragments_Abilities_Neomuna = 0xb869cad)] = 'Fragments_Abilities_Neomuna'),
          (r[(r.Fragments_Abilities_Stranger = 0xa8154180)] = 'Fragments_Abilities_Stranger'),
          (r[(r.GambitPrimePerks = 0x881aa671)] = 'GambitPrimePerks'),
          (r[(r.GhostCosmetics = 0x97f118a3)] = 'GhostCosmetics'),
          (r[(r.GhostMods = 0xe7a704c4)] = 'GhostMods'),
          (r[(r.GhostShellMods = 0xc969f5e9)] = 'GhostShellMods'),
          (r[(r.GhostShellPerks = 0xc4c620dc)] = 'GhostShellPerks'),
          (r[(r.GhostTier = 0x1aa2dc73)] = 'GhostTier'),
          (r[(r.Information = 0x842bc95a)] = 'Information'),
          (r[(r.Ingredients = 0x470600a8)] = 'Ingredients'),
          (r[(r.IntrinsicTraits = 0xebcdb070)] = 'IntrinsicTraits'),
          (r[(r.NightfallModifiers = 0x9c4c43a0)] = 'NightfallModifiers'),
          (r[(r.PowerAndEfficiency = 0x96c9feb8)] = 'PowerAndEfficiency'),
          (r[(r.Recipes_Consumable_Container = 0x83da6166)] = 'Recipes_Consumable_Container'),
          (r[(r.Recipes_Consumable_UNUSED = 0x7ac3ccc8)] = 'Recipes_Consumable_UNUSED'),
          (r[(r.RuneBonus = 0x3465c16a)] = 'RuneBonus'),
          (r[(r.RuneCompatibility = 0x8a19040f)] = 'RuneCompatibility'),
          (r[(r.Super = 0x1b447e81)] = 'Super'),
          (r[(r.Transcendence = 0x71901d7a)] = 'Transcendence'),
          (r[(r.VehicleMods_Consumable_Ship = 0xfe37fe6b)] = 'VehicleMods_Consumable_Ship'),
          (r[(r.VehicleMods_Consumable_Vehicle = 0xfcee5f19)] = 'VehicleMods_Consumable_Vehicle'),
          (r[(r.VehiclePerks = 0x87c9358c)] = 'VehiclePerks'),
          (r[(r.WeaponCosmetics = 0x7a1f5bf0)] = 'WeaponCosmetics'),
          (r[(r.WeaponMods = 0xa0102655)] = 'WeaponMods'),
          (r[(r.WeaponPerks_Consumable = 0xcb486f6c)] = 'WeaponPerks_Consumable'),
          (r[(r.WeaponPerks_Reusable = 0xfcc9d285)] = 'WeaponPerks_Reusable'),
          ((c = A || (A = {}))[(c.Accessories = 0x28f7c1a0)] = 'Accessories'),
          (c[(c.Artifacts = 0x59ca1ea2)] = 'Artifacts'),
          (c[(c.BrightDust = 0xa05310a7)] = 'BrightDust'),
          (c[(c.ChestArmor = 0xd94704)] = 'ChestArmor'),
          (c[(c.Chronologs = 0xa05310a5)] = 'Chronologs'),
          (c[(c.ClanBanners = 0xffd9870a)] = 'ClanBanners'),
          (c[(c.ClassArmor = 0x5e8533db)] = 'ClassArmor'),
          (c[(c.Consumables = 0x579a0fd8)] = 'Consumables'),
          (c[(c.Emblems = 0xfec52e3b)] = 'Emblems'),
          (c[(c.Emotes = 0x42071abf)] = 'Emotes'),
          (c[(c.EnergyWeapons = 0x92f16ad9)] = 'EnergyWeapons'),
          (c[(c.Engrams = 0x166521a5)] = 'Engrams'),
          (c[(c.EventTickets = 0x5e58d073)] = 'EventTickets'),
          (c[(c.Finishers = 0xdb89ff35)] = 'Finishers'),
          (c[(c.Gauntlets = 0xd3b5f9fc)] = 'Gauntlets'),
          (c[(c.General = 0x83cbb2a)] = 'General'),
          (c[(c.Ghost = 0xefcd14be)] = 'Ghost'),
          (c[(c.Glimmer = 0xa05310a4)] = 'Glimmer'),
          (c[(c.Helmet = 0xcd887e07)] = 'Helmet'),
          (c[(c.KineticWeapons = 0x59570ada)] = 'KineticWeapons'),
          (c[(c.LegArmor = 0x13eb5aa)] = 'LegArmor'),
          (c[(c.LostItems = 0xcd9b0ac)] = 'LostItems'),
          (c[(c.Materials = 0xe6640542)] = 'Materials'),
          (c[(c.Messages = 0xbc76e6b8)] = 'Messages'),
          (c[(c.Modifications = 0xc57b725e)] = 'Modifications'),
          (c[(c.Orders = 0x25db7c8d)] = 'Orders'),
          (c[(c.PowerWeapons = 0x38dcdd35)] = 'PowerWeapons'),
          (c[(c.Quests = 0x50321584)] = 'Quests'),
          (c[(c.Ships = 0x10fc42e7)] = 'Ships'),
          (c[(c.Silver = 0xa05310a6)] = 'Silver'),
          (c[(c.SpecialOrders = 0x5184f089)] = 'SpecialOrders'),
          (c[(c.StrangeCoin = 0xa05310a1)] = 'StrangeCoin'),
          (c[(c.Subclass = 0xc3c96257)] = 'Subclass'),
          (c[(c.SynthweaveBolt = 0xf3f0cca4)] = 'SynthweaveBolt'),
          (c[(c.SynthweavePlate = 0xf3f0cca7)] = 'SynthweavePlate'),
          (c[(c.SynthweaveStrap = 0xf3f0cca6)] = 'SynthweaveStrap'),
          (c[(c.SynthweaveTemplate = 0xf3f0cca5)] = 'SynthweaveTemplate'),
          (c[(c.UpgradePoint = 0xa05310a0)] = 'UpgradePoint'),
          (c[(c.Vehicle = 0x78bddf27)] = 'Vehicle'),
          (c[(c.WrappedItems = 0xc7baf6a1)] = 'WrappedItems'),
          ((l = g || (g = {}))[(l.Disruption = 0x9ba1a0c2)] = 'Disruption'),
          (l[(l.ShieldPiercing = 0x1cf203f0)] = 'ShieldPiercing'),
          (l[(l.Stagger = 0xbd78b9c9)] = 'Stagger'),
          ((S = R || (R = {}))[(S.CompetitiveDivision = 0xdc559e88)] = 'CompetitiveDivision'),
          (S[(S.CrucibleRank = 0x7c337439)] = 'CrucibleRank'),
          (S[(S.GambitRank = 0xb34b7040)] = 'GambitRank'),
          (S[(S.StrangeFavor = 0x1f76a01f)] = 'StrangeFavor'),
          (S[(S.TrialsRank = 0xa4404522)] = 'TrialsRank'),
          (S[(S.VanguardRank = 0x1b469c12)] = 'VanguardRank'),
          ((k = h || (h = {}))[(k.ActivitiesBlackArmory = 0xaf7a9032)] = 'ActivitiesBlackArmory'),
          (k[(k.ActivitiesGambit = 0x32e3b6f2)] = 'ActivitiesGambit'),
          (k[(k.ActivitiesIronBanner = 0xa1eb7677)] = 'ActivitiesIronBanner'),
          (k[(k.ActivitiesMamba = 0x6a2c4d84)] = 'ActivitiesMamba'),
          (k[(k.ActivitiesTrials = 0xccfc8807)] = 'ActivitiesTrials'),
          (k[(k.All = 0x557c63b3)] = 'All'),
          (k[(k.Amplified = 0xc428e2cc)] = 'Amplified'),
          (k[(k.Blind = 0x1dd03113)] = 'Blind'),
          (k[(k.BoltCharge = 0xaef1bb30)] = 'BoltCharge'),
          (k[(k.Career = 0xfe253efe)] = 'Career'),
          (k[(k.Cure = 0xc288770d)] = 'Cure'),
          (k[(k.DarknessBuffs = 0x70b722e5)] = 'DarknessBuffs'),
          (k[(k.DarknessDebuffs = 0x5a4a881a)] = 'DarknessDebuffs'),
          (k[(k.Devour = 0xb778918e)] = 'Devour'),
          (k[(k.Exotics = 0x16197228)] = 'Exotics'),
          (k[(k.FactionCrucible = 0xaff0594c)] = 'FactionCrucible'),
          (k[(k.FactionDeadOrbit = 0xc68e7b10)] = 'FactionDeadOrbit'),
          (k[(k.FactionFutureWarCult = 0x5034b1c4)] = 'FactionFutureWarCult'),
          (k[(k.FactionNewMonarchy = 0x48c77071)] = 'FactionNewMonarchy'),
          (k[(k.FactionVanguard = 0xc843e6f9)] = 'FactionVanguard'),
          (k[(k.Firesprite = 0x237488e)] = 'Firesprite'),
          (k[(k.FoundryDaito = 0x6f3e818b)] = 'FoundryDaito'),
          (k[(k.FoundryFieldForged = 0xcf258c66)] = 'FoundryFieldForged'),
          (k[(k.FoundryFotc = 0x8429c0ac)] = 'FoundryFotc'),
          (k[(k.FoundryHakke = 0x83c14d46)] = 'FoundryHakke'),
          (k[(k.FoundryOmolon = 0xb7e5410)] = 'FoundryOmolon'),
          (k[(k.FoundrySuros = 0xdbfaa1a6)] = 'FoundrySuros'),
          (k[(k.FoundryTexMechanica = 0x6c8dc81b)] = 'FoundryTexMechanica'),
          (k[(k.FoundryVeist = 0x396c2d33)] = 'FoundryVeist'),
          (k[(k.Freeze = 0xb0f13a70)] = 'Freeze'),
          (k[(k.FrostArmor = 0x65fe554)] = 'FrostArmor'),
          (k[(k.Ignition = 0xc2d6e2fc)] = 'Ignition'),
          (k[(k.InventoryFilteringBounty = 0xc01a1ff)] = 'InventoryFilteringBounty'),
          (k[(k.InventoryFilteringQuest = 0x6eefd048)] = 'InventoryFilteringQuest'),
          (k[(k.InventoryFilteringQuestFeatured = 0xb4dae250)] = 'InventoryFilteringQuestFeatured'),
          (k[(k.Invisibility = 0x270f1b32)] = 'Invisibility'),
          (k[(k.IonicTrace = 0xe3f49cd1)] = 'IonicTrace'),
          (k[(k.ItemArmorArms = 0x6e59c786)] = 'ItemArmorArms'),
          (k[(k.ItemArmorChest = 0x164fa7d2)] = 'ItemArmorChest'),
          (k[(k.ItemArmorClass = 0xc8b75c25)] = 'ItemArmorClass'),
          (k[(k.ItemArmorExotic = 0xfd7b8ebd)] = 'ItemArmorExotic'),
          (k[(k.ItemArmorHead = 0x401821d1)] = 'ItemArmorHead'),
          (k[(k.ItemArmorLegs = 0x7553f604)] = 'ItemArmorLegs'),
          (k[(k.ItemAura = 0xd3d430a3)] = 'ItemAura'),
          (k[(k.ItemBoost = 0x3d70982b)] = 'ItemBoost'),
          (k[(k.ItemBounty = 0x919ec5db)] = 'ItemBounty'),
          (k[(k.ItemConsumable = 0x7aea799b)] = 'ItemConsumable'),
          (k[(k.ItemCurrency = 0xe8d8d8eb)] = 'ItemCurrency'),
          (k[(k.ItemEmblem = 0x925ef5f4)] = 'ItemEmblem'),
          (k[(k.ItemEmote = 0x34ef1216)] = 'ItemEmote'),
          (k[(k.ItemEngram = 0xac7e9c4e)] = 'ItemEngram'),
          (k[(k.ItemExoticCatalyst = 0xf09b8d1e)] = 'ItemExoticCatalyst'),
          (k[(k.ItemFinisher = 0x99e7754a)] = 'ItemFinisher'),
          (k[(k.ItemGhost = 0x993967d3)] = 'ItemGhost'),
          (k[(k.ItemGhostHologram = 0xf578558b)] = 'ItemGhostHologram'),
          (k[(k.ItemOrnamentArmor = 0xcf42bdf5)] = 'ItemOrnamentArmor'),
          (k[(k.ItemOrnamentWeapon = 0xe42ab544)] = 'ItemOrnamentWeapon'),
          (k[(k.ItemPackage = 0x9010efe)] = 'ItemPackage'),
          (k[(k.ItemPlugAspect = 0x2272774c)] = 'ItemPlugAspect'),
          (k[(k.ItemPlugFragment = 0xa8e5c3ac)] = 'ItemPlugFragment'),
          (k[(k.ItemQuestCampaign = 0xb14143e4)] = 'ItemQuestCampaign'),
          (k[(k.ItemQuestEvent = 0x3ef42146)] = 'ItemQuestEvent'),
          (k[(k.ItemQuestFrontierBehemoth = 0x35e8dee7)] = 'ItemQuestFrontierBehemoth'),
          (k[(k.ItemQuestOnramp = 0xa306d8d)] = 'ItemQuestOnramp'),
          (k[(k.ItemShader = 0x9e1adf49)] = 'ItemShader'),
          (k[(k.ItemShip = 0xd7075d98)] = 'ItemShip'),
          (k[(k.ItemSpawnfx = 0x33104865)] = 'ItemSpawnfx'),
          (k[(k.ItemSubclassDark = 0xc02ab94a)] = 'ItemSubclassDark'),
          (k[(k.ItemSubclassLight = 0x1cc51a62)] = 'ItemSubclassLight'),
          (k[(k.ItemSubclassPrism = 0xe3b388c9)] = 'ItemSubclassPrism'),
          (k[(k.ItemVehicle = 0xed0cf54a)] = 'ItemVehicle'),
          (k[(k.ItemVehicleHorn = 0x5da39e6)] = 'ItemVehicleHorn'),
          (k[(k.ItemWeapon = 0x21d4cd16)] = 'ItemWeapon'),
          (k[(k.ItemWeaponAutoRifle = 0xa2b5254e)] = 'ItemWeaponAutoRifle'),
          (k[(k.ItemWeaponBow = 0xba527d0)] = 'ItemWeaponBow'),
          (k[(k.ItemWeaponExotic = 0x2f2dcc7a)] = 'ItemWeaponExotic'),
          (k[(k.ItemWeaponFusionRifle = 0xac544483)] = 'ItemWeaponFusionRifle'),
          (k[(k.ItemWeaponGlaive = 0x34fc27b8)] = 'ItemWeaponGlaive'),
          (k[(k.ItemWeaponGrenadeLauncher = 0x7ccd125)] = 'ItemWeaponGrenadeLauncher'),
          (k[(k.ItemWeaponHandCannon = 0xd6c12bad)] = 'ItemWeaponHandCannon'),
          (k[(k.ItemWeaponLinearFusionRifle = 0x7d2da10d)] = 'ItemWeaponLinearFusionRifle'),
          (k[(k.ItemWeaponMachinegun = 0x4421dec3)] = 'ItemWeaponMachinegun'),
          (k[(k.ItemWeaponPulseRifle = 0x62433688)] = 'ItemWeaponPulseRifle'),
          (k[(k.ItemWeaponPulseRifleRocket = 0x7e01fbd6)] = 'ItemWeaponPulseRifleRocket'),
          (k[(k.ItemWeaponRocketLauncher = 0xe9f2fdf7)] = 'ItemWeaponRocketLauncher'),
          (k[(k.ItemWeaponScoutRifle = 0xb782f1)] = 'ItemWeaponScoutRifle'),
          (k[(k.ItemWeaponShotgun = 0x7e03d02a)] = 'ItemWeaponShotgun'),
          (k[(k.ItemWeaponSidearm = 0x794289c5)] = 'ItemWeaponSidearm'),
          (k[(k.ItemWeaponSidearmRocket = 0x3105d889)] = 'ItemWeaponSidearmRocket'),
          (k[(k.ItemWeaponSniperRifle = 0xc4b581f2)] = 'ItemWeaponSniperRifle'),
          (k[(k.ItemWeaponSubmachinegun = 0x9e858e09)] = 'ItemWeaponSubmachinegun'),
          (k[(k.ItemWeaponSword = 0x5b4b7cff)] = 'ItemWeaponSword'),
          (k[(k.ItemWeaponTraceRifle = 0x1a992858)] = 'ItemWeaponTraceRifle'),
          (k[(k.Jolted = 0xbffe5cdb)] = 'Jolted'),
          (k[(k.LightBuffs = 0xa1ba0fbd)] = 'LightBuffs'),
          (k[(k.LightDebuffs = 0xb4323b12)] = 'LightDebuffs'),
          (k[(k.MambaRoleCollector = 0xe202e5b5)] = 'MambaRoleCollector'),
          (k[(k.MambaRoleDefender = 0xa1b46791)] = 'MambaRoleDefender'),
          (k[(k.MambaRoleInvader = 0xb836c453)] = 'MambaRoleInvader'),
          (k[(k.MambaRoleKiller = 0xce49a87d)] = 'MambaRoleKiller'),
          (k[(k.NewLight = 0x1f0bce3d)] = 'NewLight'),
          (k[(k.Overshield = 0x94244c92)] = 'Overshield'),
          (k[(k.Playlists = 0x1dcf01d3)] = 'Playlists'),
          (k[(k.Radiant = 0x962cbe3)] = 'Radiant'),
          (k[(k.ReleasesV300Annual = 0x9f92d5d9)] = 'ReleasesV300Annual'),
          (k[(k.ReleasesV310Season = 0xdf9233ee)] = 'ReleasesV310Season'),
          (k[(k.ReleasesV320Season = 0xedd8c675)] = 'ReleasesV320Season'),
          (k[(k.ReleasesV350Season = 0x3a454d92)] = 'ReleasesV350Season'),
          (k[(k.ReleasesV400Annual = 0x529b0ef4)] = 'ReleasesV400Annual'),
          (k[(k.ReleasesV400Season = 0x5468134e)] = 'ReleasesV400Season'),
          (k[(k.ReleasesV410Season = 0xd7b72333)] = 'ReleasesV410Season'),
          (k[(k.ReleasesV420Season = 0x6f9c068)] = 'ReleasesV420Season'),
          (k[(k.ReleasesV450Season = 0x50e77bb7)] = 'ReleasesV450Season'),
          (k[(k.ReleasesV460Annual = 0x38f7581a)] = 'ReleasesV460Annual'),
          (k[(k.ReleasesV460Season = 0x4528369c)] = 'ReleasesV460Season'),
          (k[(k.ReleasesV470Season = 0x8ab31aa9)] = 'ReleasesV470Season'),
          (k[(k.ReleasesV480Season = 0x5dc22406)] = 'ReleasesV480Season'),
          (k[(k.ReleasesV490Season = 0x8f65a4cb)] = 'ReleasesV490Season'),
          (k[(k.ReleasesV500Annual = 0x82317a43)] = 'ReleasesV500Annual'),
          (k[(k.ReleasesV500Season = 0xa4137d05)] = 'ReleasesV500Season'),
          (k[(k.ReleasesV510Season = 0xc861b818)] = 'ReleasesV510Season'),
          (k[(k.ReleasesV520Season = 0xef9ee363)] = 'ReleasesV520Season'),
          (k[(k.ReleasesV530Season = 0xc7db117e)] = 'ReleasesV530Season'),
          (k[(k.ReleasesV540Season = 0x9e5bb199)] = 'ReleasesV540Season'),
          (k[(k.ReleasesV600Annual = 0x311985f6)] = 'ReleasesV600Annual'),
          (k[(k.ReleasesV600Season = 0xd659f8a0)] = 'ReleasesV600Season'),
          (k[(k.ReleasesV610Season = 0xaafe16ad)] = 'ReleasesV610Season'),
          (k[(k.ReleasesV620Season = 0x995c6ce6)] = 'ReleasesV620Season'),
          (k[(k.ReleasesV630Season = 0x83a9782b)] = 'ReleasesV630Season'),
          (k[(k.ReleasesV700Annual = 0x9b5e61c5)] = 'ReleasesV700Annual'),
          (k[(k.ReleasesV700Season = 0xe48514c7)] = 'ReleasesV700Season'),
          (k[(k.ReleasesV710Season = 0x2766b102)] = 'ReleasesV710Season'),
          (k[(k.ReleasesV720Season = 0x28fa7df9)] = 'ReleasesV720Season'),
          (k[(k.ReleasesV730Season = 0x33ac51ac)] = 'ReleasesV730Season'),
          (k[(k.ReleasesV800Annual = 0xad3aa910)] = 'ReleasesV800Annual'),
          (k[(k.ReleasesV800Season = 0x505bb892)] = 'ReleasesV800Season'),
          (k[(k.ReleasesV810Season = 0xf2280757)] = 'ReleasesV810Season'),
          (k[(k.ReleasesV820Season = 0xe6b7d43c)] = 'ReleasesV820Season'),
          (k[(k.ReleasesV900Core = 0x6ec0d72b)] = 'ReleasesV900Core'),
          (k[(k.ReleasesV900Dlc = 0xa2745a75)] = 'ReleasesV900Dlc'),
          (k[(k.ReleasesV910 = 0x2cea66ef)] = 'ReleasesV910'),
          (k[(k.ReleasesV910Core = 0x7a529206)] = 'ReleasesV910Core'),
          (k[(k.ReleasesV910Dlc = 0xb53bae62)] = 'ReleasesV910Dlc'),
          (k[(k.ReleasesV950 = 0x28ea60a3)] = 'ReleasesV950'),
          (k[(k.ReleasesV950Core = 0xb20ecb5a)] = 'ReleasesV950Core'),
          (k[(k.ReleasesV950Dlc = 0xa549047e)] = 'ReleasesV950Dlc'),
          (k[(k.ReleasesV960 = 0x29ea6216)] = 'ReleasesV960'),
          (k[(k.ReleasesV960Core = 0xfe743fa1)] = 'ReleasesV960Core'),
          (k[(k.ReleasesV970 = 0x2aea6389)] = 'ReleasesV970'),
          (k[(k.ReleasesV970Core = 0xd18c15ec)] = 'ReleasesV970Core'),
          (k[(k.Restoration = 0xcfee059a)] = 'Restoration'),
          (k[(k.Scorch = 0x4159140f)] = 'Scorch'),
          (k[(k.Seasonal_Metric = 0x84ece10b)] = 'Seasonal_Metric'),
          (k[(k.Seasonal_Quests = 0xdacf167a)] = 'Seasonal_Quests'),
          (k[(k.Seasonal_Quests_UNUSED = 0xf4b56287)] = 'Seasonal_Quests_UNUSED'),
          (k[(k.Sever = 0x962673e5)] = 'Sever'),
          (k[(k.Shatter = 0x242e40c)] = 'Shatter'),
          (k[(k.Slow = 0xfcb079d2)] = 'Slow'),
          (k[(k.StasisCrystal = 0xc9c830b4)] = 'StasisCrystal'),
          (k[(k.StasisShard = 0xf0fdbe92)] = 'StasisShard'),
          (k[(k.Suppression = 0x99b2f78d)] = 'Suppression'),
          (k[(k.Suspend = 0x9fb951ae)] = 'Suspend'),
          (k[(k.Tangle = 0x5e052298)] = 'Tangle'),
          (k[(k.TheFinalShape = 0xab8f7a4f)] = 'TheFinalShape'),
          (k[(k.ThePast = 0x8e537dca)] = 'ThePast'),
          (k[(k.Threadling = 0xa2685ad9)] = 'Threadling'),
          (k[(k.Transcendence = 0x149f0b8b)] = 'Transcendence'),
          (k[(k.Unravel = 0x385cea25)] = 'Unravel'),
          (k[(k.VoidBreach = 0xc662a168)] = 'VoidBreach'),
          (k[(k.Volatile = 0xf4b38c4c)] = 'Volatile'),
          (k[(k.Weaken = 0xc6e111b9)] = 'Weaken'),
          (k[(k.Weekly = 0x8c79925e)] = 'Weekly'),
          (k[(k.WovenMail = 0xbd28e379)] = 'WovenMail'));
        let v = {
            helmet: f.EnhancementsV2Head,
            gauntlets: f.EnhancementsV2Arms,
            chest: f.EnhancementsV2Chest,
            leg: f.EnhancementsV2Legs,
            classitem: f.EnhancementsV2ClassItem,
            general: f.EnhancementsV2General,
          },
          C = Object.values(v);
        (((u = b || (b = {}))[(u.Locked = 0x1b39a989)] = 'Locked'),
          (u[(u.Unlocked = 0xacd5107b)] = 'Unlocked'),
          p.Attack,
          p.Defense,
          p.Power);
        let P = {
          weapons: p.Weapons,
          health: p.Health,
          class: p.Class,
          grenade: p.Grenade,
          super: p.Super,
          melee: p.Melee,
        };
        Object.entries(P).reduce(
          (e, [n, s]) => (void 0 !== s && void 0 !== n && (e[s] = n), e),
          {},
        );
        (p.Weapons, p.Health, p.Class, p.Grenade, p.Super, p.Melee);
        (p.Health,
          p.Melee,
          p.Grenade,
          p.Super,
          p.Class,
          p.Weapons,
          p.RoundsPerMinute,
          p.RoundsPerMinute,
          p.ChargeTime,
          p.Impact,
          p.Handling,
          p.VentSpeed,
          p.HeatGenerated,
          p.CoolingEfficiency,
          p.Range,
          p.Stability,
          p.ReloadSpeed,
          p.Magazine,
          p.AimAssistance,
          p.Handling,
          p.ShieldDuration,
          p.Velocity,
          p.BlastRadius,
          p.RecoilDirection,
          p.DrawTime,
          p.Zoom,
          p.AirborneEffectiveness,
          p.Accuracy,
          p.AmmoGeneration,
          p.Persistence,
          p.SwingSpeed,
          p.GuardEfficiency,
          p.GuardResistance,
          p.ChargeRate,
          p.GuardEndurance,
          p.AmmoCapacity,
          p.Accuracy,
          f.V400PlugsWeaponsMasterworksStatAccuracy,
          p.BlastRadius,
          f.V400PlugsWeaponsMasterworksStatBlastRadius,
          p.ChargeTime,
          f.V400PlugsWeaponsMasterworksStatChargeTime,
          p.Impact,
          f.V400PlugsWeaponsMasterworksStatDamage,
          p.DrawTime,
          f.V400PlugsWeaponsMasterworksStatDrawTime,
          p.Handling,
          f.V400PlugsWeaponsMasterworksStatHandling,
          p.CoolingEfficiency,
          f.V400PlugsWeaponsMasterworksStatHeatEfficiency,
          p.Persistence,
          f.V400PlugsWeaponsMasterworksStatPersistence,
          p.Range,
          f.V400PlugsWeaponsMasterworksStatRange,
          p.ReloadSpeed,
          f.V400PlugsWeaponsMasterworksStatReload,
          p.Stability,
          f.V400PlugsWeaponsMasterworksStatStability,
          p.Velocity,
          f.V400PlugsWeaponsMasterworksStatProjectileSpeed,
          p.VentSpeed,
          f.V400PlugsWeaponsMasterworksStatVentSpeed,
          p.ShieldDuration,
          f.V600PlugsWeaponsMasterworksStatShieldDuration,
          m.GrenadeLaunchers,
          m.GrenadeLaunchers,
          m.TraceRifles,
          m.LinearFusionRifles,
          m.SubmachineGuns,
          m.Bows,
          m.Glaives,
          m.ShipModsTransmatEffects,
          m.WeaponMods,
          m.ArmorMods,
          m.ReputationTokens,
          f.Bowstrings,
          f.Batteries,
          f.Blades,
          f.Tubes,
          f.Scopes,
          f.Hafts,
          f.Stocks,
          f.Guards,
          f.Barrels,
          f.Arrows,
          f.Grips,
          f.Scopes,
          f.Magazines,
          f.MagazinesGl,
          f.Rails,
          f.Bolts,
          A.Emotes,
          A.Finishers,
          ((d = W || (W = {}))[(d.Eververse = 0xc85bba81)] = 'Eververse'),
          (d[(d.Benedict = 0x4b757319)] = 'Benedict'),
          (d[(d.Banshee = 0x280fb4fd)] = 'Banshee'),
          (d[(d.Drifter = 0xed2cb2f)] = 'Drifter'),
          (d[(d.AdaForge = 0xade600f9)] = 'AdaForge'),
          (d[(d.AdaTransmog = 0x14dd8452)] = 'AdaTransmog'),
          (d[(d.Rahool = 0x86748412)] = 'Rahool'),
          (d[(d.Vault = 0x3ddc3bd3)] = 'Vault'),
          (d[(d.Xur = 0x8295d892)] = 'Xur'),
          (d[(d.DevrimKay = 0x17a817de)] = 'DevrimKay'),
          (d[(d.Failsafe = 0x5df413a9)] = 'Failsafe'),
          (d[(d.RivensWishesExotics = 0x8e5df269)] = 'RivensWishesExotics'),
          (d[(d.XurLegendaryItems = 0xdf9b9013)] = 'XurLegendaryItems'),
          (d[(d.VanguardArms = 0x92bae58)] = 'VanguardArms'),
          M.Z4.Unknown,
          M.Z4.Unknown,
          M.Z4.Currency,
          M.Z4.Currency,
          M.Z4.Basic,
          M.Z4.Basic,
          M.Z4.Common,
          M.Z4.Common,
          M.Z4.Rare,
          M.Z4.Rare,
          M.Z4.Superior,
          M.Z4.Superior,
          M.Z4.Exotic,
          M.Z4.Exotic);
        let T = {
          any: [g.Stagger, g.Disruption, g.ShieldPiercing],
          antibarrier: [g.ShieldPiercing],
          shieldpiercing: [g.ShieldPiercing],
          barrier: [g.ShieldPiercing],
          disruption: [g.Disruption],
          overload: [g.Disruption],
          stagger: [g.Stagger],
          unstoppable: [g.Stagger],
        };
        (g.Stagger,
          g.ShieldPiercing,
          g.Disruption,
          Object.entries(T)
            .filter(([, e]) => 1 === e.length)
            .reduce((e, [n, [s]]) => ((e[s] = n), e), {}),
          ((V = w || (w = {}))[(V.ElementalCapacitor = 0xd1470356)] = 'ElementalCapacitor'),
          (V[(V.EnhancedElementalCapacitor = 0x2a64930a)] = 'EnhancedElementalCapacitor'),
          (V[(V.EchoOfPersistence = 0x877afe5f)] = 'EchoOfPersistence'),
          (V[(V.SparkOfFocus = 0x66f0fcb0)] = 'SparkOfFocus'),
          (V[(V.BalancedTuning = 0xba18f2e0)] = 'BalancedTuning'),
          p.Grenade,
          p.Melee,
          p.Class,
          p.Health,
          p.Grenade,
          p.Melee,
          p.Super,
          p.Weapons,
          p.Weapons,
          p.Class,
          p.Class,
          p.Grenade,
          p.Class,
          p.Weapons,
          p.Grenade,
          p.Health,
          p.Super,
          p.Weapons,
          p.Weapons,
          p.Health,
          p.Super,
          p.Health,
          p.Super,
          p.Melee,
          p.Super,
          p.Class,
          p.Health,
          p.Grenade,
          p.Melee,
          p.Melee,
          M.rk.Hunter,
          M.rk.Titan,
          M.rk.Warlock,
          M.rk.Hunter,
          M.rk.Titan,
          M.rk.Warlock,
          M.rk.Unknown,
          s(6201),
          JSON.parse(
            '{"1":{"DLCName":"Red War","seasonName":"Red War","seasonTag":"redwar","season":1,"maxLevel":20,"powerFloor":0,"softCap":285,"powerfulCap":300,"pinnacleCap":300,"releaseDate":"2017-09-06","resetTime":"09:00:00Z","numWeeks":13},"2":{"DLCName":"Curse of Osiris","seasonName":"Curse of Osiris","seasonTag":"osiris","season":2,"maxLevel":25,"powerFloor":0,"softCap":320,"powerfulCap":330,"pinnacleCap":330,"releaseDate":"2017-12-05","resetTime":"17:00:00Z","numWeeks":22},"3":{"DLCName":"Warmind","seasonName":"Resurgence","seasonTag":"warmind","season":3,"maxLevel":30,"powerFloor":0,"softCap":340,"powerfulCap":380,"pinnacleCap":380,"releaseDate":"2018-05-08","resetTime":"18:00:00Z","numWeeks":17},"4":{"DLCName":"Forsaken","seasonName":"Season of the Outlaw","seasonTag":"outlaw","season":4,"maxLevel":50,"powerFloor":0,"softCap":500,"powerfulCap":600,"pinnacleCap":600,"releaseDate":"2018-09-04","resetTime":"17:00:00Z","numWeeks":12},"5":{"DLCName":"Black Armory","seasonName":"Season of the Forge","seasonTag":"forge","season":5,"maxLevel":50,"powerFloor":0,"softCap":500,"powerfulCap":650,"pinnacleCap":650,"releaseDate":"2018-11-27","resetTime":"17:00:00Z","numWeeks":14},"6":{"DLCName":"Joker\'s Wild","seasonName":"Season of the Drifter","seasonTag":"drifter","season":6,"maxLevel":50,"powerFloor":0,"softCap":500,"powerfulCap":700,"pinnacleCap":700,"releaseDate":"2019-03-05","resetTime":"17:00:00Z","numWeeks":13},"7":{"DLCName":"Penumbra","seasonName":"Season of Opulence","seasonTag":"opulence","season":7,"maxLevel":50,"powerFloor":0,"softCap":500,"powerfulCap":750,"pinnacleCap":750,"releaseDate":"2019-06-04","resetTime":"17:00:00Z","numWeeks":17},"8":{"DLCName":"Shadowkeep","seasonName":"Season of the Undying","seasonTag":"undying","season":8,"maxLevel":50,"powerFloor":750,"softCap":900,"powerfulCap":950,"pinnacleCap":960,"releaseDate":"2019-10-01","resetTime":"17:00:00Z","numWeeks":10},"9":{"DLCName":"","seasonName":"Season of Dawn","seasonTag":"dawn","season":9,"maxLevel":50,"powerFloor":750,"softCap":900,"powerfulCap":960,"pinnacleCap":970,"releaseDate":"2019-12-10","resetTime":"17:00:00Z","numWeeks":13},"10":{"DLCName":"","seasonName":"Season of the Worthy","seasonTag":"worthy","season":10,"maxLevel":50,"powerFloor":750,"softCap":950,"powerfulCap":1000,"pinnacleCap":1010,"releaseDate":"2020-03-10","resetTime":"17:00:00Z","numWeeks":13},"11":{"DLCName":"","seasonName":"Season of Arrivals","seasonTag":"arrivals","season":11,"maxLevel":50,"powerFloor":750,"softCap":1000,"powerfulCap":1050,"pinnacleCap":1060,"releaseDate":"2020-06-09","resetTime":"17:00:00Z","numWeeks":22},"12":{"DLCName":"Beyond Light","seasonName":"Season of the Hunt","seasonTag":"hunt","season":12,"maxLevel":50,"powerFloor":1050,"softCap":1200,"powerfulCap":1250,"pinnacleCap":1260,"releaseDate":"2020-11-10","resetTime":"17:00:00Z","numWeeks":13},"13":{"DLCName":"","seasonName":"Season of the Chosen","seasonTag":"chosen","season":13,"maxLevel":50,"powerFloor":1100,"softCap":1250,"powerfulCap":1300,"pinnacleCap":1310,"releaseDate":"2021-02-09","resetTime":"17:00:00Z","numWeeks":13},"14":{"DLCName":"","seasonName":"Season of the Splicer","seasonTag":"splicer","season":14,"maxLevel":50,"powerFloor":1100,"softCap":1250,"powerfulCap":1310,"pinnacleCap":1320,"releaseDate":"2021-05-11","resetTime":"17:00:00Z","numWeeks":15},"15":{"DLCName":"","seasonName":"Season of the Lost","seasonTag":"lost","season":15,"maxLevel":50,"powerFloor":1100,"softCap":1250,"powerfulCap":1320,"pinnacleCap":1330,"releaseDate":"2021-08-24","resetTime":"17:00:00Z","numWeeks":26},"16":{"DLCName":"Witch Queen","seasonName":"Season of the Risen","seasonTag":"risen","season":16,"maxLevel":50,"powerFloor":1350,"softCap":1500,"powerfulCap":1550,"pinnacleCap":1560,"releaseDate":"2022-02-22","resetTime":"17:00:00Z","numWeeks":13},"17":{"DLCName":"","seasonName":"Season of the Haunted","seasonTag":"haunted","season":17,"maxLevel":50,"powerFloor":1350,"softCap":1510,"powerfulCap":1560,"pinnacleCap":1570,"releaseDate":"2022-05-24","resetTime":"17:00:00Z","numWeeks":13},"18":{"DLCName":"","seasonName":"Season of Plunder","seasonTag":"plunder","season":18,"maxLevel":50,"powerFloor":1350,"softCap":1520,"powerfulCap":1570,"pinnacleCap":1580,"releaseDate":"2022-08-23","resetTime":"17:00:00Z","numWeeks":15},"19":{"DLCName":"","seasonName":"Season of the Seraph","seasonTag":"seraph","season":19,"maxLevel":50,"powerFloor":1350,"softCap":1530,"powerfulCap":1580,"pinnacleCap":1590,"releaseDate":"2022-12-06","resetTime":"17:00:00Z","numWeeks":12},"20":{"DLCName":"Lightfall","seasonName":"Season of Defiance","seasonTag":"defiance","season":20,"maxLevel":50,"powerFloor":1600,"softCap":1750,"powerfulCap":1800,"pinnacleCap":1810,"releaseDate":"2023-02-28","resetTime":"17:00:00Z","numWeeks":12},"21":{"DLCName":"","seasonName":"Season of the Deep","seasonTag":"deep","season":21,"maxLevel":50,"powerFloor":1600,"softCap":1750,"powerfulCap":1800,"pinnacleCap":1810,"releaseDate":"2023-05-23","resetTime":"17:00:00Z","numWeeks":13},"22":{"DLCName":"","seasonName":"Season of the Witch","seasonTag":"witch","season":22,"maxLevel":50,"powerFloor":1600,"softCap":1750,"powerfulCap":1800,"pinnacleCap":1810,"releaseDate":"2023-08-22","resetTime":"17:00:00Z","numWeeks":14},"23":{"DLCName":"","seasonName":"Season of the Wish","seasonTag":"wish","season":23,"maxLevel":50,"powerFloor":1600,"softCap":1750,"powerfulCap":1800,"pinnacleCap":1810,"releaseDate":"2023-11-28","resetTime":"17:00:00Z","numWeeks":27},"24":{"DLCName":"The Final Shape","seasonName":"Episode: Echoes","seasonTag":"echoes","season":24,"maxLevel":50,"powerFloor":1900,"softCap":1940,"powerfulCap":1990,"pinnacleCap":2000,"releaseDate":"2024-06-04","resetTime":"17:00:00Z","numWeeks":18,"episode":1},"25":{"DLCName":"Revenant","seasonName":"Episode: Revenant","seasonTag":"revenant","season":25,"maxLevel":50,"powerFloor":1900,"softCap":1950,"powerfulCap":2000,"pinnacleCap":2010,"releaseDate":"2024-10-08","resetTime":"17:00:00Z","numWeeks":17,"episode":2},"26":{"DLCName":"Heresy","seasonName":"Episode: Heresy","seasonTag":"heresy","season":26,"maxLevel":50,"powerFloor":1900,"softCap":1960,"powerfulCap":2010,"pinnacleCap":2020,"releaseDate":"2025-02-04","resetTime":"17:00:00Z","numWeeks":23,"episode":3},"27":{"DLCName":"Edge of Fate","seasonName":"Reclamation","seasonTag":"reclamation","season":27,"maxLevel":50,"powerFloor":10,"softCap":200,"powerfulCap":500,"pinnacleCap":550,"releaseDate":"2025-07-15","resetTime":"17:00:00Z","numWeeks":20},"28":{"DLCName":"Renegades","seasonName":"Lawless","seasonTag":"lawless","season":28,"maxLevel":50,"powerFloor":10,"softCap":200,"powerfulCap":500,"pinnacleCap":550,"releaseDate":"2025-12-02","resetTime":"17:00:00Z","numWeeks":3813}}',
          ));
        var N = JSON.parse(
          '[13646368,125494331,1486918022,1703496685,2106680364,2140235634,2173937871,2207493141,2274750776]',
        );
        (v.helmet,
          v.gauntlets,
          v.chest,
          v.leg,
          v.classitem,
          [
            ...C,
            ...N,
            f.EnhancementsSeasonMaverick,
            f.EnhancementsArtifice,
            f.CoreGearSystemsArmorTieringPlugsTuningMods,
          ]);
        var H = s(9518);
        let D = Date.now();
        function G(e, n, ...s) {
          console.log(`[${e}]`, (Date.now() - D) / 1e3, n, ...s);
        }
        var L = s(451);
        let F = {
          Postmaster: [A.Engrams, A.LostItems, A.Messages, A.SpecialOrders],
          Weapons: [A.KineticWeapons, A.EnergyWeapons, A.PowerWeapons],
          Armor: [A.Helmet, A.Gauntlets, A.ChestArmor, A.LegArmor, A.ClassArmor],
          General: [
            A.Subclass,
            A.Ghost,
            A.Emblems,
            A.Ships,
            A.Vehicle,
            A.Emotes,
            A.Finishers,
            A.Artifacts,
          ],
          Inventory: [A.Accessories, A.Consumables, A.Modifications],
        }.Armor;
        function E(e) {
          return (n, s) => {
            var i, a;
            return (
              (i = e(n)),
              i === (a = e(s)) ? 0 : void 0 === a ? 1 : void 0 === i || i < a ? -1 : +(i > a)
            );
          };
        }
        function y(e, n, s, i, a) {
          if (a < 0 || (e.useMemoGate && i.length > 1) || !e.useAutoModsMemo)
            return _(
              e.autoModOptions,
              e.generalModCosts,
              n,
              0,
              e.numAvailableGeneralMods,
              s,
              i,
              a,
              void 0,
            );
          let t = O(i, s, a),
            o = e.autoModsMemo.get(t);
          void 0 === o && ((o = new Map()), e.autoModsMemo.set(t, o));
          let r = I(n),
            c = o.get(r);
          if (void 0 !== c) return c ?? void 0;
          let l = _(
            e.autoModOptions,
            e.generalModCosts,
            n,
            0,
            e.numAvailableGeneralMods,
            s,
            i,
            a,
            void 0,
          );
          return (o.set(r, l ?? null), l);
        }
        function B(e) {
          let n = 0;
          for (let s = 0; s < e.length; s++) n = 32 * n + e[s];
          return n;
        }
        function I(e) {
          return (
            e[0] +
            256 * e[1] +
            65536 * e[2] +
            0x1000000 * e[3] +
            0x100000000 * e[4] +
            0x10000000000 * e[5]
          );
        }
        function O(e, n, s) {
          if (1 === e.length) return (8 * B(e[0]) + n) * 64 + s;
          let i = e.map(B).sort((e, n) => n - e);
          return `${i.join(',')}|${n}|${s}`;
        }
        function _(e, n, s, i, a, t, o, r, c) {
          for (; i < s.length && 0 === s[i];) i++;
          if (i === s.length)
            if (
              (function (e, n, s) {
                if (void 0 !== s && s.length) {
                  e = e.slice();
                  for (let n = 0; n < s.length; n++) e.push(...s[n].generalModsCosts);
                  e.sort((e, n) => n - e);
                }
                return n.some((n) => e.every((e, s) => e <= n[s]));
              })(n, o, c)
            )
              return c ?? [];
            else return;
          let l = e[i][s[i]];
          if (!l) return;
          let S = void 0 !== c ? c.slice() : [];
          for (let c of (S.push(S[0]), l)) {
            if (c.numArtificeMods > t || c.numGeneralMods > a || c.modEnergyCost > r) continue;
            S[S.length - 1] = c;
            let l = _(
              e,
              n,
              s,
              i + 1,
              a - c.numGeneralMods,
              t - c.numArtificeMods,
              o,
              r - c.modEnergyCost,
              S,
            );
            if (l) return l;
          }
        }
        function Z(e, n, s) {
          if (s?.result) return s.result;
          let i = (function (e, n) {
            let s = [],
              i = 0;
            for (let e = 0; e < n.length; e++) i += n[e].remainingEnergyCapacity;
            e: for (let i = 0; i < e.length; i++) {
              let a = e[i],
                t = [0, 0, 0, 0, 0];
              for (let e = 0; e < n.length; e++) {
                let s = a[e],
                  i = n[e];
                if (((t[e] = i.remainingEnergyCapacity), s)) {
                  let n = s.tag;
                  if (s.energyCost > i.remainingEnergyCapacity || i.compatibleActivityMod !== n)
                    continue e;
                  t[e] -= s.energyCost;
                }
              }
              (t.sort((e, n) => n - e), s.push(t));
            }
            return { setEnergy: i, remainingEnergiesPerAssignment: s };
          })(e.activityModPermutations, n);
          return (s && (s.result = i), i);
        }
        (f.EnhancementsArtifice,
          f.CoreGearSystemsArmorTieringPlugsTuningMods,
          L.$X.None,
          L.$X.None,
          L.$X.ArtificeExotic);
        let $ = [0, 0, 0, 0, 0, 0];
        function U(e, n, s, i, a, t, o) {
          let r,
            c,
            l = !1;
          for (let e = 0; e < a.length; e++) {
            let n = s[e],
              i = a[e],
              o = t[e];
            (o.maxStat < i.minStat && (o.maxStat = i.minStat),
              n > o.maxStat && ((o.maxStat = n), (l ||= i.minStat < i.maxStat)));
            let r = i.minStat - n;
            r > 0 ? ($[e] = r) : ($[e] = 0);
          }
          if (0 === e.numAvailableGeneralMods && 0 === i) return l;
          let S = 10 * e.numAvailableGeneralMods + 3 * i;
          for (let k = 0; k < a.length; k++) {
            let u = s[k],
              d = a[k],
              V = t[k];
            if (V.maxStat >= 200 || u + S <= V.maxStat) continue;
            let { remainingEnergiesPerAssignment: f, setEnergy: p } = (r ??= Z(e, n, o)),
              m = p - e.totalModEnergyCost;
            if (e.useMaxBoostMemo && void 0 === c) {
              let n = O(f, i, m);
              void 0 === (c = e.maxBoostMemo.get(n)) && ((c = new Map()), e.maxBoostMemo.set(n, c));
            }
            let x = $[k];
            $[k] = 0;
            let A = 0x1000000000000 * k + I($),
              g = c?.get(A);
            if (void 0 === g) {
              let n = -1,
                s = S;
              for (; n < s;) {
                let a = (n + s + 1) >> 1;
                (($[k] = a), y(e, $, i, f, m) ? (n = a) : (s = a - 1));
              }
              ((g = n), c?.set(A, g));
            }
            $[k] = x;
            let R = u + Math.min(g, 200 - u);
            R > V.maxStat && ((l ||= d.minStat < d.maxStat && R > d.minStat), (V.maxStat = R));
          }
          return l;
        }
        function z(e, n, s, i, a) {
          n.earlyModsCheck.timesChecked++;
          let t = 0;
          for (let e of s) t += e.remainingEnergyCapacity;
          if (t < e.totalModEnergyCost) return void n.earlyModsCheck.timesFailed++;
          if (e.hasActivityMods)
            for (let [i, a] of Object.entries(e.activityTagCounts)) {
              let e = 0;
              for (let n of s) n.compatibleActivityMod === i && e++;
              if (e < a) return void n.earlyModsCheck.timesFailed++;
            }
          let o = !1,
            r = [0, 0, 0, 0, 0];
          n.finalAssignment.modAssignmentAttempted++;
          e: for (let n of e.activityModPermutations) {
            for (let e = 0; e < s.length; e++) {
              let i = n[e];
              if (!i) continue;
              let a = s[e],
                t = i.tag;
              if (i.energyCost > a.remainingEnergyCapacity || a.compatibleActivityMod !== t)
                continue e;
            }
            o = !0;
            for (let e = 0; e < s.length; e++) {
              let i = s[e];
              r[e] = i.remainingEnergyCapacity - (n[e]?.energyCost || 0);
            }
            if ((r.sort((e, n) => n - e), i)) {
              let n = y(e, i, a, [r], t - e.totalModEnergyCost);
              if (n) return n;
            } else if (e.generalModCosts.every((e, n) => e <= r[n])) return [];
          }
          o && i
            ? n.finalAssignment.autoModsAssignmentFailed++
            : n.finalAssignment.modsAssignmentFailed++;
        }
        function Q(e, n) {
          return e.enabledStatsTotal !== n.enabledStatsTotal
            ? e.enabledStatsTotal < n.enabledStatsTotal
            : e.statMix !== n.statMix
              ? e.statMix < n.statMix
              : e.statsTotal !== n.statsTotal
                ? e.statsTotal < n.statsTotal
                : e.power < n.power;
        }
        class j {
          heap = [];
          capacity;
          strictBeat = i.strictBeat;
          constructor(e) {
            this.capacity = e;
          }
          couldInsert(e) {
            return (
              this.heap.length < this.capacity ||
              (this.strictBeat
                ? e > this.heap[0].enabledStatsTotal
                : e >= this.heap[0].enabledStatsTotal)
            );
          }
          insert(e) {
            return this.heap.length < this.capacity
              ? (this.heap.push(e), this.bubbleUp(this.heap.length - 1), !0)
              : !Q(e, this.heap[0]) && ((this.heap[0] = e), this.bubbleDown(0), !1);
          }
          getArmorSets() {
            return this.heap.toSorted((e, n) =>
              e.enabledStatsTotal !== n.enabledStatsTotal
                ? n.enabledStatsTotal - e.enabledStatsTotal
                : e.statMix !== n.statMix
                  ? n.statMix - e.statMix
                  : n.power - e.power,
            );
          }
          get totalSets() {
            return this.heap.length;
          }
          bubbleUp(e) {
            for (; e > 0;) {
              let n = Math.floor((e - 1) / 2);
              if (Q(this.heap[e], this.heap[n]))
                (([this.heap[e], this.heap[n]] = [this.heap[n], this.heap[e]]), (e = n));
              else break;
            }
          }
          bubbleDown(e) {
            let n = this.heap.length;
            for (;;) {
              let s = e,
                i = 2 * e + 1,
                a = 2 * e + 2;
              if (
                (i < n && Q(this.heap[i], this.heap[s]) && (s = i),
                a < n && Q(this.heap[a], this.heap[s]) && (s = a),
                s !== e)
              )
                (([this.heap[e], this.heap[s]] = [this.heap[s], this.heap[e]]), (e = s));
              else break;
            }
          }
        }
        async function K(
          e,
          {
            filteredItems: n,
            modStatTotals: s,
            lockedMods: a,
            setBonuses: t,
            requiredPerks: o,
            desiredStatRanges: r,
            anyExotic: c,
            autoModOptions: l,
            autoStatMods: S,
            strictUpgrades: k,
            stopOnFirstSet: u,
          },
          d,
        ) {
          let V,
            f,
            p = performance.now(),
            {
              subtreePrune: m,
              rangeSeeding: x,
              convergenceGate: g,
              energyCache: R,
              highStatSort: h,
              tuningPreGate: b,
              coarseLevelPrunes: W,
              unrolledAdds: w,
            } = i,
            M = r.map(({ statHash: e }) => e),
            v = r.map(({ maxStat: e }) => e),
            C = M.map((e) => s[e]),
            P = M.map(() => ({ minStat: 200, maxStat: 0 })),
            T = new Map();
          for (let e of F.flatMap((e) => n[e]))
            T.set(
              e,
              M.map((n) => e.stats[n]),
            );
          let N = n[A.Helmet],
            D = n[A.Gauntlets],
            L = n[A.ChestArmor],
            B = n[A.LegArmor],
            I = n[A.ClassArmor],
            O = [N, D, L, B, I],
            _ = (e) => {
              let n = T.get(e),
                s = 0;
              for (let e = 0; e < 6; e++) r[e].maxStat > 0 && (s += n[e]);
              return s;
            };
          if (h) for (let e of O) e.sort((e, n) => _(n) - _(e));
          let $ = N.length * D.length * L.length * B.length * I.length;
          G(
            `loadout optimizer thread ${e}`,
            'Processing',
            $,
            'combinations from',
            N.length + D.length + L.length + B.length + I.length,
            'items',
            JSON.stringify({
              helms: N.length,
              gauntlets: D.length,
              chests: L.length,
              legs: B.length,
              classItems: I.length,
            }),
          );
          let Q = {
              skipReasons: {
                doubleExotic: 0,
                noExotic: 0,
                skippedLowTier: 0,
                insufficientSetBonus: 0,
                insufficientPerks: 0,
                subtreePruned: 0,
                tuningGatePruned: 0,
                trackerFloorPruned: 0,
              },
              lowerBoundsExceeded: { timesChecked: 0, timesFailed: 0 },
              modsStatistics: {
                earlyModsCheck: { timesChecked: 0, timesFailed: 0 },
                autoModsPick: { timesChecked: 0, timesFailed: 0 },
                finalAssignment: {
                  modAssignmentAttempted: 0,
                  modsAssignmentFailed: 0,
                  autoModsAssignmentFailed: 0,
                },
              },
            },
            en = { numProcessed: 0, numValidSets: 0, statistics: Q };
          if (0 === $)
            return {
              sets: [],
              combos: 0,
              statRangesFiltered: Object.fromEntries(
                M.map((e) => [e, { minStat: 0, maxStat: 200 }]),
              ),
              processInfo: en,
            };
          let es = new j(200),
            { activityMods: ei, generalMods: ea } = a,
            et =
              ((V = ea.map((e) => e.energyCost).sort((e, n) => n - e)),
              {
                autoModOptions:
                  ((f = S ? 5 - V.length : 0),
                  Object.fromEntries(
                    M.map((e, n) => [
                      n,
                      (function (e, n, s, i) {
                        let a = {},
                          t = e.artificeMods[n],
                          o = e.generalMods[n]?.minorMod,
                          r = e.generalMods[n]?.majorMod;
                        for (let e = 0; e <= 5 * !!t; e++)
                          for (let n = 0; n <= (o ? i : 0); n++)
                            for (let c = 0; c <= (r ? i - n : 0); c++) {
                              let i = 3 * e + 5 * n + 10 * c;
                              if (0 === i) continue;
                              let l = i - (e > 0 ? 2 : 4),
                                S = {
                                  numArtificeMods: e,
                                  numGeneralMods: n + c,
                                  generalModsCosts: [
                                    ...Array(c).fill(r?.cost ?? 0),
                                    ...Array(n).fill(o?.cost ?? 0),
                                  ],
                                  modHashes: [
                                    ...Array(c).fill(r?.hash ?? 0),
                                    ...Array(n).fill(o?.hash ?? 0),
                                    ...Array(e).fill(t ?? 0),
                                  ],
                                  modEnergyCost: n * (o?.cost ?? 0) + c * (r?.cost ?? 0),
                                  targetStatIndex: s,
                                  exactStatPoints: i,
                                };
                              for (let e = l; e <= i; e++) (a[e] ??= []).push(S);
                            }
                        for (let e of Object.values(a))
                          e.sort(
                            (function (...e) {
                              return (n, s) => {
                                for (let i of e) {
                                  let e = i(n, s);
                                  if (0 !== e) return e;
                                }
                                return 0;
                              };
                            })(
                              E((e) => -e.numArtificeMods),
                              E((e) => -e.numGeneralMods),
                            ),
                          );
                        return a;
                      })(l, e, n, f),
                    ]),
                  )),
                hasActivityMods: ei.length > 0,
                generalModCosts: V,
                numAvailableGeneralMods: f,
                totalModEnergyCost:
                  V.reduce((e, n) => e + n, 0) + ei.reduce((e, n) => e + n.energyCost, 0),
                activityModPermutations: (function (e, n) {
                  if (!e.length) return [[null, null, null, null, null]];
                  let s = [0, 0, 0, 0, 0],
                    i = Array.from(e),
                    a = new Set();
                  for (; i.length < 5;) i.push(null);
                  let t = 0,
                    o = [Array.from(i)];
                  for (a.add(n(i)); t < 5;)
                    if (s[t] < t) {
                      t % 2 == 0
                        ? ([i[0], i[t]] = [i[t], i[0]])
                        : ([i[s[t]], i[t]] = [i[t], i[s[t]]]);
                      let e = n(i);
                      (a.has(e) || (o.push(Array.from(i)), a.add(e)), (s[t] += 1), (t = 0));
                    } else ((s[t] = 0), (t += 1));
                  return o;
                })(ei, (e) => e.map((e) => (e ? `${e.energyCost}${e.tag}` : void 0)).join(',')),
                activityTagCounts: ei.reduce(
                  (e, n) => (n.tag && (e[n.tag] = (e[n.tag] || 0) + 1), e),
                  {},
                ),
                autoModsMemo: new Map(),
                maxBoostMemo: new Map(),
                useAutoModsMemo: i.autoModsMemo,
                useMemoGate: i.memoGate,
                useMaxBoostMemo: i.maxBoostMemo,
              }),
            eo = !!(ei.length || ea.length),
            er = Object.keys(t).map((e) => Number(e)),
            ec = Object.values(t),
            el = (function () {
              if (globalThis.scheduler && navigator.userAgent.includes('Firefox'))
                return () => globalThis.scheduler.yield();
            })(),
            eS = 0,
            ek = o.map((e) => e.hash),
            eu = o.map((e) => e.count),
            ed = o.length,
            eV = ed > 0,
            ef = O.map((e) =>
              (function (e, n, s, i, a, t) {
                let o = e.length,
                  r = i.length,
                  c = {
                    exotic: new Int8Array(o),
                    artifice: new Int8Array(o),
                    wildcard: new Int8Array(o),
                    stats: new Int32Array(6 * o),
                    setBonusIdx: new Int8Array(o),
                    perks: new Int8Array(o * r),
                    hasExotic: !1,
                    maxPerks: new Int8Array(r),
                    maxSetContrib: 0,
                    tuning: Array(o),
                  };
                for (let l = 0; l < o; l++) {
                  let o = e[l];
                  if (((c.exotic[l] = +!!o.isExotic), o.tuningVariants?.length)) {
                    let e = o.tuningVariants.map((e) => ({
                        modHash: e.modHash,
                        deltas: a.map((n) => e.stats[n] - o.stats[n]),
                      })),
                      n = [0, 0, 0, 0, 0, 0],
                      s = [0, 0, 0, 0, 0, 0],
                      i = 0;
                    for (let i = 0; i < 6; i++)
                      ((n[i] = Math.min(...e.map((e) => e.deltas[i]))),
                        (s[i] = Math.max(...e.map((e) => e.deltas[i]))));
                    for (let n of e) {
                      let e = 0;
                      for (let s = 0; s < 6; s++)
                        t[s].maxStat > 0 && n.deltas[s] > 0 && (e += n.deltas[s]);
                      e > i && (i = e);
                    }
                    c.tuning[l] = { variants: e, minDeltas: n, maxDeltas: s, maxNetGain: i };
                  }
                  ((c.artifice[l] = +!!o.isArtifice),
                    (c.wildcard[l] = +!!o.hasSetBonusModSocket),
                    (c.setBonusIdx[l] = void 0 !== o.setBonus ? s.indexOf(o.setBonus) : -1),
                    (c.hasExotic ||= o.isExotic));
                  let S = +(c.setBonusIdx[l] >= 0) + c.wildcard[l];
                  S > c.maxSetContrib && (c.maxSetContrib = S);
                  let k = n.get(o);
                  for (let e = 0; e < 6; e++) c.stats[6 * l + e] = k[e];
                  for (let e = 0; e < r; e++)
                    o.intrinsicPerks?.includes(i[e]) &&
                      ((c.perks[l * r + e] = 1), (c.maxPerks[e] = 1));
                }
                return c;
              })(e, T, er, ek, M, r),
            ),
            [ep, em, ex, eA, eg] = ef,
            eR = er.length,
            eh = D.length * L.length * B.length * I.length,
            eb = L.length * B.length * I.length,
            eW = B.length * I.length,
            ew = I.length,
            eM = em.hasExotic || ex.hasExotic || eA.hasExotic || eg.hasExotic,
            ev = ex.hasExotic || eA.hasExotic || eg.hasExotic,
            eC = eA.hasExotic || eg.hasExotic,
            eP = eg.hasExotic,
            eT = Array(ed),
            eN = Array(ed),
            eH = Array(ed),
            eD = Array(ed);
          for (let e = 0; e < ed; e++)
            ((eD[e] = eg.maxPerks[e]),
              (eH[e] = eD[e] + eA.maxPerks[e]),
              (eN[e] = eH[e] + ex.maxPerks[e]),
              (eT[e] = eN[e] + em.maxPerks[e]));
          let eG = eg.maxSetContrib,
            eL = eG + eA.maxSetContrib,
            eF = eL + ex.maxSetContrib,
            eE = eF + em.maxSetContrib,
            [, ey, eB, eI, eO] = ef.map((e, n) =>
              (function (e, n, s) {
                let i = [0, 0, 0, 0, 0, 0],
                  a = [200, 200, 200, 200, 200, 200],
                  t = !1,
                  o = 0;
                for (let r = 0; r < n; r++) {
                  let n = 6 * r,
                    c = 0;
                  for (let t = 0; t < 6; t++) {
                    let o = e.stats[n + t];
                    (o > i[t] && (i[t] = o), o < a[t] && (a[t] = o), s[t] > 0 && (c += o));
                  }
                  (c > o && (o = c), (t ||= 1 === e.artifice[r]));
                }
                return { max: i, min: a, hasArtifice: t, maxTotal: o };
              })(e, O[n].length, v),
            ),
            e_ = eO.max,
            eZ = eO.min,
            e$ = J(eI.max, e_),
            eU = J(eI.min, eZ),
            ez = J(eB.max, e$),
            eQ = J(eB.min, eU),
            ej = eO.maxTotal,
            eK = ej + eI.maxTotal,
            eJ = eK + eB.maxTotal,
            eX = eJ + ey.maxTotal,
            eq = J(ey.max, ez),
            eY = J(ey.min, eQ),
            e0 = +!!eO.hasArtifice,
            e9 = e0 + +!!eI.hasArtifice,
            e7 = e9 + +!!eB.hasArtifice,
            e1 = e7 + +!!ey.hasArtifice,
            {
              maxTuningDelta: e3,
              minTuningDelta: e5,
              maxTuningNetGain: e4,
            } = (function (e) {
              let n = [0, 0, 0, 0, 0, 0],
                s = [0, 0, 0, 0, 0, 0],
                i = 0;
              for (let a of e)
                for (let e of a.tuning)
                  if (e) {
                    for (let i = 0; i < 6; i++)
                      (e.maxDeltas[i] > n[i] && (n[i] = e.maxDeltas[i]),
                        e.minDeltas[i] < s[i] && (s[i] = e.minDeltas[i]));
                    e.maxNetGain > i && (i = e.maxNetGain);
                  }
              return { maxTuningDelta: n, minTuningDelta: s, maxTuningNetGain: i };
            })(ef),
            e2 = 10 * et.numAvailableGeneralMods,
            e6 = [0, 0, 0, 0, 0, 0],
            e8 = (e, n, s, i, a, t) => {
              let o = (t + s) * 3 + e2,
                c = 0,
                l = 0;
              for (let n = 0; n < 6; n++)
                v[n] > 0 && ((c += Math.min(a[n] + e[n] + e3[n], v[n])), (l += a[n]));
              let S = Math.min(c, l + i);
              if (es.couldInsert(S + o + e4)) return !1;
              let k = 0;
              for (let n = 0; n < 6; n++) {
                let s = r[n],
                  i = 0;
                if (s.maxStat > 0 && s.minStat > 0) {
                  let t = Math.min(200, a[n] + e[n] + e3[n]);
                  s.minStat > t && (i = s.minStat - t);
                }
                ((e6[n] = i), (k += i));
              }
              for (let s = 0; s < 6; s++) {
                let i = P[s],
                  t = k - e6[s],
                  c = o > t ? o - t : 0;
                if (
                  i.maxStat < r[s].minStat ||
                  Math.min(200, a[s] + e[s] + e3[s] + c) > i.maxStat ||
                  (v[s] > 0 && Math.min(a[s] + n[s] + e5[s], v[s]) < i.minStat)
                )
                  return !1;
              }
              return !0;
            },
            ne = [0, 0, 0, 0, 0, 0],
            nn = [0, 0, 0, 0, 0, 0],
            ns = [0, 0, 0, 0, 0, 0],
            ni = [, , , , ,],
            na = { result: void 0 },
            nt = [0, 0, 0, 0, 0, 0],
            no = [0, 0, 0, 0, 0, 0],
            nr = [0, 0, 0, 0, 0, 0],
            nc = [0, 0, 0, 0, 0, 0],
            nl = Array(ed).fill(0),
            nS = Array(ed).fill(0),
            nk = Array(ed).fill(0),
            nu = Array(ed).fill(0),
            nd = Array(eR).fill(0),
            nV = Array(eR).fill(0),
            nf = Array(eR).fill(0),
            np = Array(eR).fill(0),
            nm = Array(ed).fill(0),
            nx = Array(eR).fill(0),
            nA = 0,
            ng = 0,
            nR = 0,
            nh = 0,
            nb = 0,
            nW = 0,
            nw = 0,
            nM = 0,
            nv = 0,
            nC = 0,
            nP = 0,
            nT = async () => {
              (d(eS), (eS = 0), el && (await el()));
            };
          x &&
            !c &&
            0 === ed &&
            0 === eR &&
            (function (e, n, s, i, a, t, o, r, c, l) {
              let S = 10 * r.numAvailableGeneralMods;
              for (let s = 0; s < 6; s++) {
                if (0 === a[s]) continue;
                let t = i[s],
                  r = 1 / 0,
                  c = 0;
                for (let i = 0; i < 5; i++) {
                  let a = e[i],
                    o = n[i].length,
                    l = 1 / 0,
                    S = 1 / 0;
                  for (let e = 0; e < o; e++) {
                    let n = a.tuning[e],
                      i = a.stats[6 * e + s] + (n ? n.minDeltas[s] : 0);
                    1 === a.exotic[e] ? i < S && (S = i) : i < l && (l = i);
                  }
                  l === 1 / 0 ? (c++, (t += S)) : ((t += l), S - l < r && (r = S - l));
                }
                if (c > 1) continue;
                0 === c && r < 0 && (t += r);
                let l = Math.min(t, a[s]);
                l < o[s].minStat && (o[s].minStat = l);
              }
              let k = [, , , , ,],
                u = [0, 0, 0, 0, 0, 0],
                d = [0, 0, 0, 0, 0, 0],
                V = { result: void 0 };
              for (let f = 0; f < 6; f++) {
                if (0 === a[f]) continue;
                let p = !1,
                  m = !0;
                for (let s = 0; s < 5; s++) {
                  let i = e[s],
                    a = n[s],
                    t = 0,
                    o = -1,
                    r = -1,
                    c = -1;
                  for (let e = 0; e < a.length; e++) {
                    let n = i.stats[6 * e + f];
                    (n > o && ((o = n), (t = e)), 0 === i.exotic[e] && n > c && ((c = n), (r = e)));
                  }
                  let l = t;
                  if (1 === i.exotic[t])
                    if (p)
                      if (r >= 0) l = r;
                      else {
                        m = !1;
                        break;
                      }
                    else p = !0;
                  k[s] = a[l];
                }
                if (!m) continue;
                let x = 0;
                for (let e = 0; e < 6; e++) u[e] = i[e];
                for (let e = 0; e < 5; e++) {
                  let n = s.get(k[e]);
                  for (let e = 0; e < 6; e++) u[e] += n[e];
                  k[e].isArtifice && x++;
                }
                let A = 0;
                for (let e = 0; e < 6; e++) {
                  d[e] = 0;
                  let n = t[e];
                  if (n.maxStat > 0 && n.minStat > 0) {
                    let s = n.minStat - Math.min(u[e], a[e]);
                    s > 0 && ((A += s), (d[e] = s));
                  }
                }
                !(A > 3 * x + S) &&
                  ((V.result = void 0),
                  ((!c && !(A > 0)) || z(r, l, k, A > 0 ? d : void 0, x)) &&
                    U(r, k, u, x, t, o, V));
              }
            })(ef, O, T, C, v, r, P, et, eo, Q.modsStatistics);
          n: for (let e = 0; e < N.length; e++) {
            let n = N[e],
              s = ep.exotic[e];
            if (W && c && 0 === s && !eM) {
              ((nb += eh), (eS += eh) >= 1e5 && (await nT()));
              continue;
            }
            if (eV && Y(ep, e, nm, nl, eT, eu) && W) {
              ((nW += eh), (eS += eh) >= 1e5 && (await nT()));
              continue;
            }
            let i = ep.wildcard[e];
            if (eR > 0 && ee(ep, e, nx, nd, ec, i, eE) && W) {
              ((nw += eh), (eS += eh) >= 1e5 && (await nT()));
              continue;
            }
            let a = ep.artifice[e];
            if (
              (w ? X(nt, C, ep.stats, 6 * e) : q(nt, C, ep.stats, 6 * e),
              m && e8(eq, eY, e1, eX, nt, a))
            ) {
              ((nM += eh), (nv += eh), (eS += eh) >= 1e5 && (await nT()));
              continue;
            }
            for (let t = 0; t < D.length; t++) {
              let o = D[t],
                l = s + em.exotic[t];
              if (W && l > 1) {
                ((nh += eb), (eS += eb) >= 1e5 && (await nT()));
                continue;
              }
              if (W && c && 0 === l && !ev) {
                ((nb += eb), (eS += eb) >= 1e5 && (await nT()));
                continue;
              }
              if (eV && Y(em, t, nl, nS, eN, eu) && W) {
                ((nW += eb), (eS += eb) >= 1e5 && (await nT()));
                continue;
              }
              let S = i + em.wildcard[t];
              if (eR > 0 && ee(em, t, nd, nV, ec, S, eF) && W) {
                ((nw += eb), (eS += eb) >= 1e5 && (await nT()));
                continue;
              }
              let d = a + em.artifice[t];
              if (
                (w ? X(no, nt, em.stats, 6 * t) : q(no, nt, em.stats, 6 * t),
                m && e8(ez, eQ, e7, eJ, no, d))
              ) {
                ((nM += eb), (nv += eb), (eS += eb) >= 1e5 && (await nT()));
                continue;
              }
              for (let s = 0; s < L.length; s++) {
                let i = L[s],
                  a = l + ex.exotic[s];
                if (W && a > 1) {
                  ((nh += eW), (eS += eW) >= 1e5 && (await nT()));
                  continue;
                }
                if (W && c && 0 === a && !eC) {
                  ((nb += eW), (eS += eW) >= 1e5 && (await nT()));
                  continue;
                }
                if (eV && Y(ex, s, nS, nk, eH, eu) && W) {
                  ((nW += eW), (eS += eW) >= 1e5 && (await nT()));
                  continue;
                }
                let V = S + ex.wildcard[s];
                if (eR > 0 && ee(ex, s, nV, nf, ec, V, eL) && W) {
                  ((nw += eW), (eS += eW) >= 1e5 && (await nT()));
                  continue;
                }
                let f = d + ex.artifice[s];
                if (
                  (w ? X(nr, no, ex.stats, 6 * s) : q(nr, no, ex.stats, 6 * s),
                  m && e8(e$, eU, e9, eK, nr, f))
                ) {
                  ((nM += eW), (nv += eW), (eS += eW) >= 1e5 && (await nT()));
                  continue;
                }
                for (let l = 0; l < B.length; l++) {
                  let S = B[l],
                    d = a + eA.exotic[l];
                  if (W && d > 1) {
                    ((nh += ew), (eS += ew) >= 1e5 && (await nT()));
                    continue;
                  }
                  if (W && c && 0 === d && !eP) {
                    ((nb += ew), (eS += ew) >= 1e5 && (await nT()));
                    continue;
                  }
                  if (eV && Y(eA, l, nk, nu, eD, eu) && W) {
                    ((nW += ew), (eS += ew) >= 1e5 && (await nT()));
                    continue;
                  }
                  let p = V + eA.wildcard[l];
                  if (eR > 0 && ee(eA, l, nf, np, ec, p, eG) && W) {
                    ((nw += ew), (eS += ew) >= 1e5 && (await nT()));
                    continue;
                  }
                  let x = f + eA.artifice[l];
                  if (
                    (w ? X(nc, nr, eA.stats, 6 * l) : q(nc, nr, eA.stats, 6 * l),
                    m && e8(e_, eZ, e0, ej, nc, x))
                  ) {
                    ((nM += ew), (nv += ew), (eS += ew) >= 1e5 && (await nT()));
                    continue;
                  }
                  s: for (let a = 0; a < I.length; a++) {
                    ++eS >= 1e5 && (await nT());
                    let V = d + eg.exotic[a];
                    if (V > 1) {
                      nh++;
                      continue;
                    }
                    if (c && 0 === V) {
                      nb++;
                      continue;
                    }
                    if (eV) {
                      let e = a * ed;
                      for (let n = 0; n < ed; n++)
                        if (nu[n] + eg.perks[e + n] < eu[n]) {
                          nW++;
                          continue s;
                        }
                    }
                    if (eR > 0) {
                      let e = eg.setBonusIdx[a],
                        n = p + eg.wildcard[a];
                      for (let s = 0; s < eR; s++) {
                        let i = ec[s],
                          a = np[s] + +(e === s);
                        if (a < i) {
                          let e = i - a;
                          if (n >= e) n -= e;
                          else {
                            nw++;
                            continue s;
                          }
                        }
                      }
                    }
                    let f = 6 * a,
                      m = ep.tuning[e],
                      A = 0;
                    (void 0 === m && ((m = em.tuning[t]), (A = 1)),
                      void 0 === m && ((m = ex.tuning[s]), (A = 2)),
                      void 0 === m && ((m = eA.tuning[l]), (A = 3)),
                      void 0 === m && ((m = eg.tuning[a]), (A = 4)));
                    let h = m?.variants,
                      W = void 0 !== h ? h.length : 1,
                      M = I[a];
                    ((ni[0] = n),
                      (ni[1] = o),
                      (ni[2] = i),
                      (ni[3] = S),
                      (ni[4] = M),
                      (na.result = void 0));
                    let C = x + eg.artifice[a],
                      T = 3 * C + e2;
                    if (b && void 0 !== m) {
                      let { minDeltas: e, maxDeltas: n, maxNetGain: s } = m;
                      w ? X(ne, nc, eg.stats, f) : q(ne, nc, eg.stats, f);
                      let i = 0,
                        a = !1;
                      for (let s = 0; s < 6; s++) {
                        let t = r[s],
                          o = P[s];
                        if (t.maxStat > 0) {
                          let n = Math.min(ne[s] + e[s], t.maxStat);
                          (n < o.minStat && (o.minStat = n), (i += Math.min(ne[s], t.maxStat)));
                        }
                        let c = o.maxStat,
                          l = ne[s] + n[s];
                        (c < t.minStat || l > c || (c < 200 && l + T > c)) && (a = !0);
                      }
                      if (!a && !es.couldInsert(i + s + T)) {
                        ((nA += W), (nM += W), (nC += W));
                        continue;
                      }
                    }
                    for (let e = 0; e < W; e++) {
                      if (
                        (nA++, w ? X(ne, nc, eg.stats, f) : q(ne, nc, eg.stats, f), void 0 !== h)
                      ) {
                        let n = h[e].deltas;
                        ((ne[0] += n[0]),
                          (ne[1] += n[1]),
                          (ne[2] += n[2]),
                          (ne[3] += n[3]),
                          (ne[4] += n[4]),
                          (ne[5] += n[5]));
                      }
                      ((nn[0] = Math.min(ne[0], v[0])),
                        (nn[1] = Math.min(ne[1], v[1])),
                        (nn[2] = Math.min(ne[2], v[2])),
                        (nn[3] = Math.min(ne[3], v[3])),
                        (nn[4] = Math.min(ne[4], v[4])),
                        (nn[5] = Math.min(ne[5], v[5])),
                        (ns[0] = 0),
                        (ns[1] = 0),
                        (ns[2] = 0),
                        (ns[3] = 0),
                        (ns[4] = 0),
                        (ns[5] = 0));
                      let s = 0,
                        a = 0;
                      for (let e = 0; e < 6; e++) {
                        let n = r[e];
                        if (n.maxStat > 0) {
                          let i = nn[e],
                            t = P[e];
                          if ((i < t.minStat && (t.minStat = i), (a += i), n.minStat > 0)) {
                            let a = n.minStat - i;
                            a > 0 && ((s += a), (ns[e] = a));
                          }
                        }
                      }
                      if ((ng++, s > T)) {
                        nR++;
                        continue;
                      }
                      if ((eo || s > 0) && !z(et, Q.modsStatistics, ni, s > 0 ? ns : void 0, C))
                        continue;
                      let t = !g;
                      if (g)
                        for (let e = 0; e < 6; e++) {
                          let n = P[e].maxStat;
                          if (n < r[e].minStat || ne[e] > n || (n < 200 && ne[e] + T > n)) {
                            t = !0;
                            break;
                          }
                        }
                      let c = t && U(et, ni, ne, C, r, P, R ? na : void 0);
                      if (!es.couldInsert(a + T)) {
                        (nM++, nP++);
                        continue;
                      }
                      let l = (function (e, n, s, i, a, t) {
                        var o;
                        let { remainingEnergiesPerAssignment: r, setEnergy: c } = Z(e, n, t);
                        if (0 === r.length) return;
                        let l = [0, 0, 0, 0, 0, 0],
                          S = [0, 0, 0, 0, 0, 0];
                        for (let e = s.length - 1; e >= 0; e--) {
                          let n = i[e];
                          if (n.maxStat > 0) {
                            let i = s[e];
                            if (n.minStat > 0) {
                              let s = n.minStat - i;
                              s > 0 && (S[e] = s);
                            }
                            l[e] = n.maxStat - i;
                          }
                        }
                        let k = (function (e, n, s, i, a, t) {
                            if (0 === a[0][0] && 0 === i) return [];
                            let o = y(e, n, i, a, t);
                            if (!o) return [];
                            for (let r = 0; r < n.length; r++) {
                              let c, l;
                              if (s[r] <= 0) continue;
                              let S = n[r],
                                k = 0,
                                u = Math.max(3, S),
                                d = s[r] - 1;
                              for (; u < d && ((n[r] = Math.floor((u + d) / 2)), !(n[r] <= 0));)
                                (c = y(e, n, i, a, t))
                                  ? ((u = n[r] + 1), (l = c), (k = n[r]))
                                  : (d = n[r]);
                              c ? (o = c) : l ? ((o = l), (n[r] = k)) : (n[r] = S);
                            }
                            return o;
                          })(
                            e,
                            S,
                            l,
                            (a ??=
                              ((o = (e) => e.isArtifice),
                              n.reduce((e, n) => (o(n) ? e + 1 : e), 0))),
                            r,
                            c - e.totalModEnergyCost,
                          ),
                          u = [0, 0, 0, 0, 0, 0];
                        for (let e of k) u[e.targetStatIndex] += e.exactStatPoints;
                        return { mods: k.flatMap((e) => e.modHashes), bonusStats: u };
                      })(et, ni, ne, r, C, R ? na : void 0);
                      if (!l) {
                        Q.modsStatistics.finalAssignment.modsAssignmentFailed++;
                        continue;
                      }
                      let { bonusStats: d, mods: V } = l,
                        p = [
                          nn[0] + d[0],
                          nn[1] + d[1],
                          nn[2] + d[2],
                          nn[3] + d[3],
                          nn[4] + d[4],
                          nn[5] + d[5],
                        ],
                        m = p[0] + p[1] + p[2] + p[3] + p[4] + p[5];
                      if (!es.couldInsert(m)) {
                        (nM++, nP++);
                        continue;
                      }
                      let x = (function (e, n) {
                          let s = 0;
                          for (let i = 0; i < 6; i++)
                            n[i].maxStat > 0 && (s = 256 * s + Math.min(e[i], 255));
                          return s;
                        })(p, r),
                        b = [
                          n.includedTuningMod,
                          o.includedTuningMod,
                          i.includedTuningMod,
                          S.includedTuningMod,
                          M.includedTuningMod,
                        ];
                      if (
                        (void 0 !== h && (b[A] = h[e].modHash),
                        V.push(...b.filter((e) => e)),
                        en.numValidSets++,
                        es.insert({
                          enabledStatsTotal: m,
                          statMix: x,
                          power: (function (e) {
                            let n = 0,
                              s = 0;
                            for (let i of e) i.power && ((n += i.power), s++);
                            return Math.floor(n / s);
                          })(ni),
                          armor: ni.slice(),
                          stats: ne.slice(),
                          statsTotal: (0, H.c)(ne),
                          mods: V,
                          bonusStats: d,
                          tuningDeltas: void 0 !== h ? h[e].deltas : void 0,
                        }),
                        u)
                      )
                        if (k) {
                          if (c) break n;
                        } else break n;
                    }
                  }
                }
              }
            }
          }
          ((en.numProcessed += nA),
            (Q.lowerBoundsExceeded.timesChecked += ng),
            (Q.lowerBoundsExceeded.timesFailed += nR),
            (Q.skipReasons.doubleExotic += nh),
            (Q.skipReasons.noExotic += nb),
            (Q.skipReasons.insufficientPerks += nW),
            (Q.skipReasons.insufficientSetBonus += nw),
            (Q.skipReasons.skippedLowTier += nM),
            (Q.skipReasons.subtreePruned += nv),
            (Q.skipReasons.tuningGatePruned += nC),
            (Q.skipReasons.trackerFloorPruned += nP));
          let nN = (function (e, n) {
              let s = [];
              for (let i = 0; i < e.length; i++) {
                let a = n(e[i], i);
                void 0 !== a && s.push(a);
              }
              return s;
            })(
              es.getArmorSets(),
              ({ armor: e, stats: n, mods: s, bonusStats: i, tuningDeltas: a, ...t }) => {
                let o = {},
                  c = {},
                  l = !1,
                  S = T.get(e[0]),
                  u = T.get(e[1]),
                  d = T.get(e[2]),
                  V = T.get(e[3]),
                  f = T.get(e[4]);
                for (let e = 0; e < M.length; e++) {
                  let s = M[e],
                    t = n[e] + i[e];
                  c[s] = t;
                  let p = r[e];
                  (p.maxStat > 0 && k && p.minStat < p.maxStat && !l && (l ||= t > p.minStat),
                    (o[s] = S[e] + u[e] + d[e] + V[e] + f[e] + (void 0 !== a ? a[e] : 0)));
                }
                if (!k || l)
                  return { ...t, armor: e.map((e) => e.id), stats: c, armorStats: o, statMods: s };
              },
            ),
            nH = performance.now() - p;
          return (
            G(
              `loadout optimizer thread ${e}`,
              'found',
              en.numValidSets,
              'stat mixes after processing',
              $,
              'stat combinations in',
              nH,
              'ms - ',
              Math.floor((1e3 * $) / nH),
              'combos/s',
              'sets outright skipped:',
              JSON.stringify(Q.skipReasons),
              'lower bounds:',
              JSON.stringify(Q.lowerBoundsExceeded),
              'mod assignment stats:',
              'early check:',
              JSON.stringify(Q.modsStatistics.earlyModsCheck),
              'auto mods pick:',
              JSON.stringify(Q.modsStatistics.autoModsPick),
              'final assignment:',
              JSON.stringify(Q.modsStatistics.finalAssignment),
            ),
            {
              sets: nN,
              combos: $,
              statRangesFiltered: Object.fromEntries(P.map((e, n) => [M[n], e])),
              processInfo: en,
            }
          );
        }
        function J(e, n) {
          let s = [0, 0, 0, 0, 0, 0];
          for (let i = 0; i < 6; i++) s[i] = e[i] + n[i];
          return s;
        }
        function X(e, n, s, i) {
          ((e[0] = n[0] + s[i]),
            (e[1] = n[1] + s[i + 1]),
            (e[2] = n[2] + s[i + 2]),
            (e[3] = n[3] + s[i + 3]),
            (e[4] = n[4] + s[i + 4]),
            (e[5] = n[5] + s[i + 5]));
        }
        function q(e, n, s, i) {
          for (let a = 0; a < 6; a++) e[a] = n[a] + s[i + a];
        }
        function Y(e, n, s, i, a, t) {
          let o = t.length,
            r = n * o,
            c = !1;
          for (let n = 0; n < o; n++) {
            let o = s[n] + e.perks[r + n];
            ((i[n] = o), o + a[n] < t[n] && (c = !0));
          }
          return c;
        }
        function ee(e, n, s, i, a, t, o) {
          let r = e.setBonusIdx[n],
            c = 0;
          for (let e = 0; e < a.length; e++) {
            let n = s[e] + +(r === e);
            i[e] = n;
            let t = a[e] - n;
            t > 0 && (c += t);
          }
          return c - t > o;
        }
        let en = (e) => globalThis.postMessage({ type: 'line', text: e });
        async function es(e) {
          let n = structuredClone(e),
            s = performance.now(),
            i = await K(0, n, () => {});
          return [performance.now() - s, i];
        }
        async function ei({ name: e, inputs: n, measurements: s, rounds: a }) {
          let t,
            o = [];
          await es(n);
          let [, r] = await es(n);
          for (let c of (en(
            `=== ${e}: combos ${r.combos} | valid ${r.processInfo.numValidSets} | returned ${r.sets.length}`,
          ),
          en(
            `    counters: ${((t = r.processInfo.statistics.skipReasons), `subtree ${t.subtreePruned} tuningGate ${t.tuningGatePruned} trackerFloor ${t.trackerFloorPruned} lowTier ${t.skippedLowTier} dblExotic ${t.doubleExotic} noExotic ${t.noExotic} perks ${t.insufficientPerks} setBonus ${t.insufficientSetBonus}`)}`,
          ),
          s)) {
            let s,
              t,
              l = c.join('+'),
              S = (e) => {
                for (let n of c) i[n] = e;
              },
              k = [],
              u = [];
            try {
              (S(!1), await es(n), S(!0));
              for (let e = 0; e < a; e++) {
                S(!0);
                let [e] = await es(n);
                (k.push(e), S(!1));
                let [i, a] = await es(n);
                (u.push(i), (s ??= a));
              }
            } finally {
              S(!0);
            }
            (s &&
              (c.some((e) => 'strictBeat' === e || 'highStatSort' === e) ||
              (s.processInfo.numValidSets === r.processInfo.numValidSets &&
                s.sets.length === r.sets.length)
                ? JSON.stringify(s.statRangesFiltered) !== JSON.stringify(r.statRangesFiltered) &&
                  (t = 'statRangesFiltered differ')
                : (t = `valid/returned ${s.processInfo.numValidSets}/${s.sets.length} vs ${r.processInfo.numValidSets}/${r.sets.length}`)),
              k.sort((e, n) => e - n),
              u.sort((e, n) => e - n));
            let d = {
              scenario: e,
              label: l,
              onMs: k[0],
              offMs: u[0],
              cost: u[0] / k[0],
              onAll: k,
              offAll: u,
              mismatch: t,
            };
            (o.push(d),
              en(
                `ABL ${e} | ${l.padEnd(17)} on ${k[0].toFixed(1).padStart(7)}ms  off ${u[0].toFixed(1).padStart(7)}ms  removal costs ${d.cost.toFixed(2)}x${t ? `  RESULT MISMATCH: ${t}` : ''}`,
              ));
          }
          globalThis.postMessage({ type: 'done', rows: o });
        }
        globalThis.onmessage = (e) => {
          'run' === e.data.type &&
            ei(e.data).catch((e) =>
              globalThis.postMessage({
                type: 'error',
                error: `${e.name}: ${e.message}
${e.stack}`,
              }),
            );
        };
      },
    },
    o = {};
  function r(e) {
    var n = o[e];
    if (void 0 !== n) return n.exports;
    var s = (o[e] = { exports: {} });
    return (t[e].call(s.exports, s, s.exports, r), s.exports);
  }
  ((r.m = t),
    (r.x = () => {
      var e = r.O(void 0, ['268'], () => r(1680));
      return r.O(e);
    }),
    (r.d = (e, n, s) => {
      var i = (n, s) => {
        for (var i in n)
          r.o(n, i) && !r.o(e, i) && Object.defineProperty(e, i, { enumerable: !0, [s]: n[i] });
      };
      (i(n, 'get'), i(s, 'value'));
    }),
    (r.f = {}),
    (r.e = (e) => Promise.all(Object.keys(r.f).reduce((n, s) => (r.f[s](e, n), n), []))),
    (r.u = (e) => '' + e + '.js'),
    (r.g = (() => {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || Function('return this')();
      } catch (e) {
        if ('object' == typeof window) return window;
      }
    })()),
    (r.o = (e, n) => Object.prototype.hasOwnProperty.call(e, n)),
    (e = []),
    (r.O = (n, s, i, a) => {
      if (s) {
        a = a || 0;
        for (var t = e.length; t > 0 && e[t - 1][2] > a; t--) e[t] = e[t - 1];
        e[t] = [s, i, a];
        return;
      }
      for (var o = 1 / 0, t = 0; t < e.length; t++) {
        for (var [s, i, a] = e[t], c = !0, l = 0; l < s.length; l++)
          (!1 & a || o >= a) && Object.keys(r.O).every((e) => r.O[e](s[l]))
            ? s.splice(l--, 1)
            : ((c = !1), a < o && (o = a));
        if (c) {
          e.splice(t--, 1);
          var S = i();
          void 0 !== S && (n = S);
        }
      }
      return n;
    }),
    (r.p = ''),
    (n = r.x),
    (r.x = () => r.e(268).then(n)),
    (s = { 861: 1 }),
    (a = (i = globalThis.rspackChunkdim = globalThis.rspackChunkdim || []).push.bind(i)),
    (i.push = (e) => {
      var [n, i, t] = e;
      for (var o in i) r.o(i, o) && (r.m[o] = i[o]);
      for (t && t(r); n.length;) s[n.pop()] = 1;
      a(e);
    }),
    (r.f.i = (e, n) => {
      s[e] || importScripts(r.p + r.u(e));
    }),
    r.x());
})();
