import { t } from 'app/i18next-t';
import { DimCrafted } from 'app/inventory/item-types';
import { percent, percentWithSingleDecimal } from 'app/shell/formatters';

/**
 * A progress bar that shows weapon crafting info like the game does.
 */
export function WeaponCraftedInfo({
  craftInfo,
  className,
}: {
  craftInfo: DimCrafted;
  className: string;
}) {
  const progress = craftInfo.progress || 0;
  const progressBarStyle = {
    // can't use percentWithSingleDecimal because the decimal separator is locale-dependent (can be `.` or `,`)
    width: percent(progress),
  };

  return (
    <div className={className}>
      <div className="objective-progress">
        <div className="objective-progress-bar" style={progressBarStyle} />
        <div className="objective-description">
          {t('MovePopup.WeaponLevel', { level: craftInfo.level })}
        </div>
        <div className="objective-text">{percentWithSingleDecimal(progress)}</div>
      </div>
    </div>
  );
}
