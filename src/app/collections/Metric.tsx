import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  DestinyProfileResponse,
  DestinyMetricDefinition,
  DestinyMetricComponent
} from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import _ from 'lodash';
import Objective from 'app/progress/Objective';
import styles from './Metric.m.scss';

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

  console.log(metricScope);

  const bannerIcon = parentNode.displayProperties.icon;
  const scopeIcon = metricScope.displayProperties.iconSequences[0].frames[2];

  return (
    <div className={styles.metric}>
      <div className={styles.icon}>
        <BungieImage className={styles.bannerIcon} src={bannerIcon} />
        <BungieImage className={styles.scopeIcon} src={scopeIcon} />
        <BungieImage className={styles.metricIcon} src={metricIcon} />
      </div>
      <div>{name}</div>
      <div>{description && <p>{description}</p>}</div>
      <div>
        <Objective
          defs={defs}
          objective={metric.objectiveProgress}
          suppressObjectiveDescription={true}
        />
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
