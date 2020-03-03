import React from 'react';
import './loadout-builder.scss';
import { D1Item } from '../../inventory/item-types';
import { SetType, ArmorSet } from './types';
import _ from 'lodash';
import { DimStore } from '../../inventory/store-types';
import { t } from 'app/i18next-t';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import { AppIcon, faMinusSquare, faPlusSquare } from '../../shell/icons';
import CharacterStats from '../../inventory/CharacterStats';
import ItemTalentGrid from '../../item-popup/ItemTalentGrid';
import { newLoadout } from '../../loadout/loadout-utils';
import copy from 'fast-copy';
import { LoadoutClass, Loadout } from 'app/loadout/loadout-types';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import { applyLoadout } from 'app/loadout/loadout-apply';

interface Props {
  store: DimStore;
  setType: SetType;
  activesets: string;
  excludeItem(item: D1Item): void;
}

interface State {
  collapsed: boolean;
}

export default class GeneratedSet extends React.Component<Props, State> {
  state: State = { collapsed: true };
  render() {
    const { setType, store, activesets, excludeItem } = this.props;
    const { collapsed } = this.state;

    return (
      <div key={setType.set.setHash} className="section loadout">
        <div className="loadout-builder-controls">
          {setType.set.includesVendorItems ? (
            <span>{t('LB.ContainsVendorItems')}</span>
          ) : (
            <>
              <span className="dim-button" onClick={() => this.newLoadout(setType.set)}>
                {t('Loadouts.Create')}
              </span>
              <span
                className="dim-button equip-button"
                onClick={() => this.equipItems(setType.set)}
              >
                {t('LB.Equip', { character: store.name })}
              </span>
            </>
          )}{' '}
          <div className="dim-stats">
            <CharacterStats destinyVersion={1} stats={setType.tiers[activesets].stats} />
          </div>
        </div>
        <div className="loadout-builder-section">
          {_.map(setType.set.armor, (armorpiece, type) => (
            <div key={type} className="set-item">
              <LoadoutBuilderItem shiftClickCallback={excludeItem} item={armorpiece.item} />
              <div className="smaller">
                <ItemTalentGrid item={armorpiece.item} perksOnly={true} />
              </div>
              <div className="label">
                <small>
                  {setType.tiers[activesets].configs[0][armorpiece.item.type] === 'int'
                    ? t('Stats.Intellect')
                    : setType.tiers[activesets].configs[0][armorpiece.item.type] === 'dis'
                    ? t('Stats.Discipline')
                    : setType.tiers[activesets].configs[0][armorpiece.item.type] === 'str'
                    ? t('Stats.Strength')
                    : t('Stats.NoBonus')}
                </small>
              </div>
              {setType.tiers[activesets].configs.map(
                (config, i) =>
                  i > 0 &&
                  !collapsed && (
                    <div key={i} className="other-configs">
                      <small>
                        {config[armorpiece.item.type] === 'int'
                          ? t('Stats.Intellect')
                          : config[armorpiece.item.type] === 'dis'
                          ? t('Stats.Discipline')
                          : config[armorpiece.item.type] === 'str'
                          ? t('Stats.Strength')
                          : t('Stats.NoBonus')}
                      </small>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>
        {setType.tiers[activesets].configs.length > 1 && (
          <div className="expand-configs" onClick={this.toggle}>
            {!collapsed ? (
              <div>
                <span title={t('LB.HideConfigs')}>
                  <AppIcon icon={faMinusSquare} />
                </span>{' '}
                {t('LB.HideAllConfigs')}
              </div>
            ) : (
              <div>
                <span title={t('LB.ShowConfigs')}>
                  <AppIcon icon={faPlusSquare} />
                </span>{' '}
                {t('LB.ShowAllConfigs')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  private toggle = () => this.setState((state) => ({ collapsed: !state.collapsed }));

  private newLoadout = (set: ArmorSet) => {
    const loadout = newLoadout('', {});
    loadout.classType = LoadoutClass[this.props.store.class];
    const items = _.pick(
      set.armor,
      'Helmet',
      'Chest',
      'Gauntlets',
      'Leg',
      'ClassItem',
      'Ghost',
      'Artifact'
    );
    _.forIn(items, (itemContainer, itemType) => {
      loadout.items[itemType.toString().toLowerCase()] = [itemContainer.item];
    });

    editLoadout(loadout, {
      equipAll: true,
      showClass: false
    });
  };
  private equipItems = (set: ArmorSet) => {
    let loadout: Loadout = newLoadout(t('Loadouts.AppliedAuto'), {});
    loadout.classType = LoadoutClass[this.props.store.class];
    const items = _.pick(
      set.armor,
      'Helmet',
      'Chest',
      'Gauntlets',
      'Leg',
      'ClassItem',
      'Ghost',
      'Artifact'
    );
    loadout.items.helmet = [items.Helmet.item];
    loadout.items.chest = [items.Chest.item];
    loadout.items.gauntlets = [items.Gauntlets.item];
    loadout.items.leg = [items.Leg.item];
    loadout.items.classitem = [items.ClassItem.item];
    loadout.items.ghost = [items.Ghost.item];
    loadout.items.artifact = [items.Artifact.item];

    loadout = copy(loadout);

    _.forIn(loadout.items, (val) => {
      val[0].equipped = true;
    });

    return applyLoadout(this.props.store, loadout, true);
  };
}
