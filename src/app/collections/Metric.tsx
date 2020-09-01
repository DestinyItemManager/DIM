import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import _ from 'lodash';
import styles from './Metric.m.scss';
import clsx from 'clsx';
import MetricBanner from './MetricBanner';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { ObjectiveValue } from 'app/progress/Objective';
import { DimMetric } from './presentation-nodes';

interface Props {
  metric: DimMetric;
  defs: D2ManifestDefinitions;
}

export default function Metric({ metric, defs }: Props) {
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
        defs={defs}
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
            <RichDestinyText text={description} defs={defs} />
          </p>
        )}
      </div>
    </div>
  );
}
