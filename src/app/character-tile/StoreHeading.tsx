import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import './StoreHeading.scss';
import LoadoutPopup from '../loadout/LoadoutPopup';
import ClickOutside from '../dim-ui/ClickOutside';
import ReactDOM from 'react-dom';
import { AppIcon, faEllipsisV } from '../shell/icons';
import CharacterHeaderXPBar from './CharacterHeaderXP';
import CharacterTile from './CharacterTile';

interface Props {
  store: DimStore;
  /** If this ref is provided, the loadout menu will be placed inside of it instead of in this tile. */
  loadoutMenuRef?: React.RefObject<HTMLElement>;
  /** For mobile, this is whichever store is visible at the time. */
  selectedStore?: DimStore;
  /** Fires if a store other than the selected store is tapped. */
  onTapped?(storeId: string): void;
}

// Wrap the {CharacterTile} with a button for the loadout menu and the D1 XP progress bar
const CharacterHeader = ({
  store,
  loadoutMenuOpen,
  menuRef,
  onClick,
}: {
  store: DimStore;
  loadoutMenuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  onClick: () => void;
}) => (
  <div
    className={clsx('character', {
      current: store.current,
      destiny1: store.isDestiny1(),
      destiny2: store.isDestiny2(),
      vault: store.isVault,
    })}
    ref={menuRef}
    onClick={onClick}
  >
    <CharacterTile store={store} />
    <div
      className={clsx('loadout-button', {
        'loadout-open': loadoutMenuOpen,
      })}
    >
      <AppIcon icon={faEllipsisV} title={t('Loadouts.Loadouts')} />
    </div>
    {!store.isVault && store.isDestiny1() && <CharacterHeaderXPBar store={store} />}
  </div>
);

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

  const clickOutsideLoadoutMenu = (e) => {
    if (!e || !menuTrigger.current || !menuTrigger.current.contains(e.target)) {
      setLoadoutMenuOpen(false);
    }
  };

  let loadoutMenu: React.ReactNode | undefined;
  if (loadoutMenuOpen) {
    const menuContents = (
      <ClickOutside onClickOutside={clickOutsideLoadoutMenu} className="loadout-menu">
        <LoadoutPopup dimStore={store} onClick={clickOutsideLoadoutMenu} />
      </ClickOutside>
    );

    loadoutMenu = loadoutMenuRef
      ? ReactDOM.createPortal(menuContents, loadoutMenuRef.current!)
      : menuContents;
  }

  return (
    <div>
      <CharacterHeader
        store={store}
        loadoutMenuOpen={loadoutMenuOpen}
        menuRef={menuTrigger}
        onClick={openLoadoutPopup}
      />
      {loadoutMenu}
    </div>
  );
}
