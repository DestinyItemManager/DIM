import React from 'react';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { ThunkDispatchProp, RootState } from 'app/store/reducers';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import ErrorPanel from './ErrorPanel';

interface StoreProps {
  accountsError?: DimError;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    accountsError: state.accounts.accountsError
  };
}

type Props = StoreProps & ThunkDispatchProp;

/**
 * A view for when there's been an error loading accounts or there are no accounts.
 */
function DefaultAccount({ accountsError }: Props) {
  return (
    <div className="dim-page">
      <ErrorPanel
        error={accountsError}
        fallbackMessage={t('Accounts.NoCharacters')}
        title={t('Accounts.ErrorLoading')}
        showTwitters={true}
        showReload={true}
      />
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(DefaultAccount);
