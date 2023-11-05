import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getCraftedSocket } from 'app/inventory/store/crafted';
import { KillTrackerInfo } from 'app/item-popup/KillTracker';
import Objective from 'app/progress/Objective';
import { percent, percentWithSingleDecimal } from 'app/shell/formatters';
import { AppIcon, shapedIcon } from 'app/shell/icons';
import { filterMap } from 'app/utils/collections';
import { isKillTrackerSocket, plugToKillTracker } from 'app/utils/item-utils';
import styles from './WeaponCraftedInfo.m.scss';

/**
 * A progress bar that shows weapon crafting info like the game does.
 */
export function WeaponCraftedInfo({ item, className }: { item: DimItem; className: string }) {
  if (!item.crafted || !item.craftedInfo) {
    return null;
  }
  const progress = item.craftedInfo.progress;
  const progressBarStyle = {
    // can't use percentWithSingleDecimal because the decimal separator is locale-dependent (can be `.` or `,`)
    width: percent(progress),
  };

  return (
    <div className={className}>
      {item.craftedInfo && <CraftedDataMedallion item={item} />}
      <div className="objective-progress">
        <div className="objective-progress-bar" style={progressBarStyle} />
        <div className="objective-description">
          {t('MovePopup.WeaponLevel', { level: item.craftedInfo.level })}
        </div>
        <div className="objective-text">{percentWithSingleDecimal(progress)}</div>
      </div>
    </div>
  );
}

function CraftedDataMedallion({ item }: { item: DimItem }) {
  const killTrackers = filterMap(
    item.sockets?.allSockets.find((s) => isKillTrackerSocket(s))?.plugOptions ?? [],
    (p) => plugToKillTracker(p),
  );
  const shapedDateObjective = getCraftedSocket(item)?.plugged?.plugObjectives.find(
    (o) => o.progress === item.craftedInfo?.craftedDate,
  );

  return (
    <PressTip
      tooltip={
        <>
          {shapedDateObjective && (
            <>
              <Objective objective={shapedDateObjective} />
              <hr />
            </>
          )}
          {killTrackers.map((kt) => (
            <KillTrackerInfo
              key={kt?.trackerDef.hash}
              tracker={kt}
              showTextLabel
              className="masterwork-progress"
            />
          ))}
        </>
      }
    >
      <AppIcon className={styles.patternIcon} icon={shapedIcon} />
    </PressTip>
  );
}
