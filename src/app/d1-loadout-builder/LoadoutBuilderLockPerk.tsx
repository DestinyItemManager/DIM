import React from 'react';
import { ArmorTypes, D1ItemWithNormalStats, LockedPerkHash, PerkCombination } from './types';
import { D1GridNode, DimItem } from '../inventory/item-types';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, plusIcon } from '../shell/icons';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import _ from 'lodash';
import LoadoutBuilderLocksDialog from './LoadoutBuilderLocksDialog';
import { t } from 'app/i18next-t';
import LoadoutBucketDropTarget from './LoadoutBuilderDropTarget';

interface Props {
  type: ArmorTypes;
  lockeditem: D1ItemWithNormalStats | null;
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  activePerks: PerkCombination;
  i18nItemNames: { [key: string]: string };
  onRemove({ type }: { type: string }): void;
  onPerkLocked(perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent): void;
  onItemLocked(item: DimItem): void;
}

interface State {
  dialogOpen: boolean;
}

export default class LoadoutBuilderLockPerk extends React.Component<Props, State> {
  state: State = { dialogOpen: false };
  render() {
    const {
      type,
      lockeditem,
      i18nItemNames,
      activePerks,
      lockedPerks,
      onRemove,
      onItemLocked
    } = this.props;
    const { dialogOpen } = this.state;

    return (
      <div className="locked-item">
        <LoadoutBucketDropTarget bucketType={type} onItemLocked={onItemLocked}>
          {lockeditem === null ? (
            <div className="empty-item">
              <div className="perk-addition" onClick={this.addPerkClicked}>
                {this.hasLockedPerks(type) ? (
                  <div className="locked-perk-notification">
                    <BungieImage
                      src={this.getFirstPerk(type).icon}
                      title={this.getFirstPerk(type).description}
                    />
                  </div>
                ) : (
                  <div className="perk-addition-text-container">
                    <AppIcon icon={plusIcon} />
                    <small className="perk-addition-text">{t('LB.LockPerk')}</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lock-container">
              <LoadoutBuilderItem item={lockeditem} />
              <div
                className="close"
                onClick={() => onRemove({ type })}
                role="button"
                tabIndex={0}
              />
            </div>
          )}
          <div className="label">{i18nItemNames[type]}</div>
          {dialogOpen && (
            <LoadoutBuilderLocksDialog
              activePerks={activePerks}
              lockedPerks={lockedPerks}
              type={type}
              onPerkLocked={this.onPerkLocked}
              onClose={this.closeDialog}
            />
          )}
        </LoadoutBucketDropTarget>
      </div>
    );
  }

  private onPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    this.closeDialog();
    this.props.onPerkLocked(perk, type, $event);
  };

  private getFirstPerk = (type: ArmorTypes) => {
    const { lockedPerks } = this.props;
    return lockedPerks[type][_.keys(lockedPerks[type])[0]];
  };

  private hasLockedPerks(type: ArmorTypes) {
    const { lockedPerks } = this.props;
    return _.keys(lockedPerks[type]).length > 0;
  }

  private addPerkClicked = () => this.setState({ dialogOpen: true });

  private closeDialog = () => this.setState({ dialogOpen: false });
}
