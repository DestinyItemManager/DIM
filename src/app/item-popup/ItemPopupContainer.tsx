import * as React from 'react';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { Subscriptions } from '../rx-utils';
import Popper from 'popper.js';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ClickOutside from '../dim-ui/ClickOutside';
import ItemPopupHeader from './ItemPopupHeader';
import { router } from '../../router';
import { showItemPopup$, ItemPopupExtraInfo } from './item-popup';
import { $rootScope } from 'ngimport';
import { setSetting } from '../settings/actions';
import ItemPopupBody from './ItemPopupBody';

interface ProvidedProps {
  boundarySelector?: string;
}

interface StoreProps {
  isPhonePortrait: boolean;
  itemDetails: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    itemDetails: state.settings.itemDetails
  };
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

interface State {
  item?: DimItem;
  element?: Element;
  extraInfo?: ItemPopupExtraInfo;
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
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook?: Function;

  componentDidMount() {
    this.subscriptions.add(
      showItemPopup$.subscribe(({ item, element, extraInfo }) => {
        if (!item || item === this.state.item) {
          this.onClose();
        } else {
          this.clearPopper();
          this.setState({ item, element, extraInfo });
        }
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

  componentDidUpdate() {
    this.reposition();
  }

  render() {
    const { isPhonePortrait, itemDetails } = this.props;
    const { item, extraInfo = {} } = this.state;

    if (!item) {
      return null;
    }

    const header = (
      <ItemPopupHeader
        item={item}
        expanded={itemDetails}
        onToggleExpanded={this.toggleItemDetails}
      />
    );

    const body = <ItemPopupBody item={item} extraInfo={extraInfo} />;

    return isPhonePortrait ? (
      <Sheet onClose={this.onClose} header={header}>
        {body}
      </Sheet>
    ) : (
      <div className="move-popup-dialog" ref={this.popupRef}>
        <ClickOutside onClickOutside={this.onClose}>
          {header}
          {body}
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

  private toggleItemDetails = (expanded: boolean) => {
    $rootScope.$apply(() => this.props.setSetting('itemDetails', expanded));
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemPopupContainer);
