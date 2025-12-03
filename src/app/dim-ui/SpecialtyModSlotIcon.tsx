import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { artificeDisplayStub } from 'app/search/specialty-modslots';
import { getSpecialtySocketMetadata, isArtifice } from 'app/utils/item-utils';
import clsx from 'clsx';
import { PressTip } from './PressTip';
import * as styles from './SpecialtyModSlotIcon.m.scss';

/**
 * if an item has specialty modslots, this returns one or
 * more elements wrapped in a fragment. they'll probably
 * need a flex/something wrapper to display right
 */
export function SpecialtyModSlotIcon({ item, className }: { item: DimItem; className?: string }) {
  const defs = useD2Definitions()!;
  const modMetadata = isArtifice(item) ? artificeDisplayStub : getSpecialtySocketMetadata(item);
  if (!modMetadata) {
    return null;
  }
  return (
    <>
      {modMetadata &&
        ((m) => {
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
        })(modMetadata)}
    </>
  );
}
