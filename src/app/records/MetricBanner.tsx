import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { ALL_TRAIT } from 'app/search/d2-known-values';
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import masterworkOverlay from 'images/masterwork-metric.png';
import React from 'react';
import styles from './MetricBanner.m.scss';

interface Props {
  metricHash: number;
  className?: string;
  objectiveProgress: DestinyObjectiveProgress;
}

export default function MetricBanner({ metricHash, objectiveProgress, className }: Props) {
  const defs = useD2Definitions()!;
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
