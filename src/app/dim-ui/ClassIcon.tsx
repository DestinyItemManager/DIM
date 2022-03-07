import { AppIcon, globeIcon, hunterIcon, titanIcon, warlockIcon } from 'app/shell/icons';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import hunter from 'destiny-icons/general/class_hunter_proportional.svg';
import titan from 'destiny-icons/general/class_titan_proportional.svg';
import warlock from 'destiny-icons/general/class_warlock_proportional.svg';
import React from 'react';

const classIcons = {
  [DestinyClass.Hunter]: hunterIcon,
  [DestinyClass.Titan]: titanIcon,
  [DestinyClass.Warlock]: warlockIcon,
  [DestinyClass.Unknown]: globeIcon,
} as const;

const classIconsProportional = {
  [DestinyClass.Hunter]: hunter,
  [DestinyClass.Titan]: titan,
  [DestinyClass.Warlock]: warlock,
} as const;

/**
 * Displays a class icon given a class type.
 */
export default function ClassIcon({
  classType,
  proportional,
  className,
}: {
  classType: DestinyClass;
  proportional?: boolean;
  className?: string;
}) {
  if (proportional && classIconsProportional[classType]) {
    return <img src={classIconsProportional[classType]} className={className} />;
  }
  return <AppIcon icon={classIcons[classType]} className={className} />;
}
