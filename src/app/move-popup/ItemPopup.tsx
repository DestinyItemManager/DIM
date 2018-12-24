import * as React from 'react';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs/Subject';
import { Subscriptions } from '../rx-utils';
import { MovePopupComponent } from './dimMovePopup.directive';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';
import { DimStore } from '../inventory/store-types';

const OldMovePopup = angular2react<{
  store: DimStore;
  item: DimItem;
}>('dimMovePopup', MovePopupComponent, lazyInjector.$injector as angular.auto.IInjectorService);

const showItemPopup$ = new Subject<DimItem>();

export function showItemPopup(item: DimItem) {
  showItemPopup$.next(item);
}

interface State {
  item?: DimItem;
}

// TODO: this should be a Portal, right??
// TODO: close via a ref?
// TODO: switch between mobile popup and positioned popup
export default class ItemPopup extends React.Component<{}, State> {
  state: State = {};
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(showItemPopup$.subscribe((item) => this.setState({ item })));
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { item } = this.state;

    if (!item) {
      return null;
    }

    const store = item.getStoresService().getStore(item.owner)!;

    return (
      <Sheet onClose={this.onClose} scrollable={true}>
        <OldMovePopup item={item} store={store} />
      </Sheet>
    );
  }

  private onClose = () => this.setState({ item: undefined });
}
