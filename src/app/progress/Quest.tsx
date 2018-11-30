import { DestinyItemComponent, DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import Objective from './Objective';
import { Reward } from './Reward';
import { t } from 'i18next';
import MilestoneDisplay from './MilestoneDisplay';
import Countdown from '../dim-ui/Countdown';
import * as _ from 'lodash';
import { D2SupplementalManifestDefinitions } from './D2SupplementalManifestDefinitions';
import { SupplementalObjectives } from './SupplementalObjectives';

interface QuestProps {
  defs: D2ManifestDefinitions;
  item: DestinyItemComponent;
  objectives: DestinyObjectiveProgress[];
}

export default function Quest(props: QuestProps) {
  const { defs, item, objectives } = props;

  const itemDef = defs.InventoryItem.get(item.itemHash);

  const percentComplete = _.sumBy(objectives, (objective) => {
    if (objective.completionValue) {
      return Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length;
    } else {
      return 0;
    }
  });

  const rewards = itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : [];

  const progress = (
    <>
      {percentComplete > 0 && <span>{Math.min(100, Math.round(percentComplete * 100))}%</span>}
      {itemDef.inventory.maxStackSize > 1 && <span>{item.quantity}</span>}
    </>
  );

  const expired = item.expirationDate
    ? new Date(item.expirationDate).getTime() < Date.now()
    : false;
  const complete = percentComplete >= 1;
  const suppressExpiration = itemDef.inventory.suppressExpirationWhenObjectivesComplete && complete;

  return (
    <MilestoneDisplay displayProperties={itemDef.displayProperties} progress={progress}>
      {item.expirationDate && !suppressExpiration && (
        <div className="quest-expiration">
          {expired ? (
            itemDef.inventory.expiredInActivityMessage
          ) : (
            <>
              {t('Progress.QuestExpires')} <Countdown endTime={new Date(item.expirationDate)} />
            </>
          )}
        </div>
      )}
      <div className="quest-objectives">
        {objectives.map((objective) => (
          <Objective defs={defs} objective={objective} key={objective.objectiveHash} />
        ))}
        {SupplementalObjectives.get(item.itemHash).map((objective) => (
          <Objective
            defs={D2SupplementalManifestDefinitions}
            objective={objective}
            key={objective.objectiveHash}
          />
        ))}
      </div>
      {rewards.map((reward) => (
        <Reward key={reward.itemHash} reward={reward} defs={defs} />
      ))}
    </MilestoneDisplay>
  );
}
