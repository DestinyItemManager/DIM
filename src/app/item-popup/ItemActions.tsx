import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { t } from 'i18next';
import classNames from 'classnames';
import './ItemActions.scss';
import { hideItemPopup } from './item-popup';
import { moveItemTo, consolidate, distribute } from '../inventory/dimItemMoveService.factory';
import { ngDialog } from '../ngimport-more';
import { RootState } from '../store/reducers';
import { storesSelector, sortedStoresSelector } from '../inventory/reducer';
import { connect } from 'react-redux';
import ItemMoveAmount from './ItemMoveAmount';
import { createSelector } from 'reselect';
import ItemMoveLocation from './ItemMoveLocation';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  store?: DimStore;
  stores: DimStore[];
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  return {
    store: storesSelector(state).find((s) => s.id === item.owner),
    stores: sortedStoresSelector(state)
  };
}

type Props = ProvidedProps & StoreProps;

interface State {
  amount: number;
}

class ItemActions extends React.Component<Props, State> {
  state: State = { amount: this.props.item.amount };
  private maximumSelector = createSelector(
    (props: Props) => props.item,
    (props: Props) => props.store,
    (item, store) =>
      !store || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : store.amountOfItem(item)
  );

  render() {
    const { item, store, stores } = this.props;
    const { amount } = this.state;

    if (!store) {
      return null;
    }

    const canConsolidate =
      !item.notransfer && item.location.hasTransferDestination && item.maxStackSize > 1;
    const canDistribute = item.isDestiny1() && !item.notransfer && item.maxStackSize > 1;

    // If the item can't be transferred (or is unique) don't show the move amount slider
    const maximum = this.maximumSelector(this.props);

    return (
      <>
        {maximum > 1 && (
          <ItemMoveAmount
            amount={amount}
            maximum={maximum}
            maxStackSize={item.maxStackSize}
            onAmountChanged={this.onAmountChanged}
          />
        )}
        <div className="interaction">
          {stores.map((buttonStore) => (
            <ItemMoveLocation
              key={buttonStore.id}
              item={item}
              store={buttonStore}
              itemOwnerStore={store}
              moveItemTo={this.moveItemTo}
            />
          ))}

          {canConsolidate && (
            <div
              className="move-button move-consolidate"
              title={t('MovePopup.Consolidate')}
              onClick={this.consolidate}
            >
              <span>{t('MovePopup.Take')}</span>
            </div>
          )}
          {canDistribute && (
            <div
              className="move-button move-distribute"
              title={t('MovePopup.DistributeEvenly')}
              onClick={this.distribute}
            >
              <span>{t('MovePopup.Split')}</span>
            </div>
          )}
          {item.infusionFuel && (
            <div className="locations">
              <div
                className={classNames('move-button', 'infuse-perk', item.bucket.sort, {
                  destiny2: item.isDestiny2()
                })}
                onClick={this.infuse}
                title={t('Infusion.Infusion')}
              >
                <span>{t('MovePopup.Infuse')}</span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  private moveItemTo = (store: DimStore, equip = false) => {
    const { item } = this.props;
    const { amount } = this.state;
    moveItemTo(item, store, equip, amount);
    hideItemPopup();
  };

  /*
   * Open up the dialog for infusion by passing
   * the selected item
   */
  private infuse = (e: React.MouseEvent) => {
    const { item } = this.props;
    e.stopPropagation();

    hideItemPopup();

    // Open the infuse window
    ngDialog.open({
      template: '<infuse query="item"></infuse>',
      className: 'app-settings',
      appendClassName: 'modal-dialog',
      controller($scope) {
        'ngInject';
        $scope.item = item;
      }
    });
  };

  private consolidate = () => {
    const { item, store } = this.props;
    hideItemPopup();
    consolidate(item, store!);
  };

  private distribute = () => {
    const { item } = this.props;
    hideItemPopup();
    distribute(item);
  };

  private onAmountChanged = (amount: number) => {
    this.setState({ amount });
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemActions);
