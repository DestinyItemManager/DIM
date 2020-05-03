import React from 'react';
import { Subscriptions } from '../utils/rx-utils';
import { ItemPickerState, showItemPicker$ } from './item-picker';
import ItemPicker from './ItemPicker';
import { RouteComponentProps, withRouter } from 'react-router';

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
class ItemPickerContainer extends React.Component<RouteComponentProps, State> {
  state: State = { generation: 0 };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      showItemPicker$.subscribe((options) => {
        this.setState((state) => {
          if (state.options) {
            state.options.onCancel();
          }
          return { options, generation: state.generation + 1 };
        });
      })
    );
  }

  componentDidUpdate(prevProps: RouteComponentProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.onClose();
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
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

export default withRouter(ItemPickerContainer);
