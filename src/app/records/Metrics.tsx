import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import Metric from './Metric';
import styles from './Metrics.m.scss';
import { DimMetric, getMetricTimeScope } from './presentation-nodes';

export default function Metrics({ metrics }: { metrics: DimMetric[] }) {
  const defs = useD2Definitions()!;
  const groupedMetrics = Map.groupBy(metrics, (m) => getMetricTimeScope(defs, m.metricDef));

  return (
    <div className={styles.metrics}>
      {[...groupedMetrics.entries()].map(([trait, metrics]) => (
        <div key={trait.hash}>
          <div className={styles.title}>
            <BungieImage src={trait.displayProperties.icon} />
            {trait.displayProperties.name}
          </div>
          {metrics.map((metric) => (
            <Metric key={metric.metricDef.hash} metric={metric} />
          ))}
        </div>
      ))}
    </div>
  );
}
