import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { ObjectiveValue } from 'app/progress/Objective';
import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import * as styles from './Metric.m.scss';
import MetricBanner from './MetricBanner';
import { DimMetric } from './presentation-nodes';

interface Props {
  metric: DimMetric;
}

export default function Metric({ metric }: Props) {
  const defs = useD2Definitions()!;
  const { metricDef, metricComponent } = metric;
  const metricHash = metricDef.hash;

  const name = metricDef.displayProperties.name;
  const description = metricDef.displayProperties.description;

  const masterwork = metricComponent.objectiveProgress.complete;

  const objectiveDef = defs.Objective.get(metricComponent.objectiveProgress.objectiveHash);
  const completionValue = objectiveDef?.completionValue ?? 0;
  const hasGoal =
    completionValue > 0 &&
    !(
      objectiveDef &&
      'allowOvercompletion' in objectiveDef &&
      objectiveDef.allowOvercompletion &&
      completionValue === 1
    );

  const progress = metricComponent.objectiveProgress.progress || 0;

  return (
    <div
      className={clsx(styles.metric, {
        [styles.completed]: masterwork,
        [styles.hasProgressBar]: hasGoal,
      })}
    >
      <MetricBanner
        className={styles.icon}
        metricHash={metricHash}
        objectiveProgress={metricComponent.objectiveProgress}
      />
      <div className={styles.info}>
        <div className={clsx(styles.value, { [styles.masterworked]: masterwork })}>
          <ObjectiveValue objectiveDef={objectiveDef} progress={progress} />
          {hasGoal && (
            <div className={styles.goal}>
              / <ObjectiveValue objectiveDef={objectiveDef} progress={completionValue} />
            </div>
          )}
        </div>
        <div className={clsx(styles.name, { [styles.masterworked]: masterwork })}>{name}</div>
        {description && (
          <p className={styles.description}>
            <RichDestinyText text={description} />
          </p>
        )}
      </div>
      {hasGoal && (
        <div className={clsx(styles.progressBar, { [styles.complete]: masterwork })}>
          {!masterwork && (
            <div
              className={styles.progressFill}
              style={{ width: percent(progress / completionValue) }}
            />
          )}
        </div>
      )}
    </div>
  );
}
