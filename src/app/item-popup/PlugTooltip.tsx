import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import { CommunityInsight, useCommunityInsight } from 'app/clarity/hooks';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import { resonantElementObjectiveHashes } from 'app/inventory/store/deepsight';
import { statAllowList } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { Settings } from 'app/settings/initial-settings';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { isPlugStatActive } from 'app/utils/item-utils';
import { getPerkDescriptions } from 'app/utils/socket-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import {
  DestinyInventoryItemDefinition,
  DestinyObjectiveProgress,
  DestinyPlugItemCraftingRequirements,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { DimItem, DimPlug } from '../inventory/item-types';
import Objective from '../progress/Objective';
import './ItemSockets.scss';
import styles from './PlugTooltip.m.scss';

// TODO: Connect this to redux
export function DimPlugTooltip({
  item,
  plug,
  wishlistRoll,
  hidePlugSubtype,
  craftingData,
}: {
  item: DimItem;
  plug: DimPlug;
  wishlistRoll?: InventoryWishListRoll;
  hidePlugSubtype?: boolean;
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
          .filter(
            (statHash) =>
              statAllowList.includes(statHash) &&
              isPlugStatActive(
                item,
                plug.plugDef.hash,
                statHash,
                Boolean(
                  plug.plugDef.investmentStats.find((s) => s.statTypeHash === Number(statHash))
                    ?.isConditionallyActive
                )
              )
          ),
        (h) => statAllowList.indexOf(h)
      )
    : [];

  const stats: { [statHash: string]: number } = {};

  for (const statHash of visibleStats) {
    const value = plug.stats?.[statHash];
    if (value) {
      stats[statHash] = value;
    }
  }

  // The PlugTooltip does all the rendering and layout, we just process information here.
  return (
    <PlugTooltip
      def={plug.plugDef}
      stats={stats}
      plugObjectives={plug.plugObjectives}
      enableFailReasons={plug.enableFailReasons}
      cannotCurrentlyRoll={plug.cannotCurrentlyRoll}
      wishListTip={wishListTip}
      hidePlugSubtype={hidePlugSubtype}
      craftingData={craftingData}
    />
  );
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
  wishListTip,
  hidePlugSubtype,
  craftingData,
}: {
  def: DestinyInventoryItemDefinition;
  stats?: { [statHash: string]: number };
  plugObjectives?: DestinyObjectiveProgress[];
  enableFailReasons?: string;
  cannotCurrentlyRoll?: boolean;
  wishListTip?: string;
  hidePlugSubtype?: boolean;
  craftingData?: DestinyPlugItemCraftingRequirements;
}) {
  const defs = useD2Definitions();
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  const communityInsight = useCommunityInsight(def.hash);
  const sourceString =
    defs && def.collectibleHash && defs.Collectible.get(def.collectibleHash).sourceString;

  // filter out plug objectives related to Resonant Elements
  const filteredPlugObjectives = plugObjectives?.filter(
    (o) => !resonantElementObjectiveHashes.includes(o.objectiveHash)
  );

  const plugDescriptions = buildPlugDescriptions(
    def,
    defs,
    descriptionsToDisplay,
    communityInsight
  );
  const clarityDescription = plugDescriptions.communityInsight && (
    <ClarityDescriptions
      communityInsight={plugDescriptions.communityInsight.description}
      className={clsx(styles.clarityDescription, {
        [styles.clarityDescriptionCommunityOnly]: plugDescriptions.communityInsight.communityOnly,
      })}
    />
  );
  const renderedStats = stats && Object.entries(stats).length > 0 && (
    <div className="plug-stats">
      {Object.entries(stats).map(([statHash, value]) => (
        <StatValue key={statHash} statHash={parseInt(statHash, 10)} value={value} />
      ))}
    </div>
  );

  return (
    <>
      <h2>{def.displayProperties.name}</h2>
      {!hidePlugSubtype && def.itemTypeDisplayName && <h3>{def.itemTypeDisplayName}</h3>}

      {/*
        If we're displaying the Bungie description, display the stats between the Bungie description and
        community description. If we're not displaying the Bungie description, display the stats after the
        community insight.
      */}
      {plugDescriptions.description || clarityDescription}
      {renderedStats}
      {plugDescriptions.description && clarityDescription}

      {sourceString && <div>{sourceString}</div>}
      {defs && filteredPlugObjectives && filteredPlugObjectives.length > 0 && (
        <div className={styles.objectives}>
          {filteredPlugObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} />
          ))}
        </div>
      )}
      {enableFailReasons && <p>{enableFailReasons}</p>}
      {craftingData && (
        <>
          {craftingData.unlockRequirements.map((r) => (
            <p key={r.failureDescription}>
              <b>{r.failureDescription}</b>
            </p>
          ))}
          {defs &&
            craftingData.materialRequirementHashes.length &&
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
        </>
      )}
      {cannotCurrentlyRoll && <p>{t('MovePopup.CannotCurrentlyRoll')}</p>}
      {wishListTip && (
        <p>
          <AppIcon className="thumbs-up" icon={thumbsUpIcon} /> = {wishListTip}
        </p>
      )}
    </>
  );
}

function buildPlugDescriptions(
  plugDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions | undefined,
  descriptionsToDisplay: Settings['descriptionsToDisplay'],
  communityInsight: CommunityInsight | undefined
) {
  const perkDescriptions = (defs && getPerkDescriptions(plugDef, defs)) || [];

  const showBungieDescription =
    !$featureFlags.clarityDescriptions || descriptionsToDisplay !== 'community';
  const showCommunityDescription =
    $featureFlags.clarityDescriptions && descriptionsToDisplay !== 'bungie';
  const showCommunityDescriptionOnly =
    $featureFlags.clarityDescriptions && descriptionsToDisplay === 'community';

  return {
    description: (showBungieDescription || (showCommunityDescriptionOnly && !communityInsight)) && (
      <>
        {perkDescriptions.map((perkDesc) => (
          <div key={perkDesc.perkHash}>
            {perkDesc.name && <div>{perkDesc.name}</div>}
            <RichDestinyText text={perkDesc.description || perkDesc.requirement} />
          </div>
        ))}
      </>
    ),
    communityInsight: showCommunityDescription &&
      communityInsight && {
        description: communityInsight,
        communityOnly: showCommunityDescriptionOnly,
      },
  };
}

export function StatValue({ value, statHash }: { value: number; statHash: number }) {
  const defs = useD2Definitions()!;
  const statDef = defs.Stat.get(statHash);
  if (!statDef || !statDef.displayProperties.name) {
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
