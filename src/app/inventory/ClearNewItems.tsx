import { t } from 'app/i18next-t';
import { clearAllNewItems } from 'app/inventory/actions';
import { settingsSelector } from 'app/settings/reducer';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import './ClearNewItems.scss';
import NewItemIndicator from './NewItemIndicator';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  showNewItems: boolean;
  hasNewItems: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    showNewItems: settingsSelector(state).showNewItems,
    hasNewItems: state.inventory.newItems.size > 0,
  };
}

const mapDispatchToProps = {
  clearAllNewItems,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

function ClearNewItems({ showNewItems, hasNewItems, clearAllNewItems }: Props) {
  if (!showNewItems || !hasNewItems) {
    return null;
  }

  return (
    <div className="clear-new-items">
      <GlobalHotkeys
        hotkeys={[
          {
            combo: 'x',
            description: t('Hotkey.ClearNewItems'),
            callback: clearAllNewItems,
          },
        ]}
      />
      <button type="button" onClick={clearAllNewItems} title={t('Hotkey.ClearNewItemsTitle')}>
        <NewItemIndicator className="new-item" /> <span>{t('Hotkey.ClearNewItems')}</span>
      </button>
    </div>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ClearNewItems);
