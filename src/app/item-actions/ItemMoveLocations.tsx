import { StoreIcon } from 'app/character-tile/StoreIcon';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore, getVault } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-actions/ActionButton';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemActionsModel, StoreButtonInfo } from 'app/item-popup/item-popup-actions';
import ItemMoveAmount from 'app/item-popup/ItemMoveAmount';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ItemMoveLocations.m.scss';

type MoveSubmit = (store: DimStore, equip?: boolean, moveAmount?: number) => void;

const sharedButtonProps = { role: 'button', tabIndex: -1 };

export default function ItemMoveLocations({
  item,
  mobileInspect,
  splitVault,
  actionsModel,
}: {
  item: DimItem;
  actionsModel: ItemActionsModel;
  mobileInspect?: boolean;
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
              mobileInspect={mobileInspect}
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
                mobileInspect={mobileInspect}
                defaultPadding={splitVault}
                submitMoveTo={submitMoveTo}
              />
              {!splitVault && actionsModel.canVault && (
                <DropVaultButton
                  store={vault}
                  mobileInspect={mobileInspect}
                  handleMove={() => submitMoveTo(vault)}
                />
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

/**
 * For the mobile "drag inspect" mode, this provides a drop target that will send items to a specific store. It's also a normal button.
 */
function DropLocation({
  children,
  store,
  equip,
  onDrop,
}: {
  children: React.ReactElement;
  store: DimStore;
  equip?: boolean;
  onDrop: () => void;
}) {
  const [{ hovering }, drop] = useDrop({
    accept: mobileDragType,
    drop: onDrop,
    collect: (monitor) => ({ hovering: Boolean(monitor.isOver()) }),
  });
  const ref = useRef<HTMLDivElement>(null);

  const title = equip
    ? t('MovePopup.EquipWithName', { character: store.name })
    : store.isVault
    ? t('MovePopup.SendToVault')
    : t('MovePopup.StoreWithName', { character: store.name });

  return (
    <PressTip.Control tooltip={title} triggerRef={ref} open={hovering}>
      {React.cloneElement(children, { ref: drop })}
    </PressTip.Control>
  );
}

/**
 * For the mobile "drag inspect" mode, this provides a drop target that will send items to the vault. It's also a normal button.
 */
function DropVaultButton({
  store,
  mobileInspect,
  handleMove,
}: {
  store: DimStore;
  mobileInspect?: boolean;
  handleMove: () => void;
}) {
  return (
    <DropLocation store={store} onDrop={handleMove}>
      <div
        className={clsx(styles.move, styles.vaultButton, {
          [styles.mobileInspectButton]: mobileInspect,
        })}
        onClick={handleMove}
        {...sharedButtonProps}
      >
        <StoreIcon store={store} />
      </div>
    </DropLocation>
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
  mobileInspect,
  defaultPadding,
  type,
  actionsModel,
  submitMoveTo,
}: {
  label: string;
  shortcutKey?: string;
  defaultPadding?: boolean;
  mobileInspect?: boolean;
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
          [styles.mobileInspectButton]: mobileInspect,
        })}
        title={`${label}${shortcutKey ? ' ' + shortcutKey : ''}`}
        onClick={enabled ? handleMove : undefined}
        {...sharedButtonProps}
      >
        <StoreIcon store={store} useBackground={true} />
      </div>
    );

    return (
      <React.Fragment key={`${equip}-${store.id}`}>
        {!mobileInspect ? (
          button
        ) : (
          <DropLocation store={store} equip={equip} onDrop={handleMove}>
            {button}
          </DropLocation>
        )}
      </React.Fragment>
    );
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
        <div
          className={styles.move}
          onClick={() => submitMoveTo(itemOwner, false, item.amount)}
          {...sharedButtonProps}
        >
          <StoreIcon store={itemOwner} useBackground={true} label={moveAllLabel} />
        </div>

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
