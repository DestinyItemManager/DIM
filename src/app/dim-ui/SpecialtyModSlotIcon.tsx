import { bungieBackgroundStyleAdvanced } from 'app/dim-ui/BungieImage';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getInterestingSocketMetadatas, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import clsx from 'clsx';
import { PressTip } from './PressTip';
import styles from './SpecialtyModSlotIcon.m.scss';

interface ModSlotIconProps {
  item: DimItem;
  className?: string;
  /**
   * if the icon will be displayed pretty small,
   * set this to true and the icon will zoom
   * to use less of its detail
   */
  lowRes?: boolean;
}

/**
 * if an item has specialty modslots, this returns one or
 * more elements wrapped in a fragment. they'll probably
 * need a flex/something wrapper to display right
 */
export function SpecialtyModSlotIcon({
  item,
  className,
  lowRes,
  excludeStandardD2ModSockets,
}: ModSlotIconProps & { excludeStandardD2ModSockets?: boolean }) {
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
        // TODO: Why not look this up through emptyPlugItemHash?
        const emptySlotItem = defs.InventoryItem.get(m.emptyModSocketHash);
        return (
          <PressTip minimal tooltip={emptySlotItem.itemTypeDisplayName} key={emptySlotItem.hash}>
            <div
              className={clsx(className, styles.specialtyModIcon, lowRes && styles.lowRes)}
              style={bungieBackgroundStyleAdvanced(
                emptySlotItem.displayProperties.icon,
                'linear-gradient(#000b, #000b)', // forced dark background to help w/ visibility
                2,
              )}
            />
          </PressTip>
        );
      })}
    </>
  );
}
