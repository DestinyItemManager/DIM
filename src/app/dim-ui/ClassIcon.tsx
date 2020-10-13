import { AppIcon, globeIcon } from 'app/shell/icons';
import { dimHunterIcon, dimTitanIcon, dimWarlockIcon } from 'app/shell/icons/custom';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React from 'react';

const classIcons = {
  [DestinyClass.Hunter]: dimHunterIcon,
  [DestinyClass.Titan]: dimTitanIcon,
  [DestinyClass.Warlock]: dimWarlockIcon,
  [DestinyClass.Unknown]: globeIcon,
} as const;

/**
 * Displays a class icon given a class type.
 */
export default function ClassIcon({
  classType,
  className,
}: {
  classType: DestinyClass;
  className?: string;
}) {
  return <AppIcon icon={classIcons[classType]} className={className} />;
}
