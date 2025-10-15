import { StoreIcon } from 'app/character-tile/StoreIcon';
import { symbolize } from 'app/hotkeys/hotkeys';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore, getVault } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-actions/ActionButton';
import ItemMoveAmount from 'app/item-popup/ItemMoveAmount';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemActionsModel, StoreButtonInfo } from 'app/item-popup/item-popup-actions';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { noop } from 'app/utils/functions';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './ItemMoveLocations.m.scss';

type MoveSubmit = (store: DimStore, equip?: boolean, moveAmount?: number) => void;

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
  const dispatch = useThunkDispatch();

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
                shortcutKey="p"
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
    <button type="button" className={clsx(styles.move, styles.vaultButton)} onClick={handleMove}>
      <StoreIcon store={store} />
    </button>
  );
}

function VaultActionButton({ vault, onClick }: { vault: DimStore; onClick: () => void }) {
  return (
    <ActionButton onClick={onClick} hotkey="v" hotkeyDescription={t('Hotkey.Vault')}>
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
    const handleMove = enabled ? () => submitMoveTo(store, equip) : noop;
    const title =
      type === 'equip'
        ? t('MovePopup.EquipWithName', { character: store.name })
        : t('MovePopup.StoreWithName', { character: store.name });
    const shortcutHelp = shortcutKey && store.current ? ` [${symbolize(shortcutKey)}]` : '';

    const button = (
      <button
        type="button"
        className={styles.move}
        title={`${title}${shortcutHelp}`}
        onClick={handleMove}
        aria-keyshortcuts={store.current ? shortcutKey : undefined}
        disabled={!enabled}
      >
        <StoreIcon store={store} useBackground={true} />
      </button>
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
          <button
            type="button"
            className={styles.move}
            onClick={() => submitMoveTo(itemOwner, false, 1)}
          >
            <StoreIcon store={itemOwner} useBackground={true} label="1" />
          </button>
        )}
        {showAmounts ? (
          actionsModel.maximumMoveAmount !== 1 && (
            <button
              type="button"
              className={styles.move}
              onClick={() => submitMoveTo(itemOwner, false, actionsModel.maximumMoveAmount)}
            >
              <StoreIcon store={itemOwner} useBackground={true} label={moveMaxLabel} />
            </button>
          )
        ) : (
          <button
            type="button"
            className={styles.move}
            onClick={() => submitMoveTo(itemOwner, false, item.amount)}
          >
            <StoreIcon store={itemOwner} useBackground={true} label={moveAllLabel} />
          </button>
        )}

        {actionsModel.canVault && (
          <button
            type="button"
            className={styles.move}
            onClick={() => submitMoveTo(vault!, false, item.amount)}
          >
            <StoreIcon store={vault!} label={moveAllLabel} />
          </button>
        )}
      </div>
    </div>
  );
}
