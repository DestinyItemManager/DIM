import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import * as styles from './MetricCategories.m.scss';

export default function MetricCategories({
  availableMetricCategoryNodeHashes,
}: {
  availableMetricCategoryNodeHashes: number[];
}) {
  return (
    <ul className={styles.list}>
      {availableMetricCategoryNodeHashes.map((categoryHash) => (
        <MetricCategory key={categoryHash} categoryHash={categoryHash} />
      ))}
    </ul>
  );
}

function MetricCategory({ categoryHash }: { categoryHash: number }) {
  const defs = useD2Definitions()!;
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
