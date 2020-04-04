import './ItemPopupContainer.scss';

import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import { ItemPopupExtraInfo, showItemPopup$ } from './item-popup';

import ClickOutside from '../dim-ui/ClickOutside';
import { DimItem } from '../inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import ItemActions from './ItemActions';
import ItemPopupHeader from './ItemPopupHeader';
import ItemTagHotkeys from './ItemTagHotkeys';
import { createPopper, Instance, Options, Padding } from '@popperjs/core';
import React from 'react';
import { RootState } from '../store/reducers';
import Sheet from '../dim-ui/Sheet';
import { Subscriptions } from '../utils/rx-utils';
import { connect } from 'react-redux';
import { router } from '../router';
import { setSetting } from '../settings/actions';
import { settingsSelector } from 'app/settings/reducer';
import { storesSelector } from 'app/inventory/selectors';
import { t } from 'app/i18next-t';

interface ProvidedProps {
  boundarySelector?: string;
}

interface StoreProps {
  isPhonePortrait: boolean;
  itemDetails: boolean;
  stores: DimStore[];
  language: string;
}

function mapStateToProps(state: RootState): StoreProps {
  const settings = settingsSelector(state);
  return {
    stores: storesSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    itemDetails: settings.itemDetails,
    language: settings.language
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

const popperOptions = (boundarySelector: string | undefined): Partial<Options> => {
  const headerHeight = document.getElementById('header')!.clientHeight;
  const boundaryElement = boundarySelector && document.querySelector(boundarySelector);
  const padding: Padding = {
    left: 0,
    top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
    right: 0,
    bottom: 0
  };
  return {
    placement: 'auto',
    modifiers: [
      { name: 'eventListeners', enabled: false },
      {
        name: 'preventOverflow',
        options: {
          priority: ['bottom', 'top', 'right', 'left'],
          boundariesElement: 'viewport',
          padding
        }
      },
      {
        name: 'flip',
        options: {
          behavior: ['top', 'bottom', 'right', 'left'],
          boundariesElement: 'viewport',
          padding
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, 5]
        }
      },
      {
        name: 'arrow',
        options: {
          element: '.arrow'
        }
      }
    ]
  };
};

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
class ItemPopupContainer extends React.Component<Props, State> {
  state: State = { tab: ItemPopupTab.Overview };
  private subscriptions = new Subscriptions();
  private popper?: Instance;
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
    const { isPhonePortrait, itemDetails, stores, language } = this.props;
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
        language={language}
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
        this.popper.update();
      } else {
        const options = popperOptions(boundarySelector);

        this.popper = createPopper(element, this.popupRef.current, options);
        this.popper.update(); // helps fix arrow position
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
