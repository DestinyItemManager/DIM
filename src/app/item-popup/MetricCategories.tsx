import React from 'react';
import BungieImage from 'app/dim-ui/BungieImage';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './MetricCategories.m.scss';

export default function MetricCategories({
  availableMetricCategoryNodeHashes,
  defs
}: {
  availableMetricCategoryNodeHashes: number[];
  defs: D2ManifestDefinitions;
}) {
  return (
    <ul className={styles.list}>
      {availableMetricCategoryNodeHashes.map((categoryHash) => (
        <MetricCategory key={categoryHash} categoryHash={categoryHash} defs={defs} />
      ))}
    </ul>
  );
}

function MetricCategory({
  categoryHash,
  defs
}: {
  categoryHash: number;
  defs: D2ManifestDefinitions;
}) {
  const presentationNode = defs.PresentationNode.get(categoryHash);
  return (
    <li>
      <BungieImage
        className={styles.icon}
        src={presentationNode.displayProperties.iconSequences[0].frames[2]}
      />
      {presentationNode.displayProperties.name}
    </li>
  );
}
