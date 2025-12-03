import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import BungieImage from 'app/dim-ui/BungieImage';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { Tooltip, useTooltipCustomization } from 'app/dim-ui/PressTip';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { getValueStyle } from 'app/inventory/store/objectives';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getDamageTypeForSubclassPlug } from 'app/inventory/subclass';
import PlugStackableIcon from 'app/loadout/plug-drawer/PlugStackableIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { isArmor2Mod } from 'app/utils/item-utils';
import { getDimPlugStats, getPlugDefStats, usePlugDescriptions } from 'app/utils/plug-descriptions';
import { isEnhancedPerk, isModCostVisible } from 'app/utils/socket-utils';
import WishListPerkThumb from 'app/wishlists/WishListPerkThumb';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import {
  DamageType,
  DestinyClass,
  DestinyObjectiveProgress,
  DestinyPlugItemCraftingRequirements,
  DestinyUnlockValueUIStyle,
  TierType,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import { TraitHashes } from 'data/d2/generated-enums';
import React, { useCallback } from 'react';
import { DimItem, DimPlug, PluggableInventoryItemDefinition } from '../inventory/item-types';
import Objective from '../progress/Objective';
import * as styles from './PlugTooltip.m.scss';

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

  const wishListTip = wishlistRoll?.wishListPerks.has(plug.plugDef.hash) ? (
    <WishListPerkThumb wishListRoll={wishlistRoll} legend />
  ) : undefined;

  const stats = getDimPlugStats(item, plug);

  // Only show Exotic catalyst requirements if the catalyst is incomplete. We assume
  // that an Exotic weapon can only be masterworked if its catalyst is complete.
  const hideRequirements =
    plug.plugDef.traitHashes?.includes(TraitHashes.ItemExoticCatalyst) && item.masterwork;

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

/**
 * Use this when all you have is a Definition. Otherwise use DimPlugTooltip
 */
export function PlugDefTooltip({
  def,
  classType,
  automaticallyPicked,
  disabledByAutoStatMods,
  item,
}: {
  def: PluggableInventoryItemDefinition;
  classType?: DestinyClass;
  automaticallyPicked?: boolean;
  disabledByAutoStatMods?: boolean;
  item?: DimItem;
}) {
  const stats = getPlugDefStats(def, classType, item);
  return (
    <PlugTooltip
      def={def}
      stats={stats}
      automaticallyPicked={automaticallyPicked}
      disabledByAutoStatMods={disabledByAutoStatMods}
    />
  );
}

/**
 * This creates a tooltip for a plug with various levels of content.
 *
 * It only relies on Bungie API entities, objects or primitives. This is so we can use it to render a
 * tooltip from either a DimPlug or a DestinyInventoryItemDefinition.
 */
function PlugTooltip({
  def,
  stats,
  plugObjectives,
  enableFailReasons,
  cannotCurrentlyRoll,
  unreliablePerkOption,
  wishListTip,
  automaticallyPicked,
  disabledByAutoStatMods,
  hideRequirements,
  craftingData,
}: {
  def: PluggableInventoryItemDefinition;
  stats?: { statHash: number; value: number }[];
  plugObjectives?: DestinyObjectiveProgress[];
  enableFailReasons?: string;
  cannotCurrentlyRoll?: boolean;
  unreliablePerkOption?: boolean;
  wishListTip?: React.ReactNode;
  automaticallyPicked?: boolean;
  disabledByAutoStatMods?: boolean;
  hideRequirements?: boolean;
  craftingData?: DestinyPlugItemCraftingRequirements;
}) {
  const defs = useD2Definitions();
  const statsArray = stats || [];
  const plugDescriptions = usePlugDescriptions(def, statsArray);
  const sourceString =
    defs && def.collectibleHash
      ? defs.Collectible.get(def.collectibleHash).sourceString
      : undefined;

  // filter out hidden objectives
  const filteredPlugObjectives = plugObjectives?.filter(
    (o) =>
      getValueStyle(defs?.Objective.get(o.objectiveHash), o.progress ?? 0, o.completionValue) !==
      DestinyUnlockValueUIStyle.Hidden,
  );

  const armorMod = isArmor2Mod(def);
  hideRequirements ||= armorMod;

  const bungieDescription =
    plugDescriptions.perks.length > 0 &&
    plugDescriptions.perks.map((perkDesc) => (
      <React.Fragment key={perkDesc.perkHash}>
        {perkDesc.name && !perkDesc.name.match(/^\+.*▲/m) && (
          <div className={styles.perkName}>{perkDesc.name}</div>
        )}
        {perkDesc.description && perkDesc.description !== perkDesc.name && (
          <RichDestinyText text={perkDesc.description} />
        )}
        {!hideRequirements && perkDesc.requirement && (
          <RichDestinyText text={perkDesc.requirement} className={styles.requirement} />
        )}
      </React.Fragment>
    ));
  const clarityDescriptionSection = plugDescriptions.communityInsight && (
    <Tooltip.Section className={styles.communityInsightSection}>
      <ClarityDescriptions
        perk={plugDescriptions.communityInsight}
        className={styles.clarityDescription}
      />
    </Tooltip.Section>
  );
  const renderedStats = statsArray.length > 0 && <PlugStats stats={statsArray} />;

  const isPluggable = isPluggableItem(def);
  const energyCost = isPluggable && isModCostVisible(def) ? def.plug.energyCost : null;
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
      [def.itemTypeDisplayName, energyCost?.energyCost],
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
            {armorMod && (
              <PlugStackableIcon
                descriptions={plugDescriptions}
                hash={def.hash}
                className={styles.stackable}
              />
            )}
          </Tooltip.Section>
          {clarityDescriptionSection}
        </>
      ) : (
        (clarityDescriptionSection || renderedStats) && (
          <>
            {clarityDescriptionSection}
            <Tooltip.Section>
              {renderedStats}
              {armorMod && (
                <PlugStackableIcon
                  descriptions={plugDescriptions}
                  hash={def.hash}
                  className={styles.stackable}
                />
              )}
            </Tooltip.Section>
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
      {disabledByAutoStatMods && (
        <Tooltip.Section className={styles.automaticallyPickedSection}>
          <p>{t('LoadoutBuilder.DisabledByAutoStatMods')}</p>
        </Tooltip.Section>
      )}
      {Boolean(wishListTip) && (
        <Tooltip.Section>
          <p>{wishListTip}</p>
        </Tooltip.Section>
      )}
    </>
  );
}

export function PlugStats({ stats }: { stats: { statHash: number; value: number }[] }) {
  return (
    <div className={styles.plugStats}>
      {stats.map((stat) => (
        <StatValue key={stat.statHash} statHash={stat.statHash} value={stat.value} />
      ))}
    </div>
  );
}

function StatValue({ value, statHash }: { value: number; statHash: number }) {
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
