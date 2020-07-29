import React from 'react';
import Metric from './Metric';
import _ from 'lodash';
import {
  DestinyPresentationNodeMetricChildEntry,
  DestinyProfileResponse,
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './Metrics.m.scss';
import BungieImage from 'app/dim-ui/BungieImage';
import { ALL_TRAIT } from 'app/search/d2-known-values';

export default function Metrics({
  metrics,
  defs,
  profileResponse,
}: {
  metrics: DestinyPresentationNodeMetricChildEntry[];
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}) {
  const groupedMetrics = _.groupBy(
    metrics.map((m) => m.metricHash),
    (metricHash) => {
      const metricDef = defs.Metric.get(metricHash);
      if (!metricDef) {
        return null;
      }
      return metricDef.traitHashes.filter((h) => h !== ALL_TRAIT)[0];
    }
  );

  const traits = _.keyBy(
    Object.keys(groupedMetrics).map((th) => defs.Trait.get(Number(th))),
    (t) => t.hash
  );

  return (
    <div className={styles.metrics}>
      {_.map(groupedMetrics, (metricHashes, traitHash) => (
        <div>
          <div className={styles.title}>
            <BungieImage src={traits[traitHash].displayProperties.icon} />
            {traits[traitHash].displayProperties.name}
          </div>
          {metricHashes.map((metricHash) => (
            <Metric
              key={metricHash}
              metricHash={metricHash}
              defs={defs}
              profileResponse={profileResponse}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
