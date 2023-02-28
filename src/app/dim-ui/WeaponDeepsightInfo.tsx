import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import Objective, { ObjectiveValue } from 'app/progress/Objective';
import { faCheck } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { DestinyRecordComponent } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import BungieImage from './BungieImage';
import { PressTip, Tooltip } from './PressTip';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const deepsightInfo = item.deepsightInfo;
  const record = item.patternUnlockRecord;
  const relevantObjectives = record?.objectives.filter((o) => !o.complete);

  if (!deepsightInfo && !relevantObjectives?.length) {
    return null;
  }

  return (
    <div className={styles.deepsightProgress}>
      {deepsightInfo ? (
        <>
          <PatternUnlockedIndicator record={record} />
          <div className={styles.deepsightProgressSection}>
            <Objective objective={deepsightInfo.attunementObjective} showHidden />
          </div>
        </>
      ) : (
        relevantObjectives &&
        relevantObjectives.length > 0 && (
          <div className={styles.deepsightProgressSection}>
            {relevantObjectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} showHidden />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function PatternUnlockedIndicator({ record }: { record: DestinyRecordComponent | undefined }) {
  const defs = useD2Definitions()!;
  const weaponPatternIcon = defs.InventoryItem.get(3131030715)?.displayProperties.icon;

  if (!record) {
    return null;
  }

  let allObjectivesComplete = true;
  const tootipContent = (
    <>
      <Tooltip.Header text={t('MovePopup.CraftingPattern')} />
      {record.objectives.map((objective) => {
        // check objectives' status while we are already looping this
        allObjectivesComplete &&= objective.complete;
        return <Objective key={objective.objectiveHash} objective={objective} />;
      })}
    </>
  );
  return (
    <PressTip
      className={clsx(styles.patternProgress, styles.deepsightProgressSection)}
      tooltip={tootipContent}
    >
      <BungieImage className={styles.patternIcon} src={weaponPatternIcon} />
      <span>
        {allObjectivesComplete ? (
          <AppIcon className={styles.patternOwned} icon={faCheck} />
        ) : (
          <>
            {record.objectives.map((o) => (
              <ObjectiveValue
                key={o.objectiveHash}
                objectiveDef={defs.Objective.get(o.objectiveHash)}
                progress={o.progress!}
                completionValue={o.completionValue}
              />
            ))}
          </>
        )}
      </span>
    </PressTip>
  );
}
