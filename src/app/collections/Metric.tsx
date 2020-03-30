import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  DestinyProfileResponse,
  DestinyMetricDefinition,
  DestinyMetricComponent
} from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import _ from 'lodash';
import styles from './Metric.m.scss';
import masterworkOverlay from 'images/masterwork-metric.png';
import clsx from 'clsx';

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
  const metricIcon = metricDef.displayProperties.icon;

  const metricScope = metricDef.traitHashes
    .filter((h) => h !== 1434215347)
    .map((h) => defs.Trait.get(h))[0];
  const parentNode = defs.PresentationNode.get(metricDef.parentNodeHashes[0]);

  const bannerIcon = parentNode.displayProperties.icon;
  const scopeIcon = metricScope.displayProperties.iconSequences[0].frames[2];

  const masterwork = metric.objectiveProgress.complete;

  return (
    <div className={styles.metric}>
      <div className={styles.icon}>
        <BungieImage className={styles.bannerIcon} src={bannerIcon} />
        {masterwork && <img src={masterworkOverlay} className={styles.bannerIcon} loading="lazy" />}
        <BungieImage className={styles.scopeIcon} src={scopeIcon} />
        <BungieImage className={styles.metricIcon} src={metricIcon} />
      </div>
      <div className={clsx(styles.header, { [styles.masterworked]: masterwork })}>
        <div className={styles.name}>{name}</div>
        <div className={styles.value}>
          {(metric.objectiveProgress.progress || 0).toLocaleString()}
        </div>
      </div>

      <div>{description && <p>{description}</p>}</div>
    </div>
  );
}

export function getMetricComponent(
  metricDef: DestinyMetricDefinition,
  profileResponse: DestinyProfileResponse
): DestinyMetricComponent | undefined {
  return profileResponse.metrics.data?.metrics[metricDef.hash];
}
