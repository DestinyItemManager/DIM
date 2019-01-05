import * as React from 'react';
import { Subscriptions } from '../rx-utils';
import { router } from '../../router';
import { ItemPickerState, showItemPicker$ } from './item-picker';
import ItemPicker from './ItemPicker';

interface State {
  options?: ItemPickerState;
  generation: number;
}

// TODO: nest components to make redux happier?

/**
 * A container that can show a single item picker. This is a
 * single element to help prevent multiple pickers from showing
 * at once and to make the API easier.
 */
export default class ItemPickerContainer extends React.Component<{}, State> {
  state: State = { generation: 0 };
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook?: Function;

  componentDidMount() {
    this.subscriptions.add(
      showItemPicker$.subscribe((options) => {
        this.setState((state) => {
          if (this.state.options) {
            this.state.options.onCancel();
          }
          return { options, generation: state.generation + 1 };
        });
      })
    );
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
    const { options, generation } = this.state;

    if (!options) {
      return null;
    }

    return <ItemPicker key={generation} {...options} onSheetClosed={this.onClose} />;
  }

  private onClose = () => {
    this.setState({ options: undefined });
  };
}
