import styles from './ItemPopupContainer.m.scss';

import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import { ItemPopupExtraInfo, showItemPopup$ } from './item-popup';

import ClickOutside from '../dim-ui/ClickOutside';
import { DimItem } from '../inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
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
import React, { useState, useRef, useEffect } from 'react';
import { RootState } from 'app/store/types';
import Sheet from '../dim-ui/Sheet';
import { connect } from 'react-redux';
import { setSetting } from '../settings/actions';
import { settingsSelector } from 'app/settings/reducer';
import { storesSelector } from 'app/inventory/selectors';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { useLocation } from 'react-router';
import { useSubscription } from 'app/utils/hooks';
import { useHotkey } from 'app/hotkeys/useHotkey';

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
    language: settings.language,
  };
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

/** Makes a custom popper that doesn't have the event listeners modifier */
const createPopper = popperGenerator({
  defaultModifiers: [
    popperOffsets,
    offset,
    computeStyles,
    applyStyles,
    flip,
    preventOverflow,
    arrow,
  ],
});

const popperOptions = (boundarySelector: string | undefined): Partial<Options> => {
  const headerHeight = document.getElementById('header')!.clientHeight;
  const boundaryElement = boundarySelector && document.querySelector(boundarySelector);
  const padding: Padding = {
    left: 0,
    top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
    right: 0,
    bottom: 0,
  };
  return {
    placement: 'auto',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          priority: ['bottom', 'top', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'flip',
        options: {
          behavior: ['top', 'bottom', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
      {
        name: 'arrow',
        options: {
          element: '.' + styles.arrow,
        },
      },
    ],
  };
};

const tierClasses: { [key in DimItem['tier']]: string } = {
  Exotic: styles.exotic,
  Legendary: styles.legendary,
  Rare: styles.rare,
  Uncommon: styles.uncommon,
  Common: styles.common,
} as const;

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
function ItemPopupContainer({
  isPhonePortrait,
  itemDetails,
  stores,
  language,
  boundarySelector,
  setSetting,
}: Props) {
  const [tab, setTab] = useState(ItemPopupTab.Overview);
  const [currentItem, setCurrentItem] = useState<{
    item: DimItem;
    element?: Element;
    extraInfo?: ItemPopupExtraInfo;
  }>();
  const popper = useRef<Instance>();
  const popupRef = useRef<HTMLDivElement>(null);

  const onTabChanged = (newTab: ItemPopupTab) => {
    if (newTab !== tab) {
      setTab(newTab);
    }
  };

  const onClose = () => setCurrentItem(undefined);

  // Reposition the popup as it is shown or if its size changes
  const reposition = () => {
    if (currentItem?.element && popupRef.current) {
      if (popper.current) {
        popper.current.update();
      } else {
        const options = popperOptions(boundarySelector);

        popper.current = createPopper(currentItem.element, popupRef.current, options);
        popper.current.update();
        setTimeout(() => popper.current?.update(), 0); // helps fix arrow position
      }
    }
  };

  const clearPopper = () => {
    if (popper) {
      popper.current?.destroy();
      popper.current = undefined;
    }
  };

  const toggleItemDetails = () => {
    setSetting('itemDetails', !itemDetails);
  };

  useSubscription(() =>
    showItemPopup$.subscribe(({ item, element, extraInfo }) => {
      if (!item || item === currentItem?.item) {
        onClose();
      } else {
        clearPopper();

        setCurrentItem({
          item,
          element,
          extraInfo,
        });
        setTab((tab) =>
          !item.reviewable && tab === ItemPopupTab.Reviews ? ItemPopupTab.Overview : tab
        );
        // Log the item so it's easy to inspect item structure by clicking on an item
        if ($DIM_FLAVOR !== 'release') {
          console.log(item);
        }
      }
    })
  );

  const { pathname } = useLocation();
  useEffect(() => {
    onClose();
  }, [pathname]);

  useEffect(() => {
    reposition();
  });

  useHotkey('esc', t('Hotkey.ClearDialog'), onClose);

  if (!currentItem?.item) {
    return null;
  }

  // Try to find an updated version of the item!
  const item = maybeFindItem(currentItem.item, stores);

  const header = (
    <ItemPopupHeader
      item={item}
      language={language}
      expanded={isPhonePortrait || itemDetails}
      showToggle={!isPhonePortrait}
      onToggleExpanded={toggleItemDetails}
    />
  );

  const body = (
    <ItemPopupBody
      item={item}
      extraInfo={currentItem.extraInfo}
      tab={tab}
      expanded={isPhonePortrait || itemDetails}
      onTabChanged={onTabChanged}
      onToggleExpanded={toggleItemDetails}
    />
  );

  const footer = <ItemActions key={item.index} item={item} />;

  return isPhonePortrait ? (
    <Sheet
      onClose={onClose}
      header={header}
      sheetClassName={`item-popup is-${item.tier}`}
      footer={footer}
    >
      {body}
    </Sheet>
  ) : (
    <div
      className={clsx(styles.movePopupDialog, tierClasses[item.tier])}
      ref={popupRef}
      role="dialog"
      aria-modal="false"
    >
      <ClickOutside onClickOutside={onClose}>
        <ItemTagHotkeys item={item} />
        {header}
        {body}
        <div className="item-details">{footer}</div>
      </ClickOutside>
      <div className={clsx(styles.arrow, tierClasses[item.tier])} />
    </div>
  );
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
