import React, { useRef } from 'react';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import _ from 'lodash';
import { farmingStoreSelector } from './reducer';
import { D2FarmingService } from './d2farming.service';
import './farming.scss';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface StoreProps {
  store?: DimStore;
}

function mapStateToProps() {
  const storeSelector = farmingStoreSelector();
  return (state: RootState): StoreProps => ({
    store: storeSelector(state),
  });
}

type Props = StoreProps;

function D2Farming({ store }: Props) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <TransitionGroup component={null}>
      {store && (
        <CSSTransition nodeRef={nodeRef} classNames="farming" timeout={{ enter: 500, exit: 500 }}>
          <div ref={nodeRef} id="item-farming" className="d2-farming">
            <span>
              <p>
                {t('FarmingMode.D2Desc', {
                  store: store.name,
                  context: store.genderName,
                })}
                {/*
                    t('FarmingMode.D2Desc_male')
                    t('FarmingMode.D2Desc_female')
                  */}
              </p>
            </span>

            <span>
              <button type="button" onClick={D2FarmingService.stop}>
                {t('FarmingMode.Stop')}
              </button>
            </span>
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}

export default connect<StoreProps>(mapStateToProps)(D2Farming);
