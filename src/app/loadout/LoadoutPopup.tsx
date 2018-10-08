import * as React from 'react';
import { copy as angularCopy } from 'angular';
import { t } from 'i18next';
import './loadout-popup.scss';
import { DimStore } from '../inventory/store-types';
import { Loadout, getLight, dimLoadoutService } from './loadout.service';
import { RootState } from '../store/reducers';
import { previousLoadoutSelector, loadoutsSelector } from './reducer';
import { currentAccountSelector } from '../accounts/reducer';
import { getBuckets as d2GetBuckets } from '../destiny2/d2-buckets.service';
import { getBuckets as d1GetBuckets } from '../destiny1/d1-buckets.service';
import * as _ from 'underscore';
import { connect } from 'react-redux';
import {
  maxLightLoadout,
  itemLevelingLoadout,
  gatherEngramsLoadout,
  gatherTokensLoadout,
  searchLoadout
} from './auto-loadouts';
import { querySelector } from '../shell/reducer';
import { newLoadout } from './loadout-utils';
import { toaster } from '../ngimport-more';
import { $rootScope } from 'ngimport';
import { D1FarmingService } from '../farming/farming.service';
import { D2FarmingService } from '../farming/d2farming.service';
import { makeRoomForPostmaster, pullFromPostmaster, pullablePostmasterItems } from './postmaster';
import { queueAction } from '../inventory/action-queue';
import { dimItemService } from '../inventory/dimItemService.factory';
import { getPlatformMatching } from '../accounts/platform.service';
import { router } from '../../router';
// tslint:disable-next-line:no-implicit-dependencies
import engramSvg from '../../images/engram.svg';

interface ProvidedProps {
  dimStore: DimStore;
  onClick(e): void;
}

interface StoreProps {
  previousLoadout?: Loadout;
  loadouts: Loadout[];
  query: string;
  classTypeId: number;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState, ownProps: ProvidedProps): StoreProps {
  const loadouts = loadoutsSelector(state);
  const currentAccount = currentAccountSelector(state)!;
  const { dimStore } = ownProps;

  let classTypeId = {
    warlock: 0,
    titan: 1,
    hunter: 2
  }[dimStore.class];
  if (classTypeId === undefined) {
    classTypeId = -1;
  }

  const loadoutsForPlatform = _.sortBy(loadouts, 'name').filter((loadout: Loadout) => {
    return (
      (dimStore.destinyVersion === 2
        ? loadout.destinyVersion === 2
        : loadout.destinyVersion !== 2) &&
      (loadout.platform === undefined || loadout.platform === currentAccount.platformLabel) &&
      (classTypeId === -1 || loadout.classType === -1 || loadout.classType === classTypeId)
    );
  });

  return {
    previousLoadout: previousLoadoutSelector(state, ownProps.dimStore.id),
    loadouts: loadoutsForPlatform,
    query: querySelector(state),
    classTypeId
  };
}

class LoadoutPopup extends React.Component<Props> {
  componentDidMount() {
    // Need this to poke the state
    dimLoadoutService.getLoadouts();
  }

  render() {
    const { dimStore, previousLoadout, loadouts, query, onClick } = this.props;

    // TODO: it'd be nice to memoize some of this - we'd need a memoized map of selectors!
    const hasClassified = dimStore
      .getStoresService()
      .getAllItems()
      .some((i) => {
        return (
          i.classified &&
          (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
        );
      });

    const maxLightValue =
      getLight(dimStore, maxLightLoadout(dimStore.getStoresService(), dimStore)) +
      (hasClassified ? '*' : '');

    const numPostmasterItems = dimStore.isDestiny2() ? pullablePostmasterItems(dimStore).length : 0;

    // TODO: kill dim-save-loadout dim-edit-loadout

    return (
      <div className="loadout-popup-content" onClick={onClick}>
        <ul className="loadout-list">
          <li className="loadout-set">
            <span onClick={this.newLoadout}>
              <i className="fa fa-plus-circle" />
              <span>{t('Loadouts.Create')}</span>
            </span>
            <span onClick={this.newLoadoutFromEquipped}>{t('Loadouts.FromEquipped')}</span>
          </li>

          {query.length > 0 && (
            <li className="loadout-set">
              <span onClick={this.searchLoadout}>
                <i className="fa fa-search" />
                <span>{t('Loadouts.ApplySearch', { query })}</span>
              </span>
            </li>
          )}

          {!dimStore.isVault && (
            <>
              <li className="loadout-set">
                <span onClick={this.maxLightLoadout}>
                  <span className="light" press-tip={hasClassified ? t('Loadouts.Classified') : ''}>
                    {maxLightValue}
                  </span>
                  <i className="fa">✦</i>
                  <span>
                    {t(
                      dimStore.destinyVersion === 2
                        ? 'Loadouts.MaximizePower'
                        : 'Loadouts.MaximizeLight'
                    )}
                  </span>
                </span>
              </li>

              {dimStore.isDestiny1() && (
                <>
                  <li className="loadout-set">
                    <span onClick={this.itemLevelingLoadout}>
                      <i className="fa fa-level-up" />
                      <span>{t('Loadouts.ItemLeveling')}</span>
                    </span>
                  </li>

                  <li className="loadout-set">
                    <span onClick={this.makeRoomForPostmaster}>
                      <i className="fa fa-envelope" />
                      <span>{t('Loadouts.MakeRoom')}</span>
                    </span>
                  </li>
                </>
              )}

              {dimStore.isDestiny2() &&
                numPostmasterItems > 0 && (
                  <li className="loadout-set">
                    <span onClick={this.pullFromPostmaster}>
                      <i className="fa fa-envelope" />
                      <span className="badge">{numPostmasterItems}</span>{' '}
                      <span>{t('Loadouts.PullFromPostmaster')}</span>
                    </span>
                    <span onClick={this.makeRoomForPostmaster}>{t('Loadouts.PullMakeSpace')}</span>
                  </li>
                )}
            </>
          )}

          {dimStore.isDestiny1() && (
            <li className="loadout-set">
              <span onClick={(e) => this.gatherEngramsLoadout(e, { exotics: true })}>
                <img className="fa" src={engramSvg} height="12" width="12" />
                <span>{t('Loadouts.GatherEngrams')}</span>
              </span>
              <span onClick={(e) => this.gatherEngramsLoadout(e, { exotics: false })}>
                <i className="fa fa-ban" /> <span>{t('Loadouts.GatherEngramsExceptExotics')}</span>
              </span>
            </li>
          )}

          {dimStore.isDestiny2() && (
            <li className="loadout-set">
              <span onClick={this.gatherTokensLoadout}>
                <i className="fa fa-arrow-circle-o-up" />
                <span>{t('Loadouts.GatherTokens')}</span>
              </span>
            </li>
          )}

          {!dimStore.isVault && (
            <li className="loadout-set">
              <span onClick={this.startFarming}>
                <img className="fa" src={engramSvg} height="12" width="12" />
                <span>{t('FarmingMode.FarmingMode')}</span>
              </span>
            </li>
          )}

          {previousLoadout && (
            <li className="loadout-set">
              <span
                title={previousLoadout.name}
                onClick={(e) => this.applyLoadout(previousLoadout, e, true)}
              >
                <i className="fa fa-undo" />
                {previousLoadout.name}
              </span>
              <span onClick={(e) => this.applyLoadout(previousLoadout, e)}>
                <span>{t('Loadouts.RestoreAllItems')}</span>
              </span>
            </li>
          )}

          {loadouts.map((loadout) => (
            <li key={loadout.id} className="loadout-set">
              <span title={loadout.name} onClick={(e) => this.applyLoadout(loadout, e)}>
                {loadout.name}
              </span>
              <span
                className="delete"
                title={t('Loadouts.Delete')}
                onClick={() => this.deleteLoadout(loadout)}
              >
                <i className="fa fa-trash-o" />
              </span>
              <span title={t('Loadouts.Edit')} onClick={() => this.editLoadout(loadout)}>
                <i className="fa fa-pencil" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  private newLoadout = () => {
    this.editLoadout(newLoadout('', {}));
  };

  private newLoadoutFromEquipped = () => {
    const { dimStore, classTypeId } = this.props;

    const loadout = filterLoadoutToEquipped(dimStore.loadoutFromCurrentlyEquipped(''));
    // We don't want to prepopulate the loadout with a bunch of cosmetic junk
    // like emblems and ships and horns.
    loadout.items = _.pick(
      loadout.items,
      'class',
      'kinetic',
      'energy',
      'power',
      'primary',
      'special',
      'heavy',
      'helmet',
      'gauntlets',
      'chest',
      'leg',
      'classitem',
      'artifact',
      'ghost'
    );
    loadout.classType = classTypeId;
    this.editLoadout(loadout);
  };

  private deleteLoadout = (loadout: Loadout) => {
    if (confirm(t('Loadouts.ConfirmDelete', { name: loadout.name }))) {
      dimLoadoutService.deleteLoadout(loadout).catch((e) => {
        toaster.pop(
          'error',
          t('Loadouts.DeleteErrorTitle'),
          t('Loadouts.DeleteErrorDescription', {
            loadoutName: loadout.name,
            error: e.message
          })
        );
        console.error(e);
      });
    }
  };

  private editLoadout = (loadout: Loadout) => {
    $rootScope.$broadcast('dim-edit-loadout', {
      loadout,
      showClass: true
    });
  };

  // TODO: move all these fancy loadouts to a new service

  private applyLoadout = (loadout: Loadout, e, filterToEquipped = false) => {
    const { dimStore } = this.props;
    e.preventDefault();
    D1FarmingService.stop();
    D2FarmingService.stop();

    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    return dimLoadoutService.applyLoadout(dimStore, loadout, true);
  };

  // A dynamic loadout set up to level weapons and armor
  private itemLevelingLoadout = (e) => {
    const { dimStore } = this.props;
    const loadout = itemLevelingLoadout(dimStore.getStoresService(), dimStore);
    this.applyLoadout(loadout, e);
  };

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  private maxLightLoadout = (e) => {
    const { dimStore } = this.props;
    const loadout = maxLightLoadout(dimStore.getStoresService(), dimStore);
    this.applyLoadout(loadout, e);
  };

  // A dynamic loadout set up to level weapons and armor
  private gatherEngramsLoadout = (e, options: { exotics: boolean } = { exotics: false }) => {
    const { dimStore } = this.props;
    let loadout;
    try {
      loadout = gatherEngramsLoadout(dimStore.getStoresService(), options);
    } catch (e) {
      toaster.pop('warning', t('Loadouts.GatherEngrams'), e.message);
      return;
    }
    this.applyLoadout(loadout, e);
  };

  private gatherTokensLoadout = (e) => {
    const { dimStore } = this.props;
    let loadout;
    try {
      loadout = gatherTokensLoadout(dimStore.getStoresService());
    } catch (e) {
      toaster.pop('warning', t('Loadouts.GatherTokens'), e.message);
      return;
    }
    this.applyLoadout(loadout, e);
  };

  // Move items matching the current search. Max 9 per type.
  private searchLoadout = (e) => {
    const { dimStore } = this.props;
    const loadout = searchLoadout(dimStore.getStoresService(), dimStore);
    this.applyLoadout(loadout, e);
  };

  private makeRoomForPostmaster = () => {
    const { dimStore } = this.props;
    const bucketsService = dimStore.destinyVersion === 1 ? d1GetBuckets : d2GetBuckets;
    return queueAction(() => makeRoomForPostmaster(dimStore, toaster, bucketsService));
  };

  private pullFromPostmaster = () => {
    const { dimStore } = this.props;
    return queueAction(() => pullFromPostmaster(dimStore, dimItemService, toaster));
  };

  private startFarming = () => {
    const { dimStore } = this.props;
    (dimStore.isDestiny2() ? D2FarmingService : D1FarmingService).start(
      getPlatformMatching({
        membershipId: router.globals.params.membershipId,
        platformType: router.globals.params.platformType
      })!,
      dimStore.id
    );
  };
}

export default connect<StoreProps>(mapStateToProps)(LoadoutPopup);

function filterLoadoutToEquipped(loadout: Loadout) {
  const filteredLoadout = angularCopy(loadout);
  filteredLoadout.items = _.mapObject(filteredLoadout.items, (items) =>
    items.filter((i) => i.equipped)
  );
  return filteredLoadout;
}
