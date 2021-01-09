import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import { statAllowList } from 'app/inventory/store/stats';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { emptySpecialtySocketHashes, isPlugStatActive } from 'app/utils/item-utils';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import _ from 'lodash';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem, DimPlug } from '../inventory/item-types';
import Objective from '../progress/Objective';
import './ItemSockets.scss';

// TODO: Connect this to redux
export default function PlugTooltip({
  item,
  plug,
  defs,
  wishlistRoll,
}: {
  item: DimItem;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
  wishlistRoll?: InventoryWishListRoll;
}) {
  // TODO: show insertion costs

  const sourceString =
    defs &&
    plug.plugDef.collectibleHash &&
    defs.Collectible.get(plug.plugDef.collectibleHash).sourceString;

  const wishListTip =
    wishlistRoll?.wishListPerks.has(plug.plugDef.hash) &&
    t('WishListRoll.BestRatedTip', { count: wishlistRoll.wishListPerks.size });

  return (
    <>
      <h2>{plug.plugDef.displayProperties.name}</h2>
      {emptySpecialtySocketHashes.includes(plug.plugDef.hash) && (
        <h3>{plug.plugDef.itemTypeDisplayName}</h3>
      )}

      {plug.plugDef.displayProperties.description ? (
        <div>
          <RichDestinyText text={plug.plugDef.displayProperties.description} defs={defs} />
        </div>
      ) : (
        plug.perks.map((perk) => (
          <div key={perk.hash}>
            {plug.plugDef.displayProperties.name !== perk.displayProperties.name && (
              <div>{perk.displayProperties.name}</div>
            )}
            <div>
              <RichDestinyText text={perk.displayProperties.description} defs={defs} />
            </div>
          </div>
        ))
      )}
      {sourceString && <div className="plug-source">{sourceString}</div>}
      {defs && Boolean(plug?.plugDef?.investmentStats?.length) && (
        <div className="plug-stats">
          {plug.stats &&
            _.sortBy(Object.keys(plug.stats), (h) => statAllowList.indexOf(parseInt(h, 10)))
              .filter((statHash) =>
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
              .map((statHash) => (
                <StatValue
                  key={statHash + '_'}
                  statHash={parseInt(statHash, 10)}
                  value={plug.stats![statHash]}
                  defs={defs}
                />
              ))}
        </div>
      )}
      {defs && plug.plugObjectives.length > 0 && (
        <div className="plug-objectives">
          {plug.plugObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} defs={defs} />
          ))}
        </div>
      )}
      {plug.enableFailReasons && <div>{plug.enableFailReasons}</div>}

      {wishListTip && (
        <p>
          <AppIcon className="thumbs-up" icon={thumbsUpIcon} /> = {wishListTip}
        </p>
      )}
    </>
  );
}

export function StatValue({
  value,
  statHash,
  defs,
}: {
  value: number;
  statHash: number;
  defs: D2ManifestDefinitions;
}) {
  if (value === 0) {
    return null;
  }
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
