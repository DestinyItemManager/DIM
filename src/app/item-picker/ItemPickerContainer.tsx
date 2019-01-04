import * as React from 'react';
import { Subscriptions } from '../rx-utils';
import { router } from '../../router';
import { ItemPickerState, showItemPicker$ } from './item-picker';
import ItemPicker from './ItemPicker';

interface State {
  options?: ItemPickerState;
}

// TODO: nest components to make redux happier?

/**
 * A container that can show a single item picker. This is a
 * single element to help prevent multiple pickers from showing
 * at once and to make the API easier.
 */
export default class ItemPickerContainer extends React.Component<{}, State> {
  state: State = {};
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook?: Function;

  componentDidMount() {
    this.subscriptions.add(showItemPicker$.subscribe((options) => this.setState({ options })));
    this.unregisterTransitionHook = router.transitionService.onBefore({}, () => this.onClose());
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
    if (this.unregisterTransitionHook) {
      this.unregisterTransitionHook();
      this.unregisterTransitionHook = undefined;
    }
  }

  render() {
    const { options } = this.state;

    if (!options) {
      return null;
    }

    return <ItemPicker {...options} onSheetClosed={this.onClose} />;
  }

  private onClose = () => {
    this.setState({ options: undefined });
  };
}
