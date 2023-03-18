import { AppIcon, globeIcon, hunterIcon, titanIcon, warlockIcon } from 'app/shell/icons';
import dimHunterProportionalIcon from 'app/shell/icons/custom/HunterProportional';
import dimTitanProportionalIcon from 'app/shell/icons/custom/TitanProportional';
import dimWarlockProportionalIcon from 'app/shell/icons/custom/WarlockProportional';
import { DestinyClass } from 'bungie-api-ts/destiny2';

const classIcons = {
  [DestinyClass.Hunter]: hunterIcon,
  [DestinyClass.Titan]: titanIcon,
  [DestinyClass.Warlock]: warlockIcon,
  [DestinyClass.Unknown]: globeIcon,
  [-1]: globeIcon,
} as const;

const classIconsProportional = {
  [DestinyClass.Hunter]: dimHunterProportionalIcon,
  [DestinyClass.Titan]: dimTitanProportionalIcon,
  [DestinyClass.Warlock]: dimWarlockProportionalIcon,
  [DestinyClass.Unknown]: globeIcon,
  [-1]: globeIcon,
} as const;

/**
 * Displays a class icon given a class type.
 */
export default function ClassIcon({
  classType,
  proportional,
  className,
}: {
  classType: DestinyClass | -1;
  proportional?: boolean;
  className?: string;
}) {
  return (
    <AppIcon
      icon={(proportional ? classIconsProportional : classIcons)[classType]}
      className={className}
    />
  );
}
