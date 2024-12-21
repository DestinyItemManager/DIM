import { DimItem } from 'app/inventory/item-types';
import { ItemActionsModel } from 'app/item-popup/item-popup-actions';
import OpenOnStreamDeckButton from 'app/stream-deck/OpenOnStreamDeckButton/OpenOnStreamDeckButton';
import { streamDeckEnabledSelector } from 'app/stream-deck/selectors';
import { Suspense } from 'react';
import { useSelector } from 'react-redux';
import {
  CompareActionButton,
  ConsolidateActionButton,
  DistributeActionButton,
  InfuseActionButton,
  LoadoutActionButton,
  LockActionButton,
  TagActionButton,
} from './ActionButtons';

/**
 * "Accessory" buttons like tagging, locking, comparing, adding to loadout. Displayed separately on mobile, but together with the move actions on desktop.
 */
export default function ItemAccessoryButtons({
  item,
  mobile,
  actionsModel,
  showLabel = true,
}: {
  item: DimItem;
  mobile: boolean;
  showLabel: boolean;
  actionsModel: ItemActionsModel;
}) {
  const streamDeckEnabled = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useSelector(streamDeckEnabledSelector)
    : false;

  return (
    <>
      {actionsModel.taggable && (
        <TagActionButton item={item} label={mobile || showLabel} hideKeys={mobile} />
      )}
      {actionsModel.lockable && <LockActionButton item={item} label={showLabel} />}
      {actionsModel.comparable && <CompareActionButton item={item} label={showLabel} />}
      {actionsModel.canConsolidate && (
        <ConsolidateActionButton item={item} label={showLabel} actionModel={actionsModel} />
      )}
      {actionsModel.canDistribute && (
        <DistributeActionButton item={item} label={showLabel} actionModel={actionsModel} />
      )}
      {actionsModel.loadoutable && (
        <LoadoutActionButton item={item} label={showLabel} actionModel={actionsModel} />
      )}
      {actionsModel.infusable && (
        <InfuseActionButton item={item} label={showLabel} actionModel={actionsModel} />
      )}
      {streamDeckEnabled && (
        <Suspense>
          <OpenOnStreamDeckButton label={showLabel} item={item} />
        </Suspense>
      )}
    </>
  );
}
