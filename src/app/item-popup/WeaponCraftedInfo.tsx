import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getCraftedSocket } from 'app/inventory/store/crafted';
import { KillTrackerInfo } from 'app/item-popup/KillTracker';
import Objective, {
  ObjectiveDescription,
  ObjectiveProgress,
  ObjectiveProgressBar,
  ObjectiveText,
} from 'app/progress/Objective';
import { percentWithSingleDecimal } from 'app/shell/formatters';
import { AppIcon, enhancedIcon, shapedIcon } from 'app/shell/icons';
import { filterMap } from 'app/utils/collections';
import { isKillTrackerSocket, plugToKillTracker } from 'app/utils/item-utils';
import * as styles from './WeaponCraftedInfo.m.scss';

/**
 * A progress bar that shows weapon crafting info like the game does.
 */
export function WeaponCraftedInfo({ item, className }: { item: DimItem; className: string }) {
  if (!item.crafted || !item.craftedInfo) {
    return null;
  }
  const progress = item.craftedInfo.progress;

  let desc = t('MovePopup.WeaponLevel', { level: item.craftedInfo.level });
  if (item.craftedInfo?.enhancementTier > 0) {
    desc = `${t('MovePopup.EnhancementTier', { tier: item.craftedInfo?.enhancementTier })} - ${desc}`;
  }

  return (
    <div className={className}>
      {item.craftedInfo && <CraftedDataMedallion item={item} />}
      <ObjectiveProgress>
        <ObjectiveProgressBar progress={progress} completionValue={1} />
        <ObjectiveDescription description={desc} />
        <ObjectiveText>{percentWithSingleDecimal(progress)}</ObjectiveText>
      </ObjectiveProgress>
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
      <AppIcon
        className={styles.patternIcon}
        icon={item.crafted === 'enhanced' ? enhancedIcon : shapedIcon}
      />
    </PressTip>
  );
}
