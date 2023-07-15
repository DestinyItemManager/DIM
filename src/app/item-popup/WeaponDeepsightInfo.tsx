import { DimItem } from 'app/inventory/item-types';
import Objective from 'app/progress/Objective';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's crafting pattern progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const record = item.patternUnlockRecord;
  const relevantObjectives = record?.objectives.filter((o) => !o.complete);

  if (!relevantObjectives?.length) {
    return null;
  }

  return (
    <div className={styles.deepsightProgress}>
      {relevantObjectives && relevantObjectives.length > 0 && (
        <div className={styles.deepsightProgressSection}>
          {relevantObjectives.map((objective) => (
            <Objective key={objective.objectiveHash} objective={objective} showHidden />
          ))}
        </div>
      )}
    </div>
  );
}
