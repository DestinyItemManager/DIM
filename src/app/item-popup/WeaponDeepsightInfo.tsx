import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { DEEPSIGHT_HARMONIZER } from 'app/search/d2-known-values';
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
  const defs = useD2Definitions()!;
  const harmonizerIcon = defs.InventoryItem.get(DEEPSIGHT_HARMONIZER).displayProperties.icon;

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
                <BungieImage src={harmonizerIcon} />
              </div>
              <div>Deepsight harmonizer is available</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
