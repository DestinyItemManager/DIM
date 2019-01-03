import * as React from 'react';
import classNames from 'classnames';
import { DimStore, DimVault } from './store-types';
import PressTip from '../dim-ui/PressTip';
import { percent } from './dimPercentWidth.directive';
import { t } from 'i18next';
import glimmer from 'app/images/glimmer.png';
import legendaryMarks from 'app/images/legendaryMarks.png';
import legendaryShards from 'app/images/legendaryShards.png';
import { InventoryBucket } from './inventory-buckets';
import './StoreHeading.scss';
import CharacterStats from './CharacterStats';
import LoadoutPopup from '../loadout/LoadoutPopup';
import ClickOutside from '../dim-ui/ClickOutside';
import * as ReactDOM from 'react-dom';
import { AppIcon, powerActionIcon, openDropdownIcon } from '../shell/icons';

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
      <div className="background" style={{ backgroundImage: `url(${store.background})` }} />
    );
    const emblem = <div className="emblem" style={{ backgroundImage: `url(${store.icon})` }} />;

    // TODO: break up into some pure components

    if (isVault(store)) {
      return (
        <div className="character">
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
                <div className="bottom">
                  <div className="currency">
                    <img src={glimmer} />
                    {store.glimmer}
                  </div>
                  <div className="currency legendaryMarks">
                    <img src={store.isDestiny1() ? legendaryMarks : legendaryShards} />
                    {store.legendaryMarks}{' '}
                  </div>
                </div>
              </div>
              {loadoutButton}
            </div>
          </div>
          {loadoutMenu}
          <div className="vault-capacity">
            {Object.keys(store.vaultCounts).map((bucketId) => (
              <PressTip
                key={bucketId}
                tooltip={<VaultToolTip counts={store.vaultCounts[bucketId]} />}
              >
                <div
                  key={bucketId}
                  className={classNames('vault-bucket', {
                    'vault-bucket-full':
                      store.vaultCounts[bucketId].count ===
                      store.vaultCounts[bucketId].bucket.capacity
                  })}
                >
                  <div className="vault-bucket-tag">
                    {store.vaultCounts[bucketId].bucket.name.substring(0, 1)}
                  </div>
                  {store.vaultCounts[bucketId].count}/{store.vaultCounts[bucketId].bucket.capacity}
                </div>
              </PressTip>
            ))}
          </div>
        </div>
      );
    }

    const { levelBar, xpTillMote } = getLevelBar(store);

    return (
      <div className={classNames('character', { current: store.current })}>
        <div
          className={classNames('character-box', {
            destiny2: store.isDestiny2()
          })}
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
                <div className="level">{store.level}</div>
              </div>
            </div>
            {loadoutButton}
          </div>
          <PressTip tooltip={xpTillMote}>
            <div className="level-bar">
              <div
                className={classNames('level-bar-progress', {
                  'mote-progress': !store.percentToNextLevel
                })}
                style={{ width: percent(levelBar) }}
              />
            </div>
          </PressTip>
        </div>
        {loadoutMenu}
        <CharacterStats destinyVersion={store.destinyVersion} stats={store.stats} />
      </div>
    );
  }

  private openLoadoutPopup = (e) => {
    e.stopPropagation();

    const { store, selectedStore, onTapped } = this.props;
    const { loadoutMenuOpen } = this.state;

    if (store !== selectedStore && onTapped) {
      onTapped && onTapped(store.id);
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

function VaultToolTip({ counts }: { counts: { bucket: InventoryBucket; count: number } }) {
  return (
    <div>
      <h2>{counts.bucket.name}</h2>
      {counts.count}/{counts.bucket.capacity}
    </div>
  );
}

function getLevelBar(store: DimStore) {
  if (store.percentToNextLevel) {
    return {
      levelBar: store.percentToNextLevel,
      xpTillMote: undefined
    };
  }
  if (store.progression && store.progression.progressions) {
    const prestige = store.progression.progressions.find((p) => p.progressionHash === 2030054750);
    if (prestige) {
      return {
        xpTillMote: t(store.destinyVersion === 1 ? 'Stats.Prestige' : 'Stats.PrestigeD2', {
          level: prestige.level,
          exp: prestige.nextLevelAt - prestige.progressToNextLevel
        }),
        levelBar: prestige.progressToNextLevel / prestige.nextLevelAt
      };
    }
  }
  return {
    levelBar: 0,
    xpTillMote: undefined
  };
}
