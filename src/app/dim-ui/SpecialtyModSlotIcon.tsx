import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getInterestingSocketMetadatas, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import clsx from 'clsx';
import { PressTip } from './PressTip';
import styles from './SpecialtyModSlotIcon.m.scss';

/**
 * if an item has specialty modslots, this returns one or
 * more elements wrapped in a fragment. they'll probably
 * need a flex/something wrapper to display right
 */
export function SpecialtyModSlotIcon({
  item,
  className,
  excludeStandardD2ModSockets,
}: {
  item: DimItem;
  className?: string;
  excludeStandardD2ModSockets?: boolean;
}) {
  const defs = useD2Definitions()!;
  const modMetadatas = (
    excludeStandardD2ModSockets ? getInterestingSocketMetadatas : getSpecialtySocketMetadatas
  )(item);

  if (!modMetadatas) {
    return null;
  }
  return (
    <>
      {modMetadatas.map((m) => {
        const emptySlotItem = defs.InventoryItem.get(m.emptyModSocketHash);
        let background: string;
        if (m.milestoneHash) {
          const milestone = defs.Milestone.get(m.milestoneHash);
          background = milestone.displayProperties.icon;
        } else if (m.activityModeHash) {
          const activityMode = defs.ActivityMode.get(m.activityModeHash);
          background = activityMode.displayProperties.icon;
        } else if (m.iconHash) {
          const icon = defs.Icon.get(m.iconHash);
          background = icon.foreground;
        } else {
          background = emptySlotItem.displayProperties.icon;
        }
        return (
          <PressTip
            minimal
            tooltip={emptySlotItem.itemTypeDisplayName}
            key={emptySlotItem.hash}
            className={clsx(className, styles.specialtyModIcon)}
            style={bungieBackgroundStyle(background)}
          />
        );
      })}
    </>
  );
}
