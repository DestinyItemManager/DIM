import React from 'react';
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import _ from 'lodash';
import styles from './MetricBanner.m.scss';
import masterworkOverlay from 'images/masterwork-metric.png';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import clsx from 'clsx';
import { ALL_TRAIT } from 'app/search/d2-known-values';

interface Props {
  metricHash: number;
  className?: string;
  defs: D2ManifestDefinitions;
  objectiveProgress: DestinyObjectiveProgress;
}

export default function MetricBanner({ metricHash, defs, objectiveProgress, className }: Props) {
  const metricDef = defs.Metric.get(metricHash);
  if (!metricDef) {
    return null;
  }
  const metricIcon = metricDef.displayProperties.icon;

  const metricScope = metricDef.traitHashes
    .filter((h) => h !== ALL_TRAIT)
    .map((h) => defs.Trait.get(h))[0];
  const parentNode = defs.PresentationNode.get(metricDef.parentNodeHashes[0]);

  const bannerIcon = parentNode.displayProperties.icon;
  const scopeIcon = metricScope.displayProperties.iconSequences[0].frames[2];

  const masterwork = objectiveProgress.complete;

  return (
    <div className={clsx(className, styles.icon)}>
      <BungieImage className={styles.bannerIcon} src={bannerIcon} />
      {masterwork && <img src={masterworkOverlay} className={styles.bannerIcon} loading="lazy" />}
      <BungieImage className={styles.scopeIcon} src={scopeIcon} />
      <BungieImage className={styles.metricIcon} src={metricIcon} />
    </div>
  );
}
