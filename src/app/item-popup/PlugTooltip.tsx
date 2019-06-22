import { t } from 'app/i18next-t';
import React from 'react';
import './ItemSockets.scss';
import Objective from '../progress/Objective';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimPlug } from '../inventory/item-types';
import BestRatedIcon from './BestRatedIcon';
import { DestinyItemInvestmentStatDefinition } from 'bungie-api-ts/destiny2';
import BungieImage from 'app/dim-ui/BungieImage';
import { InventoryCuratedRoll } from 'app/curated-rolls/curatedRollService';

// TODO: Connect this to redux
export default function PlugTooltip({
  item,
  plug,
  defs,
  curationEnabled,
  inventoryCuratedRoll,
  bestPerks
}: {
  item: D2Item;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
  bestPerks: Set<number>;
}) {
  // TODO: show insertion costs

  // display perk's synergy with masterwork stat
  const synergyStat =
    item.masterworkInfo &&
    plug.plugItem.investmentStats &&
    item.masterworkInfo.statHash &&
    plug.plugItem.investmentStats.some((stat) => {
      return (
        stat.value > 0 &&
        stat.statTypeHash &&
        item.masterworkInfo &&
        item.masterworkInfo.statHash === stat.statTypeHash
      );
    }) &&
    ` (${item.masterworkInfo.statName})`;

  return (
    <>
      <h2>
        {plug.plugItem.displayProperties.name}
        {synergyStat}
      </h2>

      {plug.plugItem.displayProperties.description ? (
        <div>{plug.plugItem.displayProperties.description}</div>
      ) : (
        plug.perks.map((perk) => (
          <div key={perk.hash}>
            {plug.plugItem.displayProperties.name !== perk.displayProperties.name && (
              <div>{perk.displayProperties.name}</div>
            )}
            <div>{perk.displayProperties.description}</div>
          </div>
        ))
      )}
      {defs && plug.plugItem.investmentStats.length > 0 && (
        <div className="plug-stats">
          {plug.plugItem.investmentStats.map((stat) => (
            <Stat key={stat.statTypeHash} stat={stat} defs={defs} />
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

      {(!curationEnabled || !inventoryCuratedRoll) && bestPerks.has(plug.plugItem.hash) && (
        <>
          <BestRatedIcon curationEnabled={curationEnabled} /> = {t('DtrReview.BestRatedTip')}
        </>
      )}
      {curationEnabled &&
        inventoryCuratedRoll &&
        inventoryCuratedRoll.curatedPerks.has(plug.plugItem.hash) && (
          <>
            <BestRatedIcon curationEnabled={curationEnabled} /> = {t('CuratedRoll.BestRatedTip')}
          </>
        )}
    </>
  );
}

function Stat({
  stat,
  defs
}: {
  stat: DestinyItemInvestmentStatDefinition;
  defs: D2ManifestDefinitions;
}) {
  if (stat.value === 0) {
    return null;
  }
  const statDef = defs.Stat.get(stat.statTypeHash);
  if (!statDef || !statDef.displayProperties.name) {
    return null;
  }
  return (
    <>
      <div>
        {stat.value < 0 ? '' : '+'}
        {stat.value}
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
