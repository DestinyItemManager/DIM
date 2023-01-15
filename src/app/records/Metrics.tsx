import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { ALL_TRAIT } from 'app/search/d2-known-values';
import _ from 'lodash';
import Metric from './Metric';
import styles from './Metrics.m.scss';
import { DimMetric } from './presentation-nodes';

export default function Metrics({ metrics }: { metrics: DimMetric[] }) {
  const defs = useD2Definitions()!;
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
      {Object.entries(groupedMetrics).map(([traitHash, metrics]) => (
        <div key={traitHash}>
          <div className={styles.title}>
            <BungieImage src={traits[traitHash].displayProperties.icon} />
            {traits[traitHash].displayProperties.name}
          </div>
          {metrics.map((metric) => (
            <Metric key={metric.metricDef.hash} metric={metric} />
          ))}
        </div>
      ))}
    </div>
  );
}
