import { t } from 'app/i18next-t';
import React from 'react';
import './ItemSockets.scss';
import Objective from '../progress/Objective';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimPlug } from '../inventory/item-types';
import BestRatedIcon from './BestRatedIcon';

// TODO: Connect this to redux
export default function PlugTooltip({
  item,
  plug,
  defs,
  curationEnabled,
  bestPerks
}: {
  item: D2Item;
  plug: DimPlug;
  defs?: D2ManifestDefinitions;
  curationEnabled?: boolean;
  bestPerks: Set<number>;
}) {
  // TODO: show insertion costs

  return (
    <>
      <h2>
        {plug.plugItem.displayProperties.name}
        {item.masterworkInfo &&
          plug.plugItem.investmentStats &&
          plug.plugItem.investmentStats[0] &&
          item.masterworkInfo.statHash === plug.plugItem.investmentStats[0].statTypeHash &&
          ` (${item.masterworkInfo.statName})`}
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
      {defs && plug.plugObjectives.length > 0 && (
        <div className="plug-objectives">
          {plug.plugObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} defs={defs} />
          ))}
        </div>
      )}
      {plug.enableFailReasons && <div>{plug.enableFailReasons}</div>}
      {bestPerks.has(plug.plugItem.hash) && (
        <div className="best-rated-tip">
          <BestRatedIcon curationEnabled={curationEnabled} /> = {t('DtrReview.BestRatedTip')}
        </div>
      )}
    </>
  );
}
