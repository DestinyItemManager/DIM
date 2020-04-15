import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import MetricBanner from 'app/collections/MetricBanner';
import BungieImage from 'app/dim-ui/BungieImage';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './EmblemPreview.m.scss';

export default function EmblemPreview({
  item,
  defs
}: {
  item: DimItem;
  defs: D2ManifestDefinitions;
}) {
  const metricDef = item.metricObjective && item.metricHash && defs.Metric.get(item.metricHash);
  const parentPresentationNode =
    metricDef && defs.PresentationNode.get(metricDef.parentNodeHashes[0]);
  const trait =
    metricDef && defs.Trait.get(metricDef.traitHashes[metricDef.traitHashes.length - 1]);

  return (
    <div className={styles.container}>
      {item.metricObjective && item.metricHash && (
        <MetricBanner
          className={styles.banner}
          defs={defs}
          metricHash={item.metricHash}
          objectiveProgress={item.metricObjective}
        />
      )}
      {item.metricObjective && (
        <div className={styles.value}>{(item.metricObjective.progress || 0).toLocaleString()}</div>
      )}
      <BungieImage src={item.secondaryIcon} width="237" height="48" />
      {parentPresentationNode && metricDef && trait && (
        <div>
          {trait.displayProperties.name}
          {' // '}
          {parentPresentationNode.displayProperties.name}
          {' // '}
          {metricDef.displayProperties.name}
        </div>
      )}
    </div>
  );
}
