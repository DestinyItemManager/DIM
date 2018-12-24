import * as React from 'react';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs/Subject';
import { Subscriptions } from '../rx-utils';
import { MovePopupComponent } from '../move-popup/dimMovePopup.directive';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';
import { DimStore } from '../inventory/store-types';
import Popper from 'popper.js';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ClickOutside from '../dim-ui/ClickOutside';

const OldMovePopup = angular2react<{
  store: DimStore;
  item: DimItem;
}>('dimMovePopup', MovePopupComponent, lazyInjector.$injector as angular.auto.IInjectorService);

const showItemPopup$ = new Subject<{
  item: DimItem;
  element?: Element;
}>();

export function showItemPopup(item: DimItem, element?: Element) {
  showItemPopup$.next({ item, element });
}

interface ProvidedProps {
  boundarySelector?: string;
}

interface StoreProps {
  isPhonePortrait: boolean;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait
  };
}

interface State {
  item?: DimItem;
  element?: Element;
}

const popperOptions = {
  placement: 'top-start',
  eventsEnabled: false,
  modifiers: {
    preventOverflow: {
      priority: ['bottom', 'top', 'right', 'left']
    },
    flip: {
      behavior: ['top', 'bottom', 'right', 'left']
    },
    offset: {
      offset: '0,5px'
    },
    arrow: {
      element: '.arrow'
    }
  }
} as any;

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
// TODO: extraData and template?
// TODO: switch between mobile popup and positioned popup
class ItemPopupContainer extends React.Component<Props, State> {
  state: State = {};
  private subscriptions = new Subscriptions();
  private popper?: Popper;
  private popupRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.subscriptions.add(
      showItemPopup$.subscribe(({ item, element }) => {
        if (item === this.state.item) {
          this.onClose();
        } else {
          this.clearPopper();
          this.setState({ item, element });
        }
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  componentDidUpdate() {
    this.reposition();
  }

  render() {
    const { isPhonePortrait } = this.props;
    const { item } = this.state;

    if (!item) {
      return null;
    }

    const store = item.getStoresService().getStore(item.owner)!;

    return isPhonePortrait ? (
      <Sheet onClose={this.onClose} scrollable={true}>
        <OldMovePopup item={item} store={store} />
      </Sheet>
    ) : (
      <div className="move-popup-dialog" ref={this.popupRef}>
        <ClickOutside onClickOutside={this.onClose}>
          <OldMovePopup item={item} store={store} />
        </ClickOutside>
        <div className={classNames('arrow', `is-${item.tier}`)} />
      </div>
    );
  }

  private onClose = () => {
    this.setState({ item: undefined, element: undefined });
  };

  // Reposition the popup as it is shown or if its size changes
  private reposition = () => {
    const { element } = this.state;
    const { boundarySelector } = this.props;

    if (element && this.popupRef.current) {
      if (this.popper) {
        this.popper.scheduleUpdate();
      } else {
        const boundariesElement = boundarySelector
          ? document.querySelector(boundarySelector)
          : undefined;
        if (boundariesElement) {
          popperOptions.modifiers.preventOverflow.boundariesElement = boundariesElement;
          popperOptions.modifiers.flip.boundariesElement = boundariesElement;
        }

        this.popper = new Popper(element, this.popupRef.current, popperOptions);
        this.popper.scheduleUpdate(); // helps fix arrow position
      }
    }
  };

  private clearPopper = () => {
    if (this.popper) {
      this.popper.destroy();
      this.popper = undefined;
    }
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemPopupContainer);
