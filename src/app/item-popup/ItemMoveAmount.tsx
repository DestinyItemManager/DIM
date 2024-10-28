import { t } from 'app/i18next-t';
import { clamp } from 'es-toolkit';
import React from 'react';
import styles from './ItemMoveAmount.m.scss';

/** An editor for selecting how much of a stackable item you want. */
export default function ItemMoveAmount({
  maximum,
  amount,
  onAmountChanged,
}: {
  amount: number;
  maximum: number;
  onAmountChanged: (amount: number) => void;
}) {
  const constrain = () => {
    const constrained = clamp(amount, 1, maximum);

    if (constrained !== amount) {
      onAmountChanged(constrained);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAmountChanged(parseInt(e.currentTarget.value, 10));
  };

  return (
    <div className={styles.moveAmount}>
      <label htmlFor="amount">{t('MoveAmount.Amount')}</label>
      <input
        name="amount"
        type="number"
        min="1"
        max={maximum}
        value={amount}
        onBlur={constrain}
        onChange={onChange}
      />
    </div>
  );
}
