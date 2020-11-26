import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { preventNaN } from '../utils/util';
import './ItemMoveAmount.scss';

interface Props {
  amount: number;
  maximum: number;
  maxStackSize: number;
  onAmountChanged(amount: number): void;
}

/** An editor for selecting how much of a stackable item you want. */
export default class ItemMoveAmount extends React.Component<Props> {
  render() {
    const { maximum, amount, maxStackSize } = this.props;

    return (
      <div>
        <div className="move-amount" onTouchStart={this.stopTouchPropagation}>
          <input
            name="amount"
            type="text"
            value={preventNaN(amount, '')}
            onBlur={this.constrain}
            onChange={this.onChange}
          />
          <input
            className="move-amount-slider"
            type="range"
            min={1}
            max={maximum}
            value={preventNaN(amount, 1)}
            onChange={this.onChange}
            list="tickmarks"
          />
          <datalist id="tickmarks">
            {_.times(Math.floor(maximum / maxStackSize), (index) => (
              <option key={index} value={(index + 1) * maxStackSize} />
            ))}
          </datalist>
        </div>
        <div className="move-amount move-amount-buttons">
          <button
            type="button"
            className="move-amount-button dim-button"
            tabIndex={-1}
            onClick={this.min}
          >
            1
          </button>
          {maximum > maxStackSize && (
            <button
              type="button"
              className="move-amount-button dim-button"
              tabIndex={-1}
              onClick={this.downstack}
              title={t('MoveAmount.DownStack')}
            >
              {t('MoveAmount.MinusStack')}
            </button>
          )}
          <button
            type="button"
            className="move-amount-button dim-button"
            tabIndex={-1}
            onClick={this.decrement}
          >
            -1
          </button>
          <button
            type="button"
            className="move-amount-button dim-button"
            tabIndex={-1}
            onClick={this.increment}
          >
            +1
          </button>
          {maximum > maxStackSize && (
            <button
              type="button"
              className="move-amount-button dim-button"
              tabIndex={-1}
              onClick={this.upstack}
              title={t('MoveAmount.UpStack')}
            >
              {t('MoveAmount.PlusStack')}
            </button>
          )}
          <button
            type="button"
            className="move-amount-button dim-button"
            tabIndex={-1}
            onClick={this.max}
          >
            {maximum.toLocaleString()}
          </button>
        </div>
      </div>
    );
  }
  private increment = (e) => {
    e.preventDefault();
    const { maximum, amount, onAmountChanged } = this.props;
    onAmountChanged(Math.min(amount + 1, maximum));
  };

  private max = (e) => {
    e.preventDefault();
    const { maximum, onAmountChanged } = this.props;
    onAmountChanged(maximum);
  };

  private min = (e) => {
    e.preventDefault();
    const { onAmountChanged } = this.props;
    onAmountChanged(1);
  };

  private decrement = (e) => {
    e.preventDefault();
    const { amount, onAmountChanged } = this.props;
    onAmountChanged(Math.max(amount - 1, 1));
  };

  private upstack = (e) => {
    e.preventDefault();
    const { maximum, amount, maxStackSize, onAmountChanged } = this.props;

    onAmountChanged(
      Math.min(maximum, Math.floor(amount / maxStackSize) * maxStackSize + maxStackSize)
    );
  };

  private downstack = (e) => {
    e.preventDefault();
    const { amount, maxStackSize, onAmountChanged } = this.props;
    onAmountChanged(Math.max(1, Math.ceil(amount / maxStackSize) * maxStackSize - maxStackSize));
  };

  private constrain = () => {
    const { amount, maximum, onAmountChanged } = this.props;
    const value = preventNaN(amount, maximum);
    const constrained = _.clamp(value, 1, maximum);

    if (constrained !== amount) {
      onAmountChanged(constrained);
    }
  };

  private onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { onAmountChanged } = this.props;
    onAmountChanged(parseInt(e.currentTarget.value, 10));
  };

  private stopTouchPropagation = (e) => e.stopPropagation();
}
