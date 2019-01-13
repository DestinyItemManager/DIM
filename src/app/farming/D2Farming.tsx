import * as React from 'react';
import { D2Store } from '../inventory/store-types';
import { t } from 'i18next';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { setFarmingSetting } from '../settings/actions';
import * as _ from 'lodash';
import { destinyVersionSelector } from '../accounts/reducer';
import { farmingStoreSelector } from './reducer';
import { D2FarmingService } from './d2farming.service';
import './farming.scss';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface StoreProps {
  moveTokens: boolean;
  store?: D2Store;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    moveTokens: state.settings.farming.moveTokens,
    store:
      destinyVersionSelector(state) === 2 ? (farmingStoreSelector(state) as D2Store) : undefined
  };
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
          <CSSTransition classNames="farming" timeout={{ enter: 500, exit: 500 }}>
            <div id="item-farming" className="d2-farming">
              <span>
                <p>
                  {t('FarmingMode.D2Desc', {
                    store: store.name,
                    context: store.gender
                  })}
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
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(D2Farming);
