import { D1ObjectiveDefinition, D1ObjectiveProgress } from 'app/destiny1/d1-manifest-types';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import {
  getValueStyle,
  isBooleanObjective,
  isFlawlessObjective,
  isRoundsWonObjective,
} from 'app/inventory/store/objectives';
import { useDefinitions } from 'app/manifest/selectors';
import { percent, percentWithSingleDecimal } from 'app/shell/formatters';
import { timerDurationFromMs } from 'app/utils/time';
import {
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import '../item-popup/ItemObjectives.scss';
import ObjectiveDescription from './ObjectiveDescription';

export default function Objective({
  objective,
  suppressObjectiveDescription,
  isTrialsPassage,
}: {
  objective: DestinyObjectiveProgress | D1ObjectiveProgress;
  suppressObjectiveDescription?: boolean;
  isTrialsPassage?: boolean;
}) {
  const defs = useDefinitions()!;
  const objectiveDef = defs.Objective.get(objective.objectiveHash);

  const progress = objective.progress || 0;

  if (!objectiveDef) {
    return null;
  }

  if (
    'minimumVisibilityThreshold' in objectiveDef &&
    objectiveDef.minimumVisibilityThreshold > 0 &&
    progress < objectiveDef.minimumVisibilityThreshold
  ) {
    return null;
  }

  // These two are to support D1 objectives
  const completionValue =
    'completionValue' in objective ? objective.completionValue : objectiveDef.completionValue;

  const complete = 'complete' in objective ? objective.complete : objective.isComplete;

  const progressDescription =
    // D1 display description
    ('displayDescription' in objectiveDef && objectiveDef.displayDescription) ||
    (!suppressObjectiveDescription &&
      'progressDescription' in objectiveDef &&
      objectiveDef.progressDescription) ||
    (complete ? t('Objectives.Complete') : t('Objectives.Incomplete'));

  const valueStyle = getValueStyle(objectiveDef, progress, completionValue);
  if (valueStyle === DestinyUnlockValueUIStyle.Integer) {
    return (
      <div className="objective-row">
        <div className="objective-integer">
          <ObjectiveDescription
            progressDescription={progressDescription}
            objectiveDef={objectiveDef}
          />
          <div className="objective-text">{progress.toLocaleString()}</div>
        </div>
      </div>
    );
  }

  const isBoolean = isBooleanObjective(objectiveDef, progress, completionValue);
  const showAsCounter = isTrialsPassage && isRoundsWonObjective(objective.objectiveHash);
  const passageFlawed =
    isTrialsPassage && isFlawlessObjective(objective.objectiveHash) && !complete;

  const classes = clsx('objective-row', {
    'objective-complete': complete && !showAsCounter,
    'objective-boolean': isBoolean,
    'passage-flawed': passageFlawed,
  });

  const progressBarStyle = {
    width: percent(progress / completionValue),
  };

  // TODO: green pips, red pips

  return (
    <div className={classes}>
      {!showAsCounter && <div className="objective-checkbox" />}
      <div className="objective-progress">
        {!isBoolean && <div className="objective-progress-bar" style={progressBarStyle} />}
        <div className="objective-description">
          <RichDestinyText text={progressDescription} />
        </div>
        {!isBoolean && (
          <div className="objective-text">
            <ObjectiveValue
              objectiveDef={objectiveDef}
              progress={progress}
              completionValue={completionValue}
            />
          </div>
        )}
      </div>
      {showAsCounter && <div className="objective-counter">{progress}</div>}
    </div>
  );
}

export function ObjectiveValue({
  objectiveDef,
  progress,
  completionValue = 0,
}: {
  objectiveDef: DestinyObjectiveDefinition | D1ObjectiveDefinition | undefined;
  progress: number;
  completionValue?: number;
}) {
  const valueStyle = getValueStyle(objectiveDef, progress, completionValue);

  // TODO: pips

  switch (valueStyle) {
    case DestinyUnlockValueUIStyle.DateTime:
      return <>{new Date(progress).toLocaleString()}</>;
    case DestinyUnlockValueUIStyle.Percentage:
      if (completionValue === 100) {
        return <>{percent(progress / completionValue)}</>;
      } else if (completionValue === 1000) {
        return <>{percentWithSingleDecimal(progress / completionValue)}</>;
      }
      break;
    case DestinyUnlockValueUIStyle.ExplicitPercentage:
      return <>{progress + '%'}</>;
    case DestinyUnlockValueUIStyle.FractionFloat:
      return <>{percent(progress * completionValue)}</>;
    case DestinyUnlockValueUIStyle.Multiplier:
      return <>{progress.toLocaleString() + '𝗑'}</>;
    case DestinyUnlockValueUIStyle.RawFloat:
      return <>{(progress / 100).toLocaleString()}</>;
    case DestinyUnlockValueUIStyle.TimeDuration:
      return <>{timerDurationFromMs(progress)}</>;
    case DestinyUnlockValueUIStyle.Checkbox:
    case DestinyUnlockValueUIStyle.Hidden:
      return null;
    default:
      break;
  }

  // Default
  return completionValue === 0 ||
    (objectiveDef &&
      'allowOvercompletion' in objectiveDef &&
      objectiveDef.allowOvercompletion &&
      completionValue === 1) ? (
    <>{progress.toLocaleString()}</>
  ) : (
    <>
      {progress.toLocaleString()}
      <wbr />/<wbr />
      {completionValue.toLocaleString()}
    </>
  );
}
