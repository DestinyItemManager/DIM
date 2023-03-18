import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { Tooltip, useTooltipCustomization } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { resonantElementObjectiveHashes } from 'app/inventory/store/deepsight';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getStatSortOrder, isAllowedStat } from 'app/inventory/store/stats';
import { getDamageTypeForSubclassPlug } from 'app/inventory/subclass';
import { useD2Definitions } from 'app/manifest/selectors';
import { EXOTIC_CATALYST_TRAIT } from 'app/search/d2-known-values';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { isPlugStatActive } from 'app/utils/item-utils';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import { isEnhancedPerk, isModCostVisible } from 'app/utils/socket-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import {
  DamageType,
  DestinyInventoryItemDefinition,
  DestinyObjectiveProgress,
  DestinyPlugItemCraftingRequirements,
  TierType,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback } from 'react';
import { DimItem, DimPlug } from '../inventory/item-types';
import Objective from '../progress/Objective';
import './ItemSockets.scss';
import styles from './PlugTooltip.m.scss';

function isVisibleStat(item: DimItem, plug: DimPlug, statHash: number) {
  return (
    isAllowedStat(statHash) &&
    // Stats are only shown if the item can actually benefit from them
    item.stats?.some((stat) => stat.statHash === statHash) &&
    isPlugStatActive(
      item,
      plug.plugDef,
      statHash,
      Boolean(
        plug.plugDef.investmentStats.find((s) => s.statTypeHash === Number(statHash))
          ?.isConditionallyActive
      )
    )
  );
}
// TODO: Connect this to redux
export function DimPlugTooltip({
  item,
  plug,
  wishlistRoll,
  craftingData,
}: {
  item: DimItem;
  plug: DimPlug;
  wishlistRoll?: InventoryWishListRoll;
  craftingData?: DestinyPlugItemCraftingRequirements;
}) {
  // TODO: show insertion costs

  const wishListTip = wishlistRoll?.wishListPerks.has(plug.plugDef.hash)
    ? t('WishListRoll.BestRatedTip', { count: wishlistRoll.wishListPerks.size })
    : undefined;

  const visibleStats = plug.stats
    ? _.sortBy(
        Object.keys(plug.stats)
          .map((statHashStr) => parseInt(statHashStr, 10))
          .filter((statHash) => isVisibleStat(item, plug, statHash)),
        getStatSortOrder
      )
    : [];
  const stats: { [statHash: string]: number } = {};

  for (const statHash of visibleStats) {
    const value = plug.stats?.[statHash];
    if (value) {
      stats[statHash] = value;
    }
  }

  // Only show Exotic catalyst requirements if the catalyst is incomplete. We assume
  // that an Exotic weapon can only be masterworked if its catalyst is complete.
  const hideRequirements =
    plug.plugDef.traitHashes?.includes(EXOTIC_CATALYST_TRAIT) && item.masterwork;

  // The PlugTooltip does all the rendering and layout, we just process information here.
  return (
    <PlugTooltip
      def={plug.plugDef}
      stats={stats}
      plugObjectives={plug.plugObjectives}
      enableFailReasons={plug.enableFailReasons}
      cannotCurrentlyRoll={plug.cannotCurrentlyRoll}
      unreliablePerkOption={plug.unreliablePerkOption}
      wishListTip={wishListTip}
      hideRequirements={hideRequirements}
      craftingData={craftingData}
    />
  );
}

export interface ExtraPlugTooltipInfo {
  stats?: { [statHash: string]: number };
  plugObjectives?: DestinyObjectiveProgress[];
  enableFailReasons?: string;
  cannotCurrentlyRoll?: boolean;
  unreliablePerkOption?: boolean;
  wishListTip?: string;
  automaticallyPicked?: boolean;
  hideRequirements?: boolean;
  craftingData?: DestinyPlugItemCraftingRequirements;
}

/**
 * This creates a tooltip for a plug with various levels of content.
 *
 * It only relies on Bungie API entities, objects or primitives. This is so we can use it to render a
 * tooltip from either a DimPlug or a DestinyInventoryItemDefinition.
 *
 * Use this directly if you want to render a tooltip for a DestinyInventoryItemDefinition, only the def
 * prop is required.
 */
export function PlugTooltip({
  def,
  stats,
  plugObjectives,
  enableFailReasons,
  cannotCurrentlyRoll,
  unreliablePerkOption,
  wishListTip,
  automaticallyPicked,
  hideRequirements,
  craftingData,
}: {
  def: DestinyInventoryItemDefinition;
} & ExtraPlugTooltipInfo) {
  const defs = useD2Definitions();
  const statsArray =
    (stats &&
      Object.entries(stats).map(([statHash, value]) => ({
        value,
        statHash: parseInt(statHash, 10),
      }))) ||
    [];

  // HACK Loadout plugs operate on defs very often and they show their stats via perks,
  // which are handled below. But the number of fragment slots is just a direct stat.
  const aspectCapacityStat = def.investmentStats?.find(
    (stat) => stat.statTypeHash === StatHashes.AspectEnergyCapacity
  );
  if (aspectCapacityStat) {
    statsArray.push({
      statHash: aspectCapacityStat.statTypeHash,
      value: aspectCapacityStat.value,
    });
  }

  const plugDescriptions = usePlugDescriptions(def, statsArray);
  const sourceString =
    defs && def.collectibleHash && defs.Collectible.get(def.collectibleHash).sourceString;

  // filter out plug objectives related to Resonant Elements
  const filteredPlugObjectives = plugObjectives?.filter(
    (o) => !resonantElementObjectiveHashes.includes(o.objectiveHash)
  );

  const bungieDescription =
    plugDescriptions.perks.length > 0 &&
    plugDescriptions.perks.map((perkDesc) => (
      <div key={perkDesc.perkHash}>
        {perkDesc.name && <div className={styles.perkName}>{perkDesc.name}</div>}
        {perkDesc.description && <RichDestinyText text={perkDesc.description} />}
        {!hideRequirements && perkDesc.requirement && (
          <RichDestinyText text={perkDesc.requirement} className={styles.requirement} />
        )}
      </div>
    ));
  const clarityDescriptionSection = plugDescriptions.communityInsight && (
    <Tooltip.Section className={styles.communityInsightSection}>
      <ClarityDescriptions
        perk={plugDescriptions.communityInsight}
        className={styles.clarityDescription}
      />
    </Tooltip.Section>
  );
  const renderedStats = statsArray.length > 0 && (
    <div className="plug-stats">
      {statsArray.map((stat) => (
        <StatValue key={stat.statHash} statHash={stat.statHash} value={stat.value} />
      ))}
    </div>
  );

  const isPluggable = isPluggableItem(def);
  const energyCost = isPluggable && isModCostVisible(def.plug) ? def.plug.energyCost : null;
  const subclassDamageType = isPluggable && getDamageTypeForSubclassPlug(def);

  const isInTooltip = useTooltipCustomization({
    getHeader: useCallback(() => def.displayProperties.name, [def.displayProperties.name]),
    getSubheader: useCallback(
      () => (
        <div className={styles.subheader}>
          <span>{def.itemTypeDisplayName}</span>
          {energyCost?.energyCost !== undefined && energyCost.energyCost > 0 && (
            <span className={styles.energyCost}>
              <EnergyCostIcon className={styles.elementIcon} />
              {energyCost.energyCost}
            </span>
          )}
        </div>
      ),
      [def.itemTypeDisplayName, energyCost]
    ),
    className: clsx(styles.tooltip, {
      [styles.tooltipExotic]: def.inventory?.tierType === TierType.Exotic,
      [styles.tooltipEnhanced]:
        enhancedIntrinsics.has(def.hash) || (isPluggable && isEnhancedPerk(def)),
      [styles.tooltipElementArc]: subclassDamageType === DamageType.Arc,
      [styles.tooltipElementSolar]: subclassDamageType === DamageType.Thermal,
      [styles.tooltipElementVoid]: subclassDamageType === DamageType.Void,
      [styles.tooltipElementStasis]: subclassDamageType === DamageType.Stasis,
      [styles.tooltipElementStrand]: subclassDamageType === DamageType.Strand,
    }),
  });

  return (
    <>
      {!isInTooltip && <h2>{def.displayProperties.name}</h2>}

      {/*
        If we're displaying the Bungie description, display the stats in the same section as the Bungie
        description. If we're not displaying the Bungie description, display the stats in a separate section
        after the community description.
      */}
      {bungieDescription ? (
        <>
          <Tooltip.Section>
            {bungieDescription}
            {renderedStats}
          </Tooltip.Section>
          {clarityDescriptionSection}
        </>
      ) : (
        (clarityDescriptionSection || renderedStats) && (
          <>
            {clarityDescriptionSection}
            <Tooltip.Section>{renderedStats}</Tooltip.Section>
          </>
        )
      )}

      <Tooltip.Section>
        {Boolean(sourceString) && <div className={styles.source}>{sourceString}</div>}
        {!hideRequirements &&
          defs &&
          filteredPlugObjectives &&
          filteredPlugObjectives.length > 0 && (
            <div className={styles.objectives}>
              {filteredPlugObjectives.map((objective) => (
                <Objective key={objective.objectiveHash} objective={objective} />
              ))}
            </div>
          )}
        {enableFailReasons && <p>{enableFailReasons}</p>}
      </Tooltip.Section>

      {craftingData && (
        <Tooltip.Section className={styles.craftingRequirementsSection}>
          {craftingData.unlockRequirements.map((r) => (
            <p key={r.failureDescription}>{r.failureDescription}</p>
          ))}
          {defs &&
            craftingData.materialRequirementHashes.length > 0 &&
            craftingData.materialRequirementHashes.flatMap((h) => {
              const materialRequirement = defs?.MaterialRequirementSet.get(h).materials;
              return materialRequirement.map((m) => {
                if (!m.countIsConstant || m.omitFromRequirements) {
                  return null;
                }
                const itemName = defs.InventoryItem.get(m.itemHash).displayProperties.name;
                return (
                  <div key={`${m.itemHash}-${m.count}`}>
                    <b>{m.count}</b> {itemName}
                  </div>
                );
              });
            })}
        </Tooltip.Section>
      )}
      {cannotCurrentlyRoll && (
        <Tooltip.Section className={styles.cannotRollSection}>
          <p>{t('MovePopup.CannotCurrentlyRoll')}</p>
        </Tooltip.Section>
      )}
      {unreliablePerkOption && (
        <Tooltip.Section className={styles.cannotRollSection}>
          <p>{t('MovePopup.UnreliablePerkOption')}</p>
        </Tooltip.Section>
      )}
      {automaticallyPicked && (
        <Tooltip.Section className={styles.automaticallyPickedSection}>
          <p>{t('LoadoutBuilder.AutomaticallyPicked')}</p>
        </Tooltip.Section>
      )}
      {wishListTip && (
        <Tooltip.Section>
          <p>
            <AppIcon className="thumbs-up" icon={thumbsUpIcon} /> = {wishListTip}
          </p>
        </Tooltip.Section>
      )}
    </>
  );
}

export function StatValue({ value, statHash }: { value: number; statHash: number }) {
  const defs = useD2Definitions()!;
  const statDef = defs.Stat.get(statHash);
  if (!statDef?.displayProperties.name) {
    return null;
  }
  return (
    <>
      <div>
        {value < 0 ? '' : '+'}
        {value}
      </div>
      <div>
        {statDef.displayProperties.hasIcon && (
          <BungieImage height={16} width={16} src={statDef.displayProperties.icon} />
        )}
        {statDef.displayProperties.name}
      </div>
    </>
  );
}
