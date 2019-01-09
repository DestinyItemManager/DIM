import * as React from 'react';
import { D2Store } from '../inventory/store-types';
import { t } from 'i18next';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { setFarmingSetting } from '../settings/actions';
import * as _ from 'lodash';
import { destinyVersionSelector } from '../accounts/reducer';
import { farmingStoreSelector } from './reducer';
import './farming.scss';
import { D1FarmingService } from './farming.service';

interface StoreProps {
  makeRoomForItems: boolean;
  store?: D2Store;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    makeRoomForItems: state.settings.farming.makeRoomForItems,
    store:
      destinyVersionSelector(state) === 2 ? (farmingStoreSelector(state) as D2Store) : undefined
  };
}

const mapDispatchToProps = {
  setFarmingSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

class D1Farming extends React.Component<Props> {
  render() {
    const { store, makeRoomForItems } = this.props;
    if (!store) {
      return null;
    }

    return (
      <div id="item-farming">
        <div>
          <p>
            {t(makeRoomForItems ? 'FarmingMode.Desc' : 'FarmingMode.MakeRoom.Desc', {
              store: store.name,
              context: store.gender
            })}
          </p>
          <div className="item-details">
            <div>
              <p>{t('FarmingMode.Configuration')}</p>
              <p>
                <input
                  name="make-room-for-items"
                  type="checkbox"
                  checked={makeRoomForItems}
                  onChange={this.makeRoomForItemsChanged}
                />
                <label htmlFor="make-room-for-items" title={t('FarmingMode.MakeRoom.Tooltip')}>
                  {t('FarmingMode.MakeRoom.MakeRoom')}
                </label>
              </p>
            </div>
            <span>
              <button onClick={D1FarmingService.stop}>{t('FarmingMode.Stop')}</button>
            </span>
          </div>
        </div>
      </div>
    );
  }

  private makeRoomForItemsChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.checked;
    this.props.setFarmingSetting('makeRoomForItems', value);
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(D1Farming);
