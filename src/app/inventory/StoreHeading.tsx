import React from 'react';
import clsx from 'clsx';
import { DimStore, DimVault } from './store-types';
import PressTip from '../dim-ui/PressTip';
import { t } from 'app/i18next-t';
import './StoreHeading.scss';
import LoadoutPopup from '../loadout/LoadoutPopup';
import ClickOutside from '../dim-ui/ClickOutside';
import ReactDOM from 'react-dom';
import { AppIcon, powerActionIcon, openDropdownIcon } from '../shell/icons';
import { percent } from '../shell/filters';

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

function isVault(store: DimStore): store is DimVault {
  return store.isVault;
}

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

    const loadoutButton = (
      <AppIcon className="loadout-button" icon={openDropdownIcon} title={t('Loadouts.Loadouts')} />
    );
    const background = (
      <div className="background" style={{ backgroundImage: `url("${store.background}")` }} />
    );
    const emblem = <div className="emblem" style={{ backgroundImage: `url("${store.icon}")` }} />;

    // TODO: break up into some pure components

    if (isVault(store)) {
      return (
        <div className="character" aria-label={store.name}>
          <div
            className="character-box vault"
            ref={this.menuTrigger}
            onClick={this.openLoadoutPopup}
          >
            {background}
            <div className="details">
              {emblem}
              <div className="character-text">
                <div className="top">
                  <div className="class">{store.className}</div>
                </div>
              </div>
              {loadoutButton}
            </div>
          </div>
          {loadoutMenu}
        </div>
      );
    }

    const { levelBar, xpTillMote } = getLevelBar(store);

    return (
      <div className={clsx('character', { current: store.current })}>
        <div
          className={clsx('character-box', {
            destiny2: store.isDestiny2()
          })}
          aria-label={store.name}
          onClick={this.openLoadoutPopup}
          ref={this.menuTrigger}
        >
          {background}
          <div className="details">
            {emblem}
            <div className="character-text">
              <div className="top">
                <div className="class">{store.className}</div>
                <div className="powerLevel">
                  <AppIcon icon={powerActionIcon} />
                  {store.powerLevel}
                </div>
              </div>
              <div className="bottom">
                <div className="race-gender">{store.genderRace}</div>
                {store.isDestiny1() && store.level < 40 && (
                  <div className="level">{store.level}</div>
                )}
              </div>
            </div>
            {loadoutButton}
          </div>
          {store.isDestiny1() && (
            <PressTip tooltip={xpTillMote}>
              <div className="level-bar">
                <div
                  className={clsx('level-bar-progress', {
                    'mote-progress': !store.percentToNextLevel
                  })}
                  style={{ width: percent(levelBar) }}
                />
              </div>
            </PressTip>
          )}
        </div>
        {loadoutMenu}
      </div>
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

function getLevelBar(store: DimStore) {
  if (store.isDestiny2()) {
    return {
      levelBar: 0,
      xpTillMote: undefined
    };
  }
  if (store.percentToNextLevel) {
    return {
      levelBar: store.percentToNextLevel,
      xpTillMote: undefined
    };
  }
  if (store.progression?.progressions) {
    const prestige = store.progression.progressions.find((p) => p.progressionHash === 2030054750);
    if (prestige) {
      const data = {
        level: prestige.level,
        exp: prestige.nextLevelAt - prestige.progressToNextLevel
      };
      return {
        xpTillMote: t('Stats.Prestige', data),
        levelBar: prestige.progressToNextLevel / prestige.nextLevelAt
      };
    }
  }
  return {
    levelBar: 0,
    xpTillMote: undefined
  };
}
