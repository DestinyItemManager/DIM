import { t } from 'app/i18next-t';
import { isD1Store } from 'app/inventory/stores-helpers';
import LoadoutPopup from 'app/loadout/loadout-menu/LoadoutPopup';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ClickOutside from '../dim-ui/ClickOutside';
import { DimStore } from '../inventory/store-types';
import { AppIcon, kebabIcon } from '../shell/icons';
import CharacterHeaderXPBar from './CharacterHeaderXP';
import CharacterTileButton from './CharacterTileButton';
import styles from './StoreHeading.m.scss';

interface Props {
  store: DimStore;
  /** If this ref is provided, the loadout menu will be placed inside of it instead of in this tile. */
  loadoutMenuRef?: React.RefObject<HTMLElement>;
  /** For mobile, this is whichever store is visible at the time. */
  selectedStore?: DimStore;
  /** Fires if a store other than the selected store is tapped. */
  onTapped?: (storeId: string) => void;
}

// Wrap the {CharacterTile} with a button for the loadout menu and the D1 XP progress bar
const CharacterHeader = forwardRef(function CharacterHeader(
  {
    store,
    onClick,
  }: {
    store: DimStore;
    onClick: () => void;
  },
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <CharacterTileButton ref={ref} character={store} onClick={onClick}>
      <div className={styles.loadoutButton}>
        <AppIcon icon={kebabIcon} title={t('Loadouts.Loadouts')} />
      </div>
      {!store.isVault && isD1Store(store) && <CharacterHeaderXPBar store={store} />}
    </CharacterTileButton>
  );
});

/**
 * This is the character dropdown used at the top of the inventory page.
 * It will render a {CharacterTile} in addition to a button for the loadout menu
 */
export default function StoreHeading({ store, selectedStore, loadoutMenuRef, onTapped }: Props) {
  const [loadoutMenuOpen, setLoadoutMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLDivElement>(null);

  const openLoadoutPopup = () => {
    if (store !== selectedStore && onTapped) {
      onTapped?.(store.id);
      return;
    }
    setLoadoutMenuOpen((open) => !open);
  };

  const clickOutsideLoadoutMenu = useCallback(() => {
    if (loadoutMenuOpen) {
      setLoadoutMenuOpen(false);
    }
  }, [loadoutMenuOpen]);

  let loadoutMenu: React.ReactNode | undefined;
  if (loadoutMenuOpen) {
    const menuContents = (
      <ClickOutside
        onClickOutside={clickOutsideLoadoutMenu}
        extraRef={menuTrigger}
        className={styles.loadoutMenu}
      >
        <LoadoutPopup dimStore={store} onClick={clickOutsideLoadoutMenu} />
      </ClickOutside>
    );

    loadoutMenu = loadoutMenuRef
      ? createPortal(menuContents, loadoutMenuRef.current!)
      : menuContents;
  }

  // TODO: aria "open"
  return (
    <div>
      <CharacterHeader store={store} ref={menuTrigger} onClick={openLoadoutPopup} />
      {loadoutMenu}
    </div>
  );
}
