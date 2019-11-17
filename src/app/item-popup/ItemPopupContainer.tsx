import React from 'react';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { Subscriptions } from '../utils/rx-utils';
import Popper from 'popper.js';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import ClickOutside from '../dim-ui/ClickOutside';
import ItemPopupHeader from './ItemPopupHeader';
import { router } from '../router';
import { showItemPopup$, ItemPopupExtraInfo } from './item-popup';
import { setSetting } from '../settings/actions';
import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import './ItemPopupContainer.scss';
import ItemTagHotkeys from './ItemTagHotkeys';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/reducer';
import { DimStore } from 'app/inventory/store-types';
import ItemActions from './ItemActions';

interface ProvidedProps {
  boundarySelector?: string;
}

interface StoreProps {
  isPhonePortrait: boolean;
  itemDetails: boolean;
  stores: DimStore[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    itemDetails: state.settings.itemDetails,
    stores: storesSelector(state)
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
  tab: ItemPopupTab;
}

const popperOptions = {
  placement: 'right',
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
class ItemPopupContainer extends React.Component<Props, State> {
  state: State = { tab: ItemPopupTab.Overview };
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
          this.setState(({ tab }) => ({
            item,
            element,
            extraInfo,
            tab: !item.reviewable && tab === ItemPopupTab.Reviews ? ItemPopupTab.Overview : tab
          }));
          if ($DIM_FLAVOR !== 'release') {
            console.log(item);
          }
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
    const { isPhonePortrait, itemDetails, stores } = this.props;
    const { extraInfo = {}, tab } = this.state;
    let { item } = this.state;

    if (!item) {
      return null;
    }

    // Try to find an updated version of the item!
    item = maybeFindItem(item, stores);

    const header = (
      <ItemPopupHeader
        item={item}
        expanded={isPhonePortrait || itemDetails}
        showToggle={!isPhonePortrait}
        onToggleExpanded={this.toggleItemDetails}
      />
    );

    const body = (
      <ItemPopupBody
        item={item}
        extraInfo={extraInfo}
        tab={tab}
        expanded={isPhonePortrait || itemDetails}
        onTabChanged={this.onTabChanged}
        onToggleExpanded={this.toggleItemDetails}
      />
    );

    const footer = <ItemActions key={item.index} item={item} />;

    return isPhonePortrait ? (
      <Sheet
        onClose={this.onClose}
        header={header}
        sheetClassName={`item-popup is-${item.tier}`}
        footer={footer}
      >
        {body}
      </Sheet>
    ) : (
      <div
        className={`move-popup-dialog is-${item.tier}`}
        ref={this.popupRef}
        role="dialog"
        aria-modal="false"
      >
        <ClickOutside onClickOutside={this.onClose}>
          <ItemTagHotkeys item={item}>
            {header}
            {body}
            <div className="item-details">{footer}</div>
          </ItemTagHotkeys>
        </ClickOutside>
        <div className={`arrow is-${item.tier}`} />
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'esc',
              description: t('Hotkey.ClearDialog'),
              callback: () => {
                this.onClose();
              }
            }
          ]}
        />
      </div>
    );
  }

  private onTabChanged = (tab: ItemPopupTab) => {
    if (tab !== this.state.tab) {
      this.setState({ tab });
    }
  };

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
        const headerHeight = document.getElementById('header')!.clientHeight;
        const boundaryElement = boundarySelector && document.querySelector(boundarySelector);
        const padding = {
          left: 0,
          top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
          right: 0,
          bottom: 0
        };
        popperOptions.modifiers.preventOverflow.padding = padding;
        popperOptions.modifiers.preventOverflow.boundariesElement = 'viewport';
        popperOptions.modifiers.flip.padding = padding;
        popperOptions.modifiers.flip.boundariesElement = 'viewport';

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

  private toggleItemDetails = () => {
    this.props.setSetting('itemDetails', !this.props.itemDetails);
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemPopupContainer);

/**
 * The passed in item may be old - look through stores to try and find a newer version!
 * This helps with items that have objectives, like Pursuits.
 *
 * TODO: This doesn't work for the synthetic items created for Milestones.
 */
function maybeFindItem(item: DimItem, stores: DimStore[]) {
  // Don't worry about non-instanced items
  if (item.id === '0') {
    return item;
  }

  for (const store of stores) {
    for (const storeItem of store.items) {
      if (storeItem.id === item.id) {
        return storeItem;
      }
    }
  }
  // Didn't find it, use what we've got.
  return item;
}
