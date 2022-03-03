import { DimItem } from 'app/inventory/item-types';
import { ItemActionsModel } from 'app/item-popup/item-popup-actions';
import React from 'react';
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
    </>
  );
}
