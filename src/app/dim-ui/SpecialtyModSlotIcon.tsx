import { bungieBackgroundStyle, bungieBackgroundStyleAdvanced } from 'app/dim-ui/BungieImage';
import { DimItem, DimSocket } from 'app/inventory-stores/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getInterestingSocketMetadatas, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import clsx from 'clsx';
import React from 'react';
import PressTip from './PressTip';
import styles from './SpecialtyModSlotIcon.m.scss';

interface ModSlotIconProps {
  item: DimItem;
  className?: string;
  lowRes?: boolean;
}
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
        const emptySlotItem = defs.InventoryItem.get(m.emptyModSocketHash);
        return (
          <PressTip tooltip={emptySlotItem.itemTypeDisplayName} key={emptySlotItem.hash}>
            <div
              className={clsx(className, styles.specialtyModIcon, {
                [styles.lowRes]: lowRes,
              })}
              style={bungieBackgroundStyleAdvanced(
                emptySlotItem.displayProperties.icon,
                'linear-gradient(#000b, #000b)', // forced dark background to help w/ visibility
                2
              )}
            />
          </PressTip>
        );
      })}
    </>
  );
}

const armorSlotSpecificPlugCategoryIdentifier =
  /enhancements\.v2_(head|arms|chest|legs|class_item)/i;

/** verifies an item is d2 armor and has an armor slot specific mod socket, which is returned */
export const getArmorSlotSpecificModSocket: (item: DimItem) => DimSocket | undefined = (item) =>
  (item.bucket.inArmor &&
    item.sockets?.allSockets.find((socket) =>
      socket.plugged?.plugDef.plug.plugCategoryIdentifier.match(
        armorSlotSpecificPlugCategoryIdentifier
      )
    )) ||
  undefined;

/** this returns a string for easy printing purposes. '' if not found */
export const getArmorSlotSpecificModSocketDisplayName: (item: DimItem) => string = (item) =>
  getArmorSlotSpecificModSocket(item)?.plugged?.plugDef.itemTypeDisplayName || '';

export function ArmorSlotSpecificModSocketIcon({ item, className, lowRes }: ModSlotIconProps) {
  const defs = useD2Definitions()!;
  const foundSocket = getArmorSlotSpecificModSocket(item);
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  const emptySocketHash = foundSocket && foundSocket.socketDefinition.singleInitialItemHash;
  const emptySocketIcon = emptySocketHash && defs.InventoryItem.get(emptySocketHash);
  return emptySocketIcon ? (
    <PressTip elementType="span" tooltip={emptySocketIcon.itemTypeDisplayName}>
      <div
        className={`${className} ${styles.specialtyModIcon} ${lowRes ? styles.lowRes : ''}`}
        style={bungieBackgroundStyle(emptySocketIcon.displayProperties.icon)}
      />
    </PressTip>
  ) : null;
}
