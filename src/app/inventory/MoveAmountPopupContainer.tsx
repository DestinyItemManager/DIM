import React, { useState } from 'react';
import Sheet from '../dim-ui/Sheet';
import './MoveAmountPopupContainer.scss';
import { MoveAmountPopupOptions, showMoveAmountPopup$ } from './move-dropped-item';
import { t } from 'app/i18next-t';
import ItemMoveAmount from '../item-popup/ItemMoveAmount';
import BungieImage from '../dim-ui/BungieImage';
import { useSubscription } from 'app/utils/hooks';

/**
 * A container that can show a single move amount popup. This is a
 * single element to help prevent multiple popups from showing at once.
 */
export default function MoveAmountPopupContainer() {
  const [amount, setAmount] = useState(0);
  const [options, setOptions] = useState<MoveAmountPopupOptions>();
  useSubscription(() =>
    showMoveAmountPopup$.subscribe((options) => {
      setOptions(options);
      setAmount(options.amount);
    })
  );

  const onAmountChanged = setAmount;

  const onClose = () => {
    if (options) {
      options.onCancel();
    }
    setOptions(undefined);
  };

  const finish = (amount: number, onClose: () => void) => {
    if (options) {
      options.onAmountSelected(amount);
      onClose();
    }
  };

  if (!options) {
    return null;
  }

  const { item, maximum, targetStore } = options;

  let targetAmount = targetStore.amountOfItem(item);
  while (targetAmount > 0) {
    targetAmount -= item.maxStackSize;
  }
  const stacksWorth = Math.min(Math.max(-targetAmount, 0), maximum);

  return (
    <Sheet
      onClose={onClose}
      header={
        <h1>
          <div className="item">
            <BungieImage className="item-img" src={item.icon} />
          </div>
          <span>{t('StoreBucket.HowMuch', { itemname: item.name })}</span>
        </h1>
      }
      sheetClassName="move-amount-popup"
    >
      {({ onClose }) => (
        <>
          <ItemMoveAmount
            amount={amount}
            maximum={maximum}
            maxStackSize={item.maxStackSize}
            onAmountChanged={onAmountChanged}
          />
          <div className="buttons">
            <button type="button" className="dim-button" onClick={() => finish(amount, onClose)}>
              {t('StoreBucket.Move')}
            </button>
            {stacksWorth > 0 && (
              <button
                type="button"
                className="dim-button"
                onClick={() => finish(stacksWorth, onClose)}
              >
                {t('StoreBucket.FillStack', { amount: stacksWorth })}
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
