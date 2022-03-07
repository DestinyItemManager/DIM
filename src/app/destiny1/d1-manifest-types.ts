import {
  BungieMembershipType,
  DamageType,
  DestinyClass,
  DestinyGender,
  DestinyInventoryItemStatDefinition,
  DestinyItemQuantity,
  DestinyItemSubType,
  DestinyItemType,
  DestinyProgressionScope,
  DestinyProgressionStepDefinition,
  DestinyRace,
  DestinyStat,
  DestinyStatAggregationType,
  DestinyTalentNodeState,
  DestinyTalentNodeStepGroups,
  DestinyUnlockValueUIStyle,
  ItemBindStatus,
  ItemState,
  SpecialItemType,
  TierType,
  TransferStatuses,
} from 'bungie-api-ts/destiny2';

export interface D1TalentNode {
  isActivated: boolean;
  stepIndex: number;
  state: DestinyTalentNodeState;
  hidden: boolean;
  nodeHash: number;
}

export interface D1Perk {
  iconPath: string;
  perkHash: number;
  isActive: boolean;
}

export interface D1ItemSourceDefinition {
  expansionIndex: number;
  level: number;
  minQuality: number;
  maxQuality: number;
  minLevelRequired: number;
  maxLevelRequired: number;
  exclusivity: number;
  computedStats: { [statHash: number]: D1Stat };
  sourceHashes: number[];
}

export interface D1Stat extends DestinyStat {
  maximumValue: number;
}

export interface D1ItemComponent {
  itemHash: number;
  bindStatus: ItemBindStatus;
  isEquipped: boolean;
  itemInstanceId: string;
  itemLevel: number;
  stackSize: number;
  qualityLevel: number;
  stats: D1Stat[];
  primaryStat?: D1Stat;
  canEquip: boolean;
  equipRequiredLevel: number;
  unlockFlagHashRequiredToEquip: number;
  cannotEquipReason: number;
  damageType: DamageType;
  damageTypeHash: number;
  damageTypeNodeIndex: number;
  damageTypeStepIndex: number;
  progression?: {
    dailyProgress: number;
    weeklyProgress: number;
    currentProgress: number;
    level: number;
    step: number;
    progressToNextLevel: number;
    nextLevelAt: number;
    progressionHash: number;
  };
  talentGridHash: number;
  nodes: D1TalentNode[];
  useCustomDyes: boolean;
  isEquipment: boolean;
  isGridComplete: boolean;
  perks: D1Perk[];
  location: number;
  transferStatus: TransferStatuses;
  locked: boolean;
  lockable: boolean;
  objectives: D1ObjectiveProgress[];
  state: ItemState;
  bucket: number;
}

export interface D1InventoryItemDefinition {
  itemHash: number;
  itemName: string;
  itemDescription: string;
  icon: string;
  hasIcon: boolean;
  secondaryIcon: string;
  actionName: string;
  hasAction: boolean;
  deleteOnAction: boolean;
  tierTypeName: string;
  tierType: TierType;
  itemTypeName: string;
  bucketTypeHash: number;
  primaryBaseStatHash: number;
  stats: {
    [key: number]: DestinyInventoryItemStatDefinition;
  };
  perkHashes: number[];
  specialItemType: SpecialItemType;
  talentGridHash: number;
  hasGeometry: boolean;
  statGroupHash: number;
  itemLevels: number[];
  qualityLevel: number;
  equippable: boolean;
  instanced: boolean;
  rewardItemHash: number;
  values: {};
  itemType: DestinyItemType;
  itemSubType: DestinyItemSubType;
  classType: DestinyClass;
  sources: D1ItemSourceDefinition[];
  itemCategoryHashes: number[];
  sourceHashes: number[];
  nonTransferrable: boolean;
  exclusive: BungieMembershipType;
  maxStackSize: number;
  itemIndex: number;
  setItemHashes: number[];
  tooltipStyle: string;
  questlineItemHash: number;
  needsFullCompletion: boolean;
  objectiveHashes: number[];
  allowActions: boolean;
  questTrackingUnlockValueHash: number;
  bountyResetUnlockHash: number;
  uniquenessHash: number;
  showActiveNodesInTooltip: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1DamageTypeDefinition {
  damageTypeHash: number;
  identifier: string;
  damageTypeName: string;
  description: string;
  iconPath: string;
  transparentIconPath: string;
  showIcon: boolean;
  enumValue: number;
  hash: number;
  index: number;
  redacted: boolean;
}

interface D1TalentGridNodeStepDefinition {
  stepIndex: number;
  nodeStepHash: number;
  nodeStepName?: string;
  nodeStepDescription?: string;
  interactionDescription?: string;
  icon: string;
  damageType: number;
  damageTypeHash: number;
  activationRequirement: {
    gridLevel: number;
    materialRequirementHashes: [];
    exclusiveSetRequiredHash: number;
  };
  canActivateNextStep: boolean;
  nextStepIndex: number;
  isNextStepRandom: boolean;
  perkHashes: [];
  startProgressionBarAtProgress: number;
  statHashes: number[];
  affectsQuality: boolean;
  stepGroups: DestinyTalentNodeStepGroups;
  trueStepIndex: number;
  truePropertyIndex: number;
  affectsLevel: boolean;
}

interface D1TalentGridNodeDefinition {
  nodeIndex: number;
  nodeHash: number;
  row: number;
  column: number;
  prerequisiteNodeIndexes: number[];
  binaryPairNodeIndex: number;
  autoUnlocks: boolean;
  lastStepRepeats: boolean;
  isRandom: boolean;
  randomActivationRequirement: {
    gridLevel: number;
    materialRequirementHashes: number[];
    exclusiveSetRequiredHash: number;
  };
  isRandomRepurchasable: boolean;
  steps: D1TalentGridNodeStepDefinition[];
  exlusiveWithNodes: number[];
  randomStartProgressionBarAtProgression: number;
  originalNodeHash: number;
  talentNodeTypes: number;
  exclusiveSetHash: number;
  isRealStepSelectionRandom: boolean;
}

export interface D1TalentGridDefinition {
  gridHash: number;
  maxGridLevel: number;
  gridLevelPerColumn: number;
  progressionHash: number;
  nodes: D1TalentGridNodeDefinition[];
  calcMaxGridLevel: number;
  calcProgressToMaxLevel: number;
  exclusiveSets: {
    nodeIndexes: number[];
  }[];
  independentNodeIndexes: number[];
  maximumRandomMaterialRequirements: number;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1ClassDefinition {
  classHash: number;
  classType: DestinyClass;
  className: string;
  classNameMale: string;
  classNameFemale: string;
  classIdentifier: string;
  mentorVendorIdentifier: string;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1StatDefinition {
  statHash: number;
  statName: string;
  statDescription: string;
  icon: string;
  statIdentifier: string;
  aggregationType: DestinyStatAggregationType;
  hasComputedBlock: boolean;
  interpolate: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1ProgressionDefinition {
  progressionHash: number;
  name: string;
  scope: DestinyProgressionScope;
  repeatLastStep: boolean;
  icon: string;
  steps: DestinyProgressionStepDefinition[];
  visible: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1ObjectiveDefinition {
  objectiveHash: number;
  unlockValueHash: number;
  completionValue: number;
  vendorHash: number;
  vendorCategoryHash: number;
  displayDescription: string;
  locationHash: number;
  allowNegativeValue: boolean;
  allowValueChangeWhenCompleted: boolean;
  isCountingDownward: boolean;
  valueStyle: DestinyUnlockValueUIStyle;
  hash: number;
  index: number;
  contentIdentifier: string;
  redacted: boolean;
}

export interface D1ObjectiveProgress {
  objectiveHash: number;
  destinationHash: number;
  activityHash: number;
  progress: number;
  hasProgress: boolean;
  isComplete: boolean;
  displayValue: number;
}

export interface D1RecordComponent {
  recordHash: number;
  objectives: D1ObjectiveProgress[];
  status: number;
  scramble: boolean;
}

export interface D1RecordDefinition {
  displayName: string;
  description: string;
  recordValueUIStyle: string;
  icon: string;
  style: number;
  rewards: never[];
  actualRewards: never[];
  objectives: { objectiveHash: number }[];
  hash: number;
  index: number;
  contentIdentifier: string;
  redacted: boolean;
}

export interface D1Progression {
  dailyProgress: number;
  weeklyProgress: number;
  currentProgress: number;
  level: number;
  step: number;
  progressToNextLevel: number;
  nextLevelAt: number;
  progressionHash: number;
  name: string;
  scope: number;
  repeatLastStep: boolean;
  steps: {
    progressTotal: number;
    rewardItems: DestinyItemQuantity[];
  }[];
  visible: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1RecordBook {
  bookHash: number;
  records: { [recordHash: number]: D1RecordComponent };
  progression: D1Progression;
  completedCount: number;
  redeemedCount: number;
  spotlights: never[];
  startDate: string;
  expirationDate: string;
  progress: D1Progression;
  percentComplete: number;
}

export interface D1RecordBookPageDefinition {
  displayName: string;
  displayDescription: string;
  displayStyle: number;
  records: {
    recordHash: number;
    spotlight: boolean;
    scrambled: boolean;
  }[];
  rewards: {
    visible: boolean;
    itemHash: number;
    requirementUnlockExpressions: string[];
    requirementProgressionLevel: number;
    claimedUnlockHash: number;
    canReclaim: boolean;
    quantity: number;
  }[];
}

export interface D1RecordBookDefinition {
  bookAvailableUnlockExpression: {
    steps: {
      stepOperator: number;
      flagHash: number;
      valueHash: number;
      value: number;
    }[];
  };
  activeRanges: {
    start: string;
    end: string;
  }[];
  pages: D1RecordBookPageDefinition[];
  displayName: string;
  displayDescription: string;
  icon: string;
  unavailableReason: string;
  progressionHash: number;
  recordCount: number;
  bannerImage: string;
  itemHash: number;
  hash: number;
  index: number;
  contentIdentifier: string;
  redacted: boolean;
}

export interface D1ItemCategoryDefinition {
  itemCategoryHash: number;
  identifier: string;
  visible: boolean;
  title: string;
  shortTitle: string;
  description: string;
  grantDestinyItemType: DestinyItemType;
  grantDestinySubType: DestinyItemSubType;
  grantDestinyClass: DestinyClass;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1VendorCategoryDefinition {
  categoryHash: number;
  order: number;
  categoryName: string;
  mobileBannerPath: string;
  identifier: string;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1ActivityTier {
  activityHash: number;
  tierDisplayName: string;
  completion: {
    complete: boolean;
    success: boolean;
  };
  steps: {
    complete: boolean;
  }[];
  skullCategories: D1SkullCategory[];
  rewards: {
    rewardItems: DestinyItemQuantity[];
  }[];
  activityData: {
    activityHash: number;
    isNew: boolean;
    canLead: boolean;
    canJoin: boolean;
    isCompleted: boolean;
    isVisible: boolean;
    displayLevel: number;
    recommendedLight: number;
    difficultyTier: number;
  };
}

export interface D1SkullCategory {
  title: string;
  skulls: {
    displayName: string;
    description: string;
    icon: string;
  }[];
}

export interface D1ActivityComponent {
  identifier: string;
  status: {
    expirationDate: string;
    startDate: string;
    expirationKnown: boolean;
    active: boolean;
  };
  display: {
    categoryHash: number;
    icon: string;
    image: string;
    advisorTypeCategory: string;
    activityHash: number;
    destinationHash: number;
    placeHash: number;
    about: string;
    status: string;
    tips: string[];
    recruitmentIds: string[];
  };
  activityTiers: D1ActivityTier[];
  extended?: {
    highestWinRank: number;
    objectives: D1ObjectiveProgress[];
    skullCategories: D1SkullCategory[];
  };
}

export interface D1ActivityDefinition {
  activityHash: number;
  activityName: string;
  activityDescription: string;
  icon: string;
  releaseIcon: string;
  releaseTime: number;
  activityLevel: number;
  completionFlagHash: number;
  activityPower: number;
  minParty: number;
  maxParty: number;
  maxPlayers: number;
  destinationHash: number;
  placeHash: number;
  activityTypeHash: number;
  tier: number;
  pgcrImage: string;
  rewards: DestinyItemQuantity[];
  skulls: { displayName: string; description: string }[];
  isPlaylist: boolean;
  isMatchmade: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1ActivityTypeDefinition {
  activityTypeHash: number;
  identifier: string;
  activityTypeName: string;
  icon: string;
  activeBackgroundVirtualPath: string;
  completedBackgroundVirtualPath: string;
  hiddenOverrideVirtualPath: string;
  tooltipBackgroundVirtualPath: string;
  enlargedActiveBackgroundVirtualPath: string;
  enlargedCompletedBackgroundVirtualPath: string;
  enlargedHiddenOverrideVirtualPath: string;
  enlargedTooltipBackgroundVirtualPath: string;
  order: number;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1InventoryBucketDefinition {
  bucketHash: number;
  bucketName: string;
  bucketDescription: string;
  scope: number;
  category: number;
  bucketOrder: number;
  bucketIdentifier: string;
  itemCount: number;
  location: number;
  hasTransferDestination: boolean;
  enabled: boolean;
  fifo: boolean;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1RaceDefinition {
  raceHash: number;
  raceType: DestinyRace;
  raceName: string;
  raceNameMale: string;
  raceNameFemale: string;
  raceDescription: string;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1FactionDefinition {
  factionHash: number;
  factionName: string;
  factionDescription: string;
  factionIcon: string;
  progressionHash: number;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1VendorDefinition {
  summary: {
    vendorHash: number;
    vendorName: string;
    vendorDescription: string;
    vendorIcon: string;
    vendorOrder: number;
    factionName: string;
    factionIcon: string;
    factionHash: number;
    factionDescription: string;
    resetIntervalMinutes: number;
    resetOffsetMinutes: number;
    vendorIdentifier: string;
    positionX: number;
    positionY: number;
    transitionNodeIdentifier: string;
    visible: boolean;
    progressionHash: number;
    sellString: string;
    buyString: string;
    vendorPortrait: string;
    vendorBanner: string;
    unlockFlagHashes: number[];
    enabledUnlockFlagHashes: number[];
    mapSectionIdentifier: string;
    mapSectionName: string;
    mapSectionOrder: number;
    showOnMap: boolean;
    eventHash: number;
    vendorCategoryHash: number;
    vendorCategoryHashes: number[];
    vendorSubcategoryHash: number;
    inhibitBuying: boolean;
  };
  acceptedItems: never[];
  categories: {
    categoryHash: number;
    categoryIndex: number;
    displayTitle: string;
    overlayCurrencyItemHash: number;
    quantityAvailable: number;
    showUnavailableItems: boolean;
    hideIfNoCurrency: boolean;
    buyStringOverride: string;
    overlayTitle: string;
    overlayDescription: string;
    overlayChoice: string;
    overlayIcon: string;
    hasOverlay: boolean;
    hideFromRegularPurchase: boolean;
  }[];
  failureStrings: string[];
  sales: {
    priceOverride: boolean;
    itemHash: number;
    bucketHash: number;
    categoryHash: number;
    categoryIndex: number;
    quantityPurchased: number;
    licenseUnlockHash: number;
    currencies: [
      {
        itemHash: number;
        quantity: number;
      }
    ];
    price: number;
    currencyHash: number;
    hasCurrency: boolean;
    failureIndexes: number[];
    refundPolicy: number;
    refundLimit: number;
    seedOverride: number;
    weight: number;
    requiredLevel: number;
    creationLevel: number;
    saleItemIndex: number;
    originalCategoryIndex: number;
    minimumLevel: number;
    maximumLevel: number;
  }[];
  unlockValueHash: number;
  hash: number;
  index: number;
  redacted: boolean;
}

export interface D1CharacterResponse {
  character: {
    base: {
      backgroundPath: string;
      baseCharacterLevel: number;
      characterBase: {
        membershipId: string;
        membershipType: BungieMembershipType;
        classType: DestinyClass;
        characterId: string;
        dateLastPlayed: string;
        minutesPlayedThisSession: string;
        minutesPlayedTotal: string;
        powerLevel: number;
        raceHash: number;
        genderHash: number;
        genderType: DestinyGender;
        classHash: number;
        currentActivityHash: number;
        lastCompletedStoryHash: number;
        stats: {
          [statLabel: string]: D1Stat;
        };
        grimoireScore: number;
        peerView: { equipment: { itemHash: number }[] };
      };
      characterLevel: number;
      emblemHash: number;
      emblemPath: string;
      isPrestigeLevel: false;
      levelProgression: {
        dailyProgress: number;
        weeklyProgress: number;
        currentProgress: number;
        level: number;
        step: number;
      };
      percentToNextLevel: number;
      inventory: {
        buckets: {
          Currency: { items: D1ItemComponent[]; bucketHash: number }[];
          Invisible: { items: D1ItemComponent[]; bucketHash: number }[];
          Item: { items: D1ItemComponent[]; bucketHash: number }[];
        };
        currencies: { itemHash: number; value: number }[];
      };
    };
    progression: { progressions: never[] };
    advisors: any;
  };
  id: string;
  data: {
    buckets: { [key: string]: { items: D1ItemComponent[]; bucketHash: number }[] };
    currencies: { itemHash: number; value: number }[];
  };
}

export interface D1VaultResponse {
  id: 'vault';
  data: {
    buckets: { items: D1ItemComponent[]; bucketHash: number }[];
    currencies: { itemHash: number; value: number }[];
  };
}
