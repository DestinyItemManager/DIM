import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
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
  const harmonizerIcon = defs.InventoryItem.get(DEEPSIGHT_HARMONIZER)?.displayProperties.icon;

  if (!relevantObjectives?.length) {
    return null;
  }

  const harmonizable = isHarmonizable(item);

  return (
    <div className={styles.deepsightProgress}>
      {relevantObjectives && relevantObjectives.length > 0 && (
        <>
          {harmonizable ? (
            <PressTip
              tooltip={harmonizableTooltipContent(item)}
              className={styles.deepsightHarmonizableIcon}
            >
              <BungieImage src={harmonizerIcon} />
            </PressTip>
          ) : (
            <div className="objective-checkbox" />
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

function harmonizableTooltipContent(item: DimItem) {
  const harmonizableTooltipText = item.tooltipNotifications?.map((t) => t.displayString);
  const harmonizableTooltip = (
    <>
      <p>{harmonizableTooltipText}</p>
      <p>
        {t('Filter.FilterWith')} <code>deepsight:harmonizable</code>
      </p>
    </>
  );

  return harmonizableTooltip;
}
