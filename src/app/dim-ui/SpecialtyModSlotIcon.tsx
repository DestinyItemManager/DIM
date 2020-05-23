import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import React from 'react';
import { RootState } from 'app/store/reducers';
import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { connect } from 'react-redux';
import { getSpecialtySocket } from 'app/utils/item-utils';
import styles from './SpecialtyModSlotIcon.m.scss';

interface ProvidedProps {
  item: DimItem;
  className?: string;
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

function SpecialtyModSlotIcon({ item, className, defs }: Props) {
  const specialtySocket = getSpecialtySocket(item);
  const emptySlotHash = specialtySocket?.socketDefinition.singleInitialItemHash;
  const emptySlotIcon = emptySlotHash && defs.InventoryItem.get(emptySlotHash);
  return emptySlotIcon ? (
    <div
      className={`${className} ${styles.specialtyModIcon}`}
      title={emptySlotIcon.itemTypeDisplayName}
      style={bungieBackgroundStyle(
        emptySlotIcon.displayProperties.icon,
        'linear-gradient(#0005, #0005)' // forced dark background to help w/ visibility
      )}
    />
  ) : null;
}
export default connect<StoreProps>(mapStateToProps)(SpecialtyModSlotIcon);
