import { t } from 'app/i18next-t';
import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { ArmorSet, StatTypes, LockedMap, LockedArmor2ModMap } from '../types';
import { WindowScroller, List } from 'react-virtualized';
import GeneratedSet from './GeneratedSet';
import { newLoadout } from 'app/loadout/loadout-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import styles from './GeneratedSets.m.scss';
import _ from 'lodash';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { LoadoutBuilderAction } from '../LoadoutBuilder';

interface Props {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  isPhonePortrait: boolean;
  lockedMap: LockedMap;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  enabledStats: Set<StatTypes>;
  lockedArmor2Mods: LockedArmor2ModMap;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

interface State {
  rowHeight: number;
  rowWidth: number;
  rowColumns: number;
}

function numColumns(set: ArmorSet) {
  return _.sumBy(
    set.firstValidSet,
    (item) =>
      (item.isDestiny2() &&
        item.sockets &&
        _.max(item.sockets.categories.map((c) => c.sockets.length))) ||
      0
  );
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = { rowHeight: 0, rowWidth: 0, rowColumns: 0 };
  private windowScroller = React.createRef<WindowScroller>();

  private handleWindowResize = _.throttle(() => this.setState({ rowHeight: 0, rowWidth: 0 }), 300, {
    leading: false,
    trailing: true,
  });

  constructor(props: Props) {
    super(props);
    this.state.rowColumns = this.props.sets.reduce(
      (memo, set) => Math.max(memo, numColumns(set)),
      0
    );
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate(prevProps: Props) {
    this.windowScroller.current?.updatePosition();
    if (this.props.sets !== prevProps.sets) {
      const maxColumns = this.props.sets.reduce((memo, set) => Math.max(memo, numColumns(set)), 0);
      if (this.state.rowColumns !== maxColumns) {
        this.setState({ rowHeight: 0, rowWidth: 0, rowColumns: maxColumns });
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  render() {
    const {
      lockedMap,
      selectedStore,
      sets,
      defs,
      statOrder,
      isPhonePortrait,
      combos,
      combosWithoutCaps,
      enabledStats,
      lockedArmor2Mods,
      lbDispatch,
    } = this.props;
    const { rowHeight, rowWidth, rowColumns } = this.state;

    let measureSet: ArmorSet | undefined;
    if (sets.length > 0 && rowHeight === 0 && rowColumns !== 0) {
      measureSet = _.maxBy(sets, numColumns);
    }

    return (
      <div className={styles.sets}>
        <h2>
          {t('LoadoutBuilder.GeneratedBuilds')}{' '}
          <span className={styles.numSets}>
            ({t('LoadoutBuilder.NumStatMixes', { count: sets.length })})
          </span>
          <button
            className={`dim-button ${styles.newLoadout}`}
            onClick={() => editLoadout(newLoadout('', []), { showClass: true, isNew: true })}
          >
            {t('LoadoutBuilder.NewEmptyLoadout')}
          </button>
        </h2>
        {combos !== combosWithoutCaps && (
          <p className={styles.warning}>
            {t('LoadoutBuilder.LimitedCombos', { combos, combosWithoutCaps })}
          </p>
        )}
        <p>
          {t('LoadoutBuilder.OptimizerExplanation')}{' '}
          {!isPhonePortrait && t('LoadoutBuilder.OptimizerExplanationDesktop')}
          {'\n'}
          {t('LoadoutBuilder.OptimizerExplanationArmour2Mods')}{' '}
          <UserGuideLink topic="Loadout_Optimizer" />
        </p>
        <p>
          <span className={styles.altPerkKey}>{t('LoadoutBuilder.AltPerkKey')}</span>{' '}
          <span className={styles.selectedPerkKey}>{t('LoadoutBuilder.SelectedPerkKey')}</span>
        </p>
        {measureSet ? (
          <GeneratedSet
            ref={this.setRowHeight}
            style={{}}
            set={measureSet}
            selectedStore={selectedStore}
            lockedMap={lockedMap}
            lbDispatch={lbDispatch}
            defs={defs}
            statOrder={statOrder}
            enabledStats={enabledStats}
            lockedArmor2Mods={lockedArmor2Mods}
          />
        ) : sets.length > 0 ? (
          <WindowScroller ref={this.windowScroller}>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              <List
                autoHeight={true}
                height={height}
                width={rowWidth}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                overscanRowCount={2}
                rowCount={sets.length}
                rowHeight={rowHeight || 160}
                rowRenderer={({ index, key, style }) => (
                  <GeneratedSet
                    key={key}
                    style={style}
                    set={sets[index]}
                    selectedStore={selectedStore}
                    lockedMap={lockedMap}
                    lbDispatch={lbDispatch}
                    defs={defs}
                    statOrder={statOrder}
                    enabledStats={enabledStats}
                    lockedArmor2Mods={lockedArmor2Mods}
                  />
                )}
                scrollTop={scrollTop}
              />
            )}
          </WindowScroller>
        ) : (
          <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>
        )}
      </div>
    );
  }

  private setRowHeight = (element: HTMLDivElement | null) => {
    if (element && !this.state.rowHeight) {
      setTimeout(
        () => this.setState({ rowHeight: element.clientHeight, rowWidth: element.clientWidth }),
        0
      );
    }
  };
}
