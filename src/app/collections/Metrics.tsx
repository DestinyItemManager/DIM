import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { ALL_TRAIT } from 'app/search/d2-known-values';
import _ from 'lodash';
import React from 'react';
import Metric from './Metric';
import styles from './Metrics.m.scss';
import { DimMetric } from './presentation-nodes';

export default function Metrics({
  metrics,
  defs,
}: {
  metrics: DimMetric[];
  defs: D2ManifestDefinitions;
}) {
  const groupedMetrics = _.groupBy(
    metrics,
    (metric) => metric.metricDef.traitHashes.filter((h) => h !== ALL_TRAIT)[0]
  );

  const traits = _.keyBy(
    Object.keys(groupedMetrics).map((th) => defs.Trait.get(Number(th))),
    (t) => t.hash
  );

  return (
    <div className={styles.metrics}>
      {_.map(groupedMetrics, (metrics, traitHash) => (
        <div>
          <div className={styles.title}>
            <BungieImage src={traits[traitHash].displayProperties.icon} />
            {traits[traitHash].displayProperties.name}
          </div>
          {metrics.map((metric) => (
            <Metric key={metric.metricDef.hash} metric={metric} defs={defs} />
          ))}
        </div>
      ))}
    </div>
  );
}
