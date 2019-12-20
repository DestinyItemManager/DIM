import React from 'react';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { setFarmingSetting } from '../settings/actions';
import _ from 'lodash';
import { farmingStoreSelector } from './reducer';
import { D2FarmingService } from './d2farming.service';
import './farming.scss';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface StoreProps {
  moveTokens: boolean;
  freeSlots: number;
  store?: DimStore;
}

function mapStateToProps() {
  const storeSelector = farmingStoreSelector();
  return (state: RootState): StoreProps => ({
    moveTokens: state.settings.farming.moveTokens,
    freeSlots: state.settings.farming.freeSlots,
    store: storeSelector(state)
  });
}

const mapDispatchToProps = {
  setFarmingSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

class D2Farming extends React.Component<Props> {
  render() {
    const { store, moveTokens } = this.props;

    return (
      <TransitionGroup component={null}>
        {store && (
          <CSSTransition clsx="farming" timeout={{ enter: 500, exit: 500 }}>
            <div id="item-farming" className="d2-farming">
              <span>
                <p>
                  {t('FarmingMode.D2Desc', {
                    store: store.name,
                    context: store.genderName
                  })}
                  {/*
                    t('FarmingMode.D2Desc_male')
                    t('FarmingMode.D2Desc_female')
                  */}
                </p>
                <p>
                  <input
                    name="move-tokens"
                    type="checkbox"
                    checked={moveTokens}
                    onChange={this.toggleMoveTokens}
                  />
                  <label htmlFor="move-tokens">{t('FarmingMode.MoveTokens')}</label>
                </p>
                <p>
                  <input
                    name="free-slots"
                    className="free-slots"
                    type="text"
                    value={this.props.freeSlots}
                    onChange={this.changeFreeSlots}
                    onFocus={(e) => e.target.select()}
                  />
                  <label htmlFor="free-slots">{t('FarmingMode.FreeSlots')}</label>
                </p>
              </span>

              <span>
                <button onClick={D2FarmingService.stop}>{t('FarmingMode.Stop')}</button>
              </span>
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    );
  }

  private toggleMoveTokens = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.checked;
    this.props.setFarmingSetting('moveTokens', value);
  };

  private changeFreeSlots = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.currentTarget.value, 10);
    const validValue = Number.isNaN(value) ? 1 : value < 0 ? 0 : value > 9 ? 9 : value;
    this.props.setFarmingSetting('freeSlots', validValue);
  };
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(D2Farming);
