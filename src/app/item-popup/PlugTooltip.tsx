import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import { statAllowList } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { emptySpecialtySocketHashes, isPlugStatActive } from 'app/utils/item-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import {
  DestinyInventoryItemDefinition,
  DestinyObjectiveProgress,
  DestinySandboxPerkDefinition,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { DimItem, DimPlug } from '../inventory/item-types';
import Objective from '../progress/Objective';
import './ItemSockets.scss';

// TODO: Connect this to redux
export default function PlugTooltip({
  item,
  plug,
  wishlistRoll,
}: {
  item: DimItem;
  plug: DimPlug;
  wishlistRoll?: InventoryWishListRoll;
}) {
  // TODO: show insertion costs
  const defs = useD2Definitions();

  const wishListTip = wishlistRoll?.wishListPerks.has(plug.plugDef.hash)
    ? t('WishListRoll.BestRatedTip', { count: wishlistRoll.wishListPerks.size })
    : undefined;

  const visibleStats = plug.stats
    ? _.sortBy(Object.keys(plug.stats), (h) => statAllowList.indexOf(parseInt(h, 10))).filter(
        (statHash) =>
          isPlugStatActive(
            item,
            plug.plugDef.hash,
            Number(statHash),
            Boolean(
              plug.plugDef.investmentStats.find((s) => s.statTypeHash === Number(statHash))
                ?.isConditionallyActive
            )
          )
      )
    : [];

  const stats: { [statHash: string]: number } = {};

  for (const statHash of visibleStats) {
    const value = plug.stats?.[parseInt(statHash, 10)];
    if (typeof value === 'number') {
      stats[statHash] = value;
    }
  }

  return (
    <PlugTooltipContent
      defs={defs}
      def={plug.plugDef}
      perks={plug.perks}
      stats={stats}
      plugObjectives={plug.plugObjectives}
      enableFailReasons={plug.enableFailReasons}
      cannotCurrentlyRoll={plug.cannotCurrentlyRoll}
      wishListTip={wishListTip}
    />
  );
}

export function PlugTooltipContent({
  defs,
  def,
  perks,
  stats,
  plugObjectives,
  enableFailReasons,
  cannotCurrentlyRoll,
  wishListTip,
}: {
  defs: D2ManifestDefinitions | undefined;
  def: DestinyInventoryItemDefinition;
  perks: DestinySandboxPerkDefinition[];
  stats?: { [statHash: string]: number };
  plugObjectives?: DestinyObjectiveProgress[];
  enableFailReasons?: string;
  cannotCurrentlyRoll?: boolean;
  wishListTip?: string;
}) {
  const sourceString =
    defs && def.collectibleHash && defs.Collectible.get(def.collectibleHash).sourceString;

  return (
    <>
      <h2>{def.displayProperties.name}</h2>
      {emptySpecialtySocketHashes.includes(def.hash) && <h3>{def.itemTypeDisplayName}</h3>}

      {def.displayProperties.description ? (
        <div>
          <RichDestinyText text={def.displayProperties.description} />
        </div>
      ) : (
        perks.map((perk) => (
          <div key={perk.hash}>
            {def.displayProperties.name !== perk.displayProperties.name && (
              <div>{perk.displayProperties.name}</div>
            )}
            <div>
              <RichDestinyText text={perk.displayProperties.description} />
            </div>
          </div>
        ))
      )}
      {sourceString && <div className="plug-source">{sourceString}</div>}
      {stats && Object.entries(stats).length > 0 && (
        <div className="plug-stats">
          {Object.entries(stats).map(([statHash, value]) => (
            <StatValue key={statHash} statHash={parseInt(statHash, 10)} value={value} />
          ))}
        </div>
      )}
      {defs && plugObjectives && plugObjectives.length > 0 && (
        <div className="plug-objectives">
          {plugObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} />
          ))}
        </div>
      )}
      {enableFailReasons && <p>{enableFailReasons}</p>}
      {cannotCurrentlyRoll && <p>{t('MovePopup.CannotCurrentlyRoll')}</p>}
      {wishListTip && (
        <p>
          <AppIcon className="thumbs-up" icon={thumbsUpIcon} /> = {wishListTip}
        </p>
      )}
    </>
  );
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
