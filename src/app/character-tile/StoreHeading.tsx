import React from 'react';
import clsx from 'clsx';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import './StoreHeading.scss';
import LoadoutPopup from '../loadout/LoadoutPopup';
import ClickOutside from '../dim-ui/ClickOutside';
import ReactDOM from 'react-dom';
import { AppIcon, openDropdownIcon } from '../shell/icons';
import { CharacterHeaderXPBar } from './CharacterHeaderXP';
import { CharacterTile } from './CharacterTile';

interface Props {
  store: DimStore;
  /** If this ref is provided, the loadout menu will be placed inside of it instead of in this tile. */
  loadoutMenuRef?: React.RefObject<HTMLElement>;
  /** For mobile, this is whichever store is visible at the time. */
  selectedStore?: DimStore;
  /** Fires if a store other than the selected store is tapped. */
  onTapped?(storeId: string): void;
}

interface State {
  loadoutMenuOpen: boolean;
}

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
      <AppIcon icon={openDropdownIcon} title={t('Loadouts.Loadouts')} />
    </div>
    {!store.isVault && store.isDestiny1() && <CharacterHeaderXPBar store={store} />}
  </div>
);

export default class StoreHeading extends React.Component<Props, State> {
  state: State = { loadoutMenuOpen: false };
  private menuTrigger = React.createRef<HTMLDivElement>();

  render() {
    const { store, loadoutMenuRef } = this.props;
    const { loadoutMenuOpen } = this.state;

    let loadoutMenu;
    if (loadoutMenuOpen) {
      const menuContents = (
        <ClickOutside onClickOutside={this.clickOutsideLoadoutMenu} className="loadout-menu">
          <LoadoutPopup dimStore={store} onClick={this.clickOutsideLoadoutMenu} />
        </ClickOutside>
      );

      loadoutMenu = loadoutMenuRef
        ? ReactDOM.createPortal(menuContents, loadoutMenuRef.current!)
        : menuContents;
    }

    return (
      <>
        <CharacterHeader
          store={store}
          loadoutMenuOpen={loadoutMenuOpen}
          menuRef={this.menuTrigger}
          onClick={this.openLoadoutPopup}
        />
        {loadoutMenu}
      </>
    );
  }

  private openLoadoutPopup = () => {
    const { store, selectedStore, onTapped } = this.props;
    const { loadoutMenuOpen } = this.state;

    if (store !== selectedStore && onTapped) {
      onTapped?.(store.id);
      return;
    }

    this.setState({ loadoutMenuOpen: !loadoutMenuOpen });
  };

  private clickOutsideLoadoutMenu = (e) => {
    if (!e || !this.menuTrigger.current || !this.menuTrigger.current.contains(e.target)) {
      this.setState({ loadoutMenuOpen: false });
    }
  };
}
