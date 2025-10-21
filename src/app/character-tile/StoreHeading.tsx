import { useFixOverscrollBehavior } from 'app/dim-ui/useFixOverscrollBehavior';
import { usePopper } from 'app/dim-ui/usePopper';
import { t } from 'app/i18next-t';
import { isD1Store } from 'app/inventory/stores-helpers';
import LoadoutPopup from 'app/loadout/loadout-menu/LoadoutPopup';
import { Portal } from 'app/utils/temp-container';
import React, { useCallback, useRef, useState } from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { DimStore } from '../inventory/store-types';
import { AppIcon, kebabIcon } from '../shell/icons';
import CharacterHeaderXPBar from './CharacterHeaderXP';
import CharacterTileButton from './CharacterTileButton';
import * as styles from './StoreHeading.m.scss';

// Wrap the {CharacterTile} with a button for the loadout menu and the D1 XP progress bar
function CharacterHeader({
  store,
  onClick,
  ref,
}: {
  store: DimStore;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <CharacterTileButton
      ref={ref}
      character={store}
      onClick={onClick}
      className={styles.characterHeader}
    >
      <div className={styles.loadoutButton}>
        <AppIcon icon={kebabIcon} title={t('Loadouts.Loadouts')} />
      </div>
      {!store.isVault && isD1Store(store) && <CharacterHeaderXPBar store={store} />}
    </CharacterTileButton>
  );
}

/**
 * This is the character dropdown used at the top of the inventory page.
 * It will render a {CharacterTile} in addition to a button for the loadout menu
 */
export default function StoreHeading({
  store,
  selectedStore,
  onTapped,
}: {
  store: DimStore;
  /** For mobile, this is whichever store is visible at the time. */
  selectedStore?: DimStore;
  /** Fires if a store other than the selected store is tapped. */
  onTapped?: (storeId: string) => void;
}) {
  const [loadoutMenuOpen, setLoadoutMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);

  const handleCloseLoadoutMenu = useCallback(() => {
    setLoadoutMenuOpen(false);
  }, []);

  const useOnTapped = store !== selectedStore && onTapped;
  const openLoadoutPopup = useCallback(() => {
    if (useOnTapped) {
      onTapped(store.id);
      return;
    }
    setLoadoutMenuOpen((open) => !open);
  }, [onTapped, store.id, useOnTapped]);

  const loadoutMenu = loadoutMenuOpen && (
    <Portal>
      <LoadoutMenuContents
        store={store}
        onClose={handleCloseLoadoutMenu}
        menuTrigger={menuTrigger}
      />
    </Portal>
  );

  // TODO: aria "open"
  return (
    <>
      <CharacterHeader store={store} ref={menuTrigger} onClick={openLoadoutPopup} />
      {loadoutMenu}
    </>
  );
}

// This is broken out into its own component so that useFixOverscrollBehavior can run *only* when the menu element exists.
function LoadoutMenuContents({
  store,
  onClose,
  menuTrigger,
}: {
  store: DimStore;
  onClose: () => void;
  menuTrigger: React.RefObject<HTMLButtonElement | null>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useFixOverscrollBehavior(menuRef);

  usePopper({
    contents: menuRef,
    reference: menuTrigger,
    placement: 'bottom-start',
    fixed: true,
    padding: 0,
  });

  return (
    <ClickOutside
      onClickOutside={onClose}
      ref={menuRef}
      extraRef={menuTrigger}
      className={styles.loadoutMenu}
    >
      <LoadoutPopup dimStore={store} onClick={onClose} />
    </ClickOutside>
  );
}
