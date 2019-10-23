import { t } from 'app/i18next-t';
import React from 'react';
import './ItemSockets.scss';
import Objective from '../progress/Objective';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D2Item, DimPlug } from '../inventory/item-types';
import BestRatedIcon from './BestRatedIcon';
import BungieImage from 'app/dim-ui/BungieImage';
import { InventoryCuratedRoll } from 'app/wishlists/wishlists';
import idx from 'idx';
import _ from 'lodash';
import { statWhiteList } from 'app/inventory/store/stats';

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
    item.masterworkInfo.statHash &&
    plug.plugItem.investmentStats &&
    plug.plugItem.investmentStats.some(
      (stat) =>
        stat.value > 0 &&
        stat.statTypeHash &&
        item.masterworkInfo &&
        item.masterworkInfo.statHash === stat.statTypeHash
    ) &&
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
      {defs && Boolean(idx(plug, (p) => p.plugItem.investmentStats.length)) && (
        <div className="plug-stats">
          {plug.stats &&
            _.sortBy(Object.keys(plug.stats), (h) => statWhiteList.indexOf(parseInt(h, 10))).map(
              (statHash) => (
                <StatValue
                  key={statHash + '_'}
                  statHash={parseInt(statHash, 10)}
                  value={plug.stats![statHash]}
                  defs={defs}
                />
              )
            )}
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

function StatValue({
  value,
  statHash,
  defs
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
