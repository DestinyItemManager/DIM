import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faClock } from 'app/shell/icons';
import { DestinyItemTooltipNotification } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import RichDestinyText from './RichDestinyText';

export function DestinyTooltipText({ item }: { item: DimItem }) {
  if (!item.tooltipNotifications) {
    return null;
  }
  return (
    <>
      {item.tooltipNotifications?.map((tip) => (
        <div
          key={tip.displayString}
          className={clsx('quest-expiration item-details', {
            'seasonal-expiration': isExpirationTooltip(tip),
          })}
        >
          {isExpirationTooltip(tip) && <AppIcon icon={faClock} />}
          <RichDestinyText text={tip.displayString} ownerId={item.owner} />
        </div>
      ))}
    </>
  );
}

export function isExpirationTooltip(tip: DestinyItemTooltipNotification) {
  return tip.displayStyle.endsWith('_expiration') || tip.displayStyle.endsWith('_seasonal');
}
