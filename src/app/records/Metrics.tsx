import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { TraitHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import Metric from './Metric';
import styles from './Metrics.m.scss';
import { DimMetric } from './presentation-nodes';

export default function Metrics({ metrics }: { metrics: DimMetric[] }) {
  const defs = useD2Definitions()!;
  const groupedMetrics = Object.groupBy(metrics, (metric) =>
    metric.metricDef.traitHashes.find((h) => h !== TraitHashes.All),
  );

  const traits = _.keyBy(
    Object.keys(groupedMetrics).map((th) => defs.Trait.get(Number(th))),
    (t) => t.hash,
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
