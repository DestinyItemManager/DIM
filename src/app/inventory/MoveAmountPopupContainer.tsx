import * as React from 'react';
import Sheet from '../dim-ui/Sheet';
import { Subscriptions } from '../rx-utils';
import './MoveAmountPopupContainer.scss';
import { MoveAmountPopupOptions, showMoveAmountPopup$ } from './move-dropped-item';
import { t } from 'i18next';
import ItemMoveAmount from '../item-popup/ItemMoveAmount';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';

interface State {
  options?: MoveAmountPopupOptions;
  amount: number;
}

/**
 * A container that can show a single move amount popup. This is a
 * single element to help prevent multiple popups from showing at once.
 */
export default class MoveAmountPopupContainer extends React.Component<{}, State> {
  state: State = { amount: 0 };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      showMoveAmountPopup$.subscribe((options) => {
        this.setState({ options, amount: options.amount });
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { options, amount } = this.state;

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
      <Sheet onClose={this.onClose} sheetClassName="move-amount-popup">
        {({ onClose }) => (
          <>
            <h1 className="no-badge">
              <div className="item">
                <div className="item-img" style={bungieBackgroundStyle(item.icon)} />
              </div>
              <span>{t('StoreBucket.HowMuch', { itemname: item.name })}</span>
            </h1>
            <ItemMoveAmount
              amount={amount}
              maximum={maximum}
              maxStackSize={item.maxStackSize}
              onAmountChanged={this.onAmountChanged}
            />
            <div className="buttons">
              <button className="dim-button" onClick={() => this.finish(amount, onClose)}>
                {t('StoreBucket.Move')}
              </button>
              {stacksWorth > 0 && (
                <button className="dim-button" onClick={() => this.finish(stacksWorth, onClose)}>
                  {t('StoreBucket.FillStack', { amount: stacksWorth })}
                </button>
              )}
            </div>
          </>
        )}
      </Sheet>
    );
  }

  private finish = (amount: number, onClose: () => void) => {
    if (this.state.options) {
      this.state.options.onAmountSelected(amount);
      onClose();
    }
  };

  private onAmountChanged = (amount: number) => {
    this.setState({ amount });
  };

  private onClose = () => {
    if (this.state.options) {
      this.state.options.onCancel();
    }
    this.setState({ options: undefined });
  };
}
