import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieBackgroundStyle, bungieBackgroundStyleAdvanced } from 'app/dim-ui/BungieImage';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { RootState } from 'app/store/types';
import { getSpecialtySocketMetadata, modMetadataByTag } from 'app/utils/item-utils';
import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';
import PressTip from './PressTip';
import styles from './SpecialtyModSlotIcon.m.scss';

interface ProvidedProps {
  item: DimItem;
  className?: string;
  lowRes?: boolean;
  showAllSupportedSeasons?: boolean;
}
interface StoreProps {
  defs: D2ManifestDefinitions;
}
function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!,
  });
}
type Props = ProvidedProps & StoreProps;

function SpecialtyModSlotIcon({ item, className, lowRes, defs, showAllSupportedSeasons }: Props) {
  const { emptyModSocketHash, compatibleTags } = getSpecialtySocketMetadata(item) ?? {};
  if (!emptyModSocketHash || !compatibleTags) {
    return null;
  }
  const emptySlotHashes = showAllSupportedSeasons
    ? compatibleTags.map((tag) => modMetadataByTag[tag]!.emptyModSocketHash)
    : [emptyModSocketHash];
  const emptySlotItems = emptySlotHashes.map((hash) => defs.InventoryItem.get(hash));
  return (
    <>
      {emptySlotItems.map((emptySlotItem) => {
        const isMainSlotType = emptySlotItem.hash === emptyModSocketHash;
        return (
          <PressTip tooltip={emptySlotItem.itemTypeDisplayName} key={emptySlotItem.hash}>
            <div
              className={clsx(className, styles.specialtyModIcon, {
                [styles.lowRes]: lowRes,
                [styles.secondarySeason]: !isMainSlotType,
              })}
              style={bungieBackgroundStyleAdvanced(
                emptySlotItem.displayProperties.icon,
                'linear-gradient(#0005, #0005)', // forced dark background to help w/ visibility
                isMainSlotType ? 2 : 1
              )}
            />
          </PressTip>
        );
      })}
    </>
  );
}
export default connect<StoreProps>(mapStateToProps)(SpecialtyModSlotIcon);

const armorSlotSpecificPlugCategoryIdentifier = /enhancements\.v2_(head|arms|chest|legs|class_item)/i;

/** verifies an item is d2 armor and has an armor slot specific mod socket, which is returned */
export const getArmorSlotSpecificModSocket: (item: DimItem) => DimSocket | undefined = (item) =>
  (item.isDestiny2() &&
    item.bucket.inArmor &&
    item.sockets?.allSockets.find((socket) =>
      socket?.plugged?.plugDef?.plug.plugCategoryIdentifier.match(
        armorSlotSpecificPlugCategoryIdentifier
      )
    )) ||
  undefined;

/** this returns a string for easy printing purposes. '' if not found */
export const getArmorSlotSpecificModSocketDisplayName: (item: DimItem) => string = (item) =>
  getArmorSlotSpecificModSocket(item)?.plugged?.plugDef.itemTypeDisplayName || '';

function disconnectedArmorSlotSpecificModSocketIcon({ item, className, lowRes, defs }: Props) {
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
export const ArmorSlotSpecificModSocketIcon = connect<StoreProps>(mapStateToProps)(
  disconnectedArmorSlotSpecificModSocketIcon
);
