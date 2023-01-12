import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { ObjectiveValue } from 'app/progress/Objective';
import clsx from 'clsx';
import styles from './Metric.m.scss';
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

  return (
    <div className={styles.metric}>
      <MetricBanner
        className={styles.icon}
        metricHash={metricHash}
        objectiveProgress={metricComponent.objectiveProgress}
      />
      <div className={clsx(styles.header, { [styles.masterworked]: masterwork })}>
        <div className={styles.name}>{name}</div>
        <div className={styles.value}>
          <ObjectiveValue
            objectiveDef={objectiveDef}
            progress={metricComponent.objectiveProgress.progress || 0}
          />
        </div>
      </div>

      <div>
        {description && (
          <p className={styles.description}>
            <RichDestinyText text={description} />
          </p>
        )}
      </div>
    </div>
  );
}
