import styles from './ItemPopupContainer.m.scss';

import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import { ItemPopupExtraInfo, showItemPopup$ } from './item-popup';

import ClickOutside from '../dim-ui/ClickOutside';
import { DimItem } from '../inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import ItemActions from './ItemActions';
import ItemPopupHeader from './ItemPopupHeader';
import ItemTagHotkeys from './ItemTagHotkeys';
import { popperGenerator, Instance, Options, Padding } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import applyStyles from '@popperjs/core/lib/modifiers/applyStyles';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import offset from '@popperjs/core/lib/modifiers/offset';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import React from 'react';
import { RootState } from '../store/reducers';
import Sheet from '../dim-ui/Sheet';
import { Subscriptions } from '../utils/rx-utils';
import { connect } from 'react-redux';
import { setSetting } from '../settings/actions';
import { settingsSelector } from 'app/settings/reducer';
import { storesSelector } from 'app/inventory/selectors';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { RouteComponentProps, withRouter } from 'react-router';

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

type Props = ProvidedProps & StoreProps & DispatchProps & RouteComponentProps;

interface State {
  item?: DimItem;
  element?: Element;
  extraInfo?: ItemPopupExtraInfo;
  tab: ItemPopupTab;
}

/** Makes a custom popper that doesn't have the event listeners modifier */
const createPopper = popperGenerator({
  defaultModifiers: [
    popperOffsets,
    offset,
    computeStyles,
    applyStyles,
    flip,
    preventOverflow,
    arrow
  ]
});

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
          element: '.' + styles.arrow
        }
      }
    ]
  };
};

const tierClasses: { [key in DimItem['tier']]: string } = {
  Exotic: styles.exotic,
  Legendary: styles.legendary,
  Rare: styles.rare,
  Uncommon: styles.uncommon,
  Common: styles.common
} as const;

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
class ItemPopupContainer extends React.Component<Props, State> {
  state: State = { tab: ItemPopupTab.Overview };
  private subscriptions = new Subscriptions();
  private popper?: Instance;
  private popupRef = React.createRef<HTMLDivElement>();

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
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  componentDidUpdate(prevProps: Props) {
    this.reposition();
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.onClose();
    }
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
        className={clsx(styles.movePopupDialog, tierClasses[item.tier])}
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
        <div className={clsx(styles.arrow, tierClasses[item.tier])} />
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
        this.popper?.update();
        setTimeout(() => this.popper?.update(), 0); // helps fix arrow position
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

export default withRouter(
  connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(ItemPopupContainer)
);

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
