import * as React from 'react';
import classNames from 'classnames';
import { DimStore, DimVault } from './store-types';
import PressTip from '../dim-ui/PressTip';
import { percent } from './dimPercentWidth.directive';
import { t } from 'i18next';
// tslint:disable-next-line:no-implicit-dependencies
import glimmer from 'app/images/glimmer.png';
// tslint:disable-next-line:no-implicit-dependencies
import legendaryMarks from 'app/images/legendaryMarks.png';
// tslint:disable-next-line:no-implicit-dependencies
import legendaryShards from 'app/images/legendaryShards.png';
import { InventoryBucket } from './inventory-buckets';
import { ngDialog } from '../ngimport-more';
import dialogTemplate from './dimStoreHeading.directive.dialog.html';
import './StoreHeading.scss';
import CharacterStats from './CharacterStats';

interface Props {
  store: DimStore;
  internalLoadoutMenu: boolean;
  selectedStore?: DimStore;
  onTapped?(): void;
}

function isVault(store: DimStore): store is DimVault {
  return store.isVault;
}

export default class StoreHeading extends React.Component<Props> {
  private dialogResult: any = null;

  render() {
    const { store, internalLoadoutMenu } = this.props;

    if (isVault(store)) {
      return (
        <div className="character">
          <div className="character-box vault" onClick={this.openLoadoutPopup}>
            <div className="background" style={{ backgroundImage: `url(${store.background})` }} />
            <div className="details">
              <div className="emblem" style={{ backgroundImage: `url(${store.icon})` }} />
              <div className="character-text">
                <div className="top">
                  <div className="class">{store.className}</div>
                </div>
                <div className="bottom" />
              </div>
              <div className="currencies">
                <div className="currency">
                  {store.glimmer} <img src={glimmer} />
                </div>
                <div className="currency legendaryMarks">
                  {store.legendaryMarks}{' '}
                  <img src={store.isDestiny1() ? legendaryMarks : legendaryShards} />
                </div>
              </div>
              <i
                className="loadout-button fa fa-chevron-circle-down"
                title={t('Loadouts.Loadouts')}
              />
            </div>
          </div>
          {internalLoadoutMenu && <div className="loadout-menu" loadout-id={store.id} />}
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
        >
          <div className="background" style={{ backgroundImage: `url(${store.background})` }} />
          <div className="details">
            <div className="emblem" style={{ backgroundImage: `url(${store.icon})` }} />
            <div className="character-text">
              <div className="top">
                <div className="class">{store.className}</div>
                <div className="powerLevel">{store.powerLevel}</div>
              </div>
              <div className="bottom">
                <div className="race-gender">{store.genderRace}</div>
                <div className="level">{store.level}</div>
              </div>
              <PressTip tooltip={xpTillMote}>
                <div
                  className={classNames('levelBar', {
                    moteProgress: !store.percentToNextLevel
                  })}
                  style={{ width: percent(levelBar) }}
                />
              </PressTip>
            </div>
            <i
              className="loadout-button fa fa-chevron-circle-down"
              ng-i18next="[title]Loadouts.Loadouts"
            />
          </div>
        </div>
        {internalLoadoutMenu && <div className="loadout-menu" loadout-id={store.id} />}
        <CharacterStats destinyVersion={store.destinyVersion} stats={store.stats} />
      </div>
    );
  }

  private openLoadoutPopup = (e) => {
    e.stopPropagation();

    const { store, internalLoadoutMenu, selectedStore, onTapped } = this.props;

    if (store !== selectedStore && !internalLoadoutMenu) {
      onTapped && onTapped();
      return;
    }

    if (this.dialogResult === null) {
      ngDialog.closeAll();
      this.dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        appendTo: `div[loadout-id="${store.id}"]`,
        overlay: false,
        className: 'loadout-popup',
        showClose: false,
        data: store
      });

      this.dialogResult.closePromise.then(() => {
        this.dialogResult = null;
      });
    } else {
      this.dialogResult.close();
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
