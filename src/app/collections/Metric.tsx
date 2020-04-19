import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  DestinyProfileResponse,
  DestinyMetricDefinition,
  DestinyMetricComponent
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import styles from './Metric.m.scss';
import clsx from 'clsx';
import MetricBanner from './MetricBanner';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { ObjectiveValue } from 'app/progress/Objective';

interface Props {
  metricHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}

export default function Metric({ metricHash, defs, profileResponse }: Props) {
  const metricDef = defs.Metric.get(metricHash);
  if (!metricDef) {
    return null;
  }
  const metric = getMetricComponent(metricDef, profileResponse);

  if (!metric) {
    return null;
  }

  const name = metricDef.displayProperties.name;
  const description = metricDef.displayProperties.description;

  const masterwork = metric.objectiveProgress.complete;

  const objectiveDef = defs.Objective.get(metric.objectiveProgress.objectiveHash);

  return (
    <div className={styles.metric}>
      <MetricBanner
        className={styles.icon}
        metricHash={metricHash}
        defs={defs}
        objectiveProgress={metric.objectiveProgress}
      />
      <div className={clsx(styles.header, { [styles.masterworked]: masterwork })}>
        <div className={styles.name}>{name}</div>
        <div className={styles.value}>
          <ObjectiveValue
            objectiveDef={objectiveDef}
            progress={metric.objectiveProgress.progress || 0}
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

export function getMetricComponent(
  metricDef: DestinyMetricDefinition,
  profileResponse: DestinyProfileResponse
): DestinyMetricComponent | undefined {
  return profileResponse.metrics.data?.metrics[metricDef.hash];
}
