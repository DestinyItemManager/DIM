import {
  BungieMembershipType,
  DamageType,
  DestinyClass,
  DestinyInventoryItemStatDefinition,
  DestinyItemSubType,
  DestinyItemType,
  DestinyObjectiveProgress,
  DestinyProgressionScope,
  DestinyProgressionStepDefinition,
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
  isActive: false;
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
  primaryStat: D1Stat;
  canEquip: boolean;
  equipRequiredLevel: number;
  unlockFlagHashRequiredToEquip: number;
  cannotEquipReason: number;
  damageType: DamageType;
  damageTypeHash: number;
  damageTypeNodeIndex: number;
  damageTypeStepIndex: number;
  progression: {
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
  objectives: DestinyObjectiveProgress[];
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
    exclusiveSetRequiredHash: 0;
  };
  canActivateNextStep: false;
  nextStepIndex: number;
  isNextStepRandom: true;
  perkHashes: [];
  startProgressionBarAtProgress: number;
  statHashes: number[];
  affectsQuality: false;
  stepGroups: DestinyTalentNodeStepGroups;
  trueStepIndex: number;
  truePropertyIndex: number;
  affectsLevel: false;
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
