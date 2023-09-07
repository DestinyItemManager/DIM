import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import { isHarmonizable } from 'app/inventory/store/deepsight';
import { useD2Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { DEEPSIGHT_HARMONIZER } from 'app/search/d2-known-values';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's crafting pattern progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const record = item.patternUnlockRecord;
  const relevantObjectives = record?.objectives.filter((o) => !o.complete);

  const defs = useD2Definitions()!;
  const harmonizerIcon = defs.InventoryItem.get(DEEPSIGHT_HARMONIZER).displayProperties.icon;

  if (!relevantObjectives?.length) {
    return null;
  }

  const harmonizable = isHarmonizable(item);
  const harmonizerTooltipText = item.tooltipNotifications?.map((t) => t.displayString);
  const harmonizableTooltip = (
    <>
      <p>{harmonizerTooltipText}</p>
      <p>
        Filter with <code>deepsight:harmonizable</code>
      </p>
    </>
  );

  return (
    <div className={styles.deepsightProgress}>
      {relevantObjectives && relevantObjectives.length > 0 && (
        <>
          {harmonizable && harmonizable.length > 0 && (
            <PressTip tooltip={harmonizableTooltip} className={styles.deepsightHarmonizableIcon}>
              <BungieImage src={harmonizerIcon} />
            </PressTip>
          )}
          <div className={styles.deepsightProgressBar}>
            {relevantObjectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} showHidden />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
