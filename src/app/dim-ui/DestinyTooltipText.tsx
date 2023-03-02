import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faClock } from 'app/shell/icons';
import { DestinyItemTooltipNotification } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import shapedIcon from 'images/shaped.png';
import RichDestinyText from './destiny-symbols/RichDestinyText';
import styles from './DestinyTooltipText.m.scss';

export function DestinyTooltipText({ item }: { item: DimItem }) {
  if (!item.tooltipNotifications) {
    return null;
  }
  return (
    <>
      {item.tooltipNotifications.map((tip) => (
        <div
          key={tip.displayString}
          className={clsx('quest-expiration item-details', {
            [styles.seasonalExpiration]: isExpirationTooltip(tip),
          })}
        >
          {isExpirationTooltip(tip) && <AppIcon icon={faClock} />}
          {isPatternTooltip(tip) && (
            <img className={styles.shapedIcon} src={shapedIcon} height={12} width={12} alt="" />
          )}
          <RichDestinyText text={tip.displayString} ownerId={item.owner} />
        </div>
      ))}
    </>
  );
}

function isExpirationTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle.endsWith('_expiration') || tip.displayStyle.endsWith('_seasonal');
}

function isPatternTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle === 'ui_display_style_deepsight';
}
