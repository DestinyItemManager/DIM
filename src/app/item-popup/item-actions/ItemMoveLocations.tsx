import { StoreIcon } from 'app/character-tile/StoreIcon';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore, getVault } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-popup/item-actions/ActionButton';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemActionsModel, StoreButtonInfo } from 'app/item-popup/item-popup-actions';
import ItemMoveAmount from 'app/item-popup/ItemMoveAmount';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ItemMoveLocations.m.scss';

type MoveSubmit = (store: DimStore, equip?: boolean, moveAmount?: number) => void;

const sharedButtonProps = { role: 'button', tabIndex: -1 };

export default function ItemMoveLocations({
  item,
  splitVault,
  actionsModel,
}: {
  item: DimItem;
  actionsModel: ItemActionsModel;
  /** Split the vault button out into its own section (for desktop) instead of making it part of the horizontal emblem store buttons. */
  splitVault?: boolean;
}) {
  const stores = useSelector(sortedStoresSelector);
  const vault = getVault(stores)!;
  // barring a user selection, default to moving the whole stack of this item
  const [amount, setAmount] = useState(item.amount);
  const itemOwner = getStore(stores, item.owner);
  const dispatch = useDispatch();

  const submitMoveTo = (store: DimStore, equip = false, moveAmount = amount) => {
    dispatch(moveItemTo(item, store, equip, moveAmount));
    hideItemPopup();
  };

  if (!itemOwner || !actionsModel.hasMoveControls) {
    return null;
  }

  return (
    <>
      {actionsModel.inPostmaster ? (
        actionsModel.pullFromPostmaster && (
          <PullButtons
            item={item}
            itemOwner={itemOwner}
            submitMoveTo={submitMoveTo}
            vault={vault}
            actionsModel={actionsModel}
          />
        )
      ) : (
        <>
          {splitVault && actionsModel.canVault && (
            <VaultActionButton vault={vault} onClick={() => submitMoveTo(vault)} />
          )}
          {actionsModel.equip.length > 0 && (
            <MoveLocations
              label={t('MovePopup.Equip')}
              actionsModel={actionsModel}
              type="equip"
              defaultPadding={splitVault}
              submitMoveTo={submitMoveTo}
            />
          )}
          {(actionsModel.store.length > 0 || actionsModel.canVault) && (
            <div className={styles.moveWithVault}>
              <MoveLocations
                label={t('MovePopup.Store')}
                shortcutKey=" [P]"
                actionsModel={actionsModel}
                type="store"
                defaultPadding={splitVault}
                submitMoveTo={submitMoveTo}
              />
              {!splitVault && actionsModel.canVault && (
                <VaultButton store={vault} handleMove={() => submitMoveTo(vault)} />
              )}
            </div>
          )}
        </>
      )}

      {actionsModel.showAmounts && (
        <ItemMoveAmount
          amount={amount}
          maximum={actionsModel.maximumMoveAmount}
          onAmountChanged={setAmount}
        />
      )}
    </>
  );
}

function VaultButton({ store, handleMove }: { store: DimStore; handleMove: () => void }) {
  return (
    <div
      className={clsx(styles.move, styles.vaultButton)}
      onClick={handleMove}
      {...sharedButtonProps}
    >
      <StoreIcon store={store} />
    </div>
  );
}

function VaultActionButton({ vault, onClick }: { vault: DimStore; onClick: () => void }) {
  return (
    <ActionButton onClick={onClick} title={t('MovePopup.Vault') + ' [V]'}>
      <StoreIcon store={vault} /> <span className={styles.vaultLabel}>{t('MovePopup.Vault')}</span>
    </ActionButton>
  );
}

function MoveLocations({
  label,
  shortcutKey,
  defaultPadding,
  type,
  actionsModel,
  submitMoveTo,
}: {
  label: string;
  shortcutKey?: string;
  defaultPadding?: boolean;
  type: 'equip' | 'store';
  actionsModel: ItemActionsModel;
  submitMoveTo: MoveSubmit;
}) {
  const buttonInfos = actionsModel[type];
  const equip = type === 'equip';

  if (!buttonInfos.length) {
    return null;
  }

  function moveLocation({ store, enabled }: StoreButtonInfo) {
    const handleMove = enabled ? () => submitMoveTo(store, equip) : _.noop;

    const button = (
      <div
        className={clsx({
          [styles.equip]: equip,
          [styles.move]: !equip,
          [styles.disabled]: !enabled,
        })}
        title={`${label}${shortcutKey ? ' ' + shortcutKey : ''}`}
        onClick={enabled ? handleMove : undefined}
        {...sharedButtonProps}
      >
        <StoreIcon store={store} useBackground={true} />
      </div>
    );

    return <React.Fragment key={`${equip}-${store.id}`}>{button}</React.Fragment>;
  }

  return (
    <div
      className={clsx(styles.moveLocations, {
        [styles.moveLocationPadding]: defaultPadding,
      })}
    >
      {label}
      <div className={styles.moveLocationIcons}>{buttonInfos.map(moveLocation)}</div>
    </div>
  );
}

/**
 * Buttons for pulling an item from the Postmaster.
 */
function PullButtons({
  item,
  itemOwner,
  submitMoveTo,
  actionsModel,
  vault,
}: {
  item: DimItem;
  itemOwner: DimStore;
  submitMoveTo: MoveSubmit;
  actionsModel: ItemActionsModel;
  vault?: DimStore;
}) {
  const showAmounts = item.maxStackSize > 1 || item.bucket.hash === BucketHashes.Consumables;
  const moveAllLabel = showAmounts ? t('MovePopup.All') : undefined;
  const moveMaxLabel =
    item.amount === actionsModel.maximumMoveAmount
      ? moveAllLabel
      : `${actionsModel.maximumMoveAmount}`;

  return (
    <div className={clsx(styles.moveLocations, styles.moveLocationPadding)}>
      {t('MovePopup.PullPostmaster')}
      <div className={styles.moveLocationIcons}>
        {showAmounts && (
          <div
            className={styles.move}
            onClick={() => submitMoveTo(itemOwner, false, 1)}
            {...sharedButtonProps}
          >
            <StoreIcon store={itemOwner} useBackground={true} label="1" />
          </div>
        )}
        {showAmounts ? (
          actionsModel.maximumMoveAmount !== 1 && (
            <div
              className={styles.move}
              onClick={() => submitMoveTo(itemOwner, false, actionsModel.maximumMoveAmount)}
              {...sharedButtonProps}
            >
              <StoreIcon store={itemOwner} useBackground={true} label={moveMaxLabel} />
            </div>
          )
        ) : (
          <div
            className={styles.move}
            onClick={() => submitMoveTo(itemOwner, false, item.amount)}
            {...sharedButtonProps}
          >
            <StoreIcon store={itemOwner} useBackground={true} label={moveAllLabel} />
          </div>
        )}

        {actionsModel.canVault && (
          <div
            className={styles.move}
            onClick={() => submitMoveTo(vault!, false, item.amount)}
            {...sharedButtonProps}
          >
            <StoreIcon store={vault!} label={moveAllLabel} />
          </div>
        )}
      </div>
    </div>
  );
}
