import { DimItem } from 'app/inventory/item-types';
import Objective from 'app/progress/Objective';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's crafting pattern progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const record = item.patternUnlockRecord;
  const relevantObjectives = record?.objectives.filter((o) => !o.complete);

  const isHarmonizable = item.sockets?.allSockets.filter(
    (s) =>
      s.plugged?.plugDef.plug.plugCategoryHash ===
        PlugCategoryHashes.CraftingPlugsWeaponsModsExtractors && s.visibleInGame
  );

  if (!relevantObjectives?.length) {
    return null;
  }

  return (
    <div className={styles.deepsightProgress}>
      {relevantObjectives && relevantObjectives.length > 0 && (
        <>
          <div className={styles.deepsightProgressSection}>
            {relevantObjectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} showHidden />
            ))}
          </div>
          {isHarmonizable && isHarmonizable.length > 0 && (
            <div className={styles.deepsightHarmonizableSection}>
              <div className={styles.harmonizableIcon}>
                <img src="https://www.bungie.net/common/destiny2_content/icons/e816fd6ecf653de012dfc52087d8d1d9.jpg" />
              </div>
              <div>Deepsight harmonizer is available</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
