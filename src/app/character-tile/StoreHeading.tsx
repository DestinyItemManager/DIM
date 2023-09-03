import { usePopper } from 'app/dim-ui/usePopper';
import { t } from 'app/i18next-t';
import { isD1Store } from 'app/inventory/stores-helpers';
import LoadoutPopup from 'app/loadout/loadout-menu/LoadoutPopup';
import { Portal } from 'app/utils/temp-container';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { DimStore } from '../inventory/store-types';
import { AppIcon, kebabIcon } from '../shell/icons';
import CharacterHeaderXPBar from './CharacterHeaderXP';
import CharacterTileButton from './CharacterTileButton';
import styles from './StoreHeading.m.scss';

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
});

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

  const menuRef = useRef<HTMLDivElement>(null);
  let loadoutMenu: React.ReactNode | undefined;
  if (loadoutMenuOpen) {
    const menuContents = (
      <ClickOutside
        onClickOutside={clickOutsideLoadoutMenu}
        ref={menuRef}
        extraRef={menuTrigger}
        className={styles.loadoutMenu}
      >
        <LoadoutPopup dimStore={store} onClick={clickOutsideLoadoutMenu} />
      </ClickOutside>
    );

    loadoutMenu = <Portal>{menuContents}</Portal>;
  }

  usePopper({
    contents: menuRef,
    reference: menuTrigger,
    placement: 'bottom-start',
    fixed: true,
    padding: 0,
  });

  // TODO: aria "open"
  return (
    <>
      <CharacterHeader store={store} ref={menuTrigger} onClick={openLoadoutPopup} />
      {loadoutMenu}
    </>
  );
}
