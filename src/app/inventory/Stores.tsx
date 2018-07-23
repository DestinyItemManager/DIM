import * as React from 'react';
import { DimStore, DimVault, D1Store } from './store-types';
import { sortStores } from '../shell/dimAngularFilters.filter';
import { Settings } from '../settings/settings';
import { InventoryBuckets } from './inventory-buckets';
import classNames from 'classnames';
import { t } from 'i18next';
import './dimStores.scss';
import './store-pager.scss';
import StoreHeading from './StoreHeading';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import ScrollClassDiv from '../dim-ui/ScrollClassDiv';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import D1Reputation from './D1Reputation';
import { StoreBuckets } from './StoreBuckets';

interface Props {
  stores: DimStore[];
  isPhonePortrait: boolean;
  // TODO: bind just the settings we care about
  settings: Settings;
  buckets: InventoryBuckets;
  collapsedSections: Settings['collapsedSections'];
}

interface State {
  selectedStoreId?: string;
}

function mapStateToProps(state: RootState): Partial<Props> {
  const settings = state.settings.settings as Settings;
  return {
    stores: state.inventory.stores,
    isPhonePortrait: state.shell.isPhonePortrait,
    settings,
    buckets: state.inventory.buckets,
    // Pulling this out lets us do ref-equality
    collapsedSections: settings.collapsedSections
  };
}

/**
 * Display inventory and character headers for all characters and the vault.
 */
class Stores extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { stores, isPhonePortrait, settings } = this.props;
    const { selectedStoreId } = this.state;

    if (!stores.length) {
      return null;
    }

    const sortedStores = sortStores(stores, settings.characterOrder);
    const vault = stores.find((s) => s.isVault) as DimVault;
    const currentStore = stores.find((s) => s.current)!;
    let selectedStore = currentStore;
    if (selectedStoreId) {
      selectedStore =
        stores.find((s) => s.id === selectedStoreId) || selectedStore;
    }

    if (isPhonePortrait) {
      return (
        <div className="inventory-content phone-portrait">
          <ViewPager>
            <Frame className="frame" autoSize={false}>
              <Track
                currentView={selectedStoreId}
                viewsToShow={1}
                contain={true}
                className="track"
                flickTimeout={100}
              >
                {sortedStores.map((store) => (
                  <View className="view" key={store.id}>
                    {this.renderStores([store], vault, currentStore)}
                  </View>
                ))}
              </Track>
            </Frame>
          </ViewPager>
        </div>
      );
    }

    return (
      <div className="inventory-content">
        {this.renderStores(sortedStores, vault, currentStore)}
      </div>
    );
  }

  toggleSection(id: string) {
    const settings = this.props.settings;
    // TODO: make an action!
    settings.collapsedSections = {
      ...settings.collapsedSections,
      [id]: !settings.collapsedSections[id]
    };
    settings.save();
  }

  private renderStores(
    stores: DimStore[],
    vault: DimVault,
    currentStore: DimStore
  ) {
    const { settings, buckets, collapsedSections } = this.props;

    return (
      <div>
        <ScrollClassDiv className="store-row store-header" scrollClass="sticky">
          {stores.map((store) => (
            <div className="store-cell" key={store.id}>
              <StoreHeading internalLoadoutMenu={true} store={store} />
            </div>
          ))}
        </ScrollClassDiv>
        {Object.keys(buckets.byCategory).map((category) => (
          <div key={category} className="section">
            <CollapsibleTitle
              title={t(`Bucket.${category}`)}
              sectionId={category}
              collapsedSections={collapsedSections}
            >
              {stores[0].isDestiny1() &&
                buckets.byCategory[category][0].vaultBucket && (
                  <span className="bucket-count">
                    {
                      vault.vaultCounts[
                        buckets.byCategory[category][0].vaultBucket!.id
                      ].count
                    }/{buckets.byCategory[category][0].vaultBucket!.capacity}
                  </span>
                )}
            </CollapsibleTitle>
            {!collapsedSections[category] &&
              buckets.byCategory[category].map((bucket) => (
                <StoreBuckets
                  key={bucket.id}
                  bucket={bucket}
                  stores={stores}
                  collapsedSections={collapsedSections}
                  vault={vault}
                  currentStore={currentStore}
                  settings={settings}
                  toggleSection={this.toggleSection}
                />
              ))}
          </div>
        ))}
        {stores[0].isDestiny1() && (
          <D1ReputationSection
            stores={stores}
            collapsedSections={collapsedSections}
          />
        )}
      </div>
    );
  }
}

function D1ReputationSection({
  stores,
  collapsedSections
}: {
  stores: DimStore[];
  collapsedSections: Settings['collapsedSections'];
}) {
  return (
    <div className="section">
      <CollapsibleTitle
        title={t('Bucket.Reputation')}
        sectionId="Reputation"
        collapsedSections={collapsedSections}
      />
      {!collapsedSections.Reputation && (
        <div className="store-row items reputation">
          {stores.map((store: D1Store) => (
            <div
              key={store.id}
              className={classNames('store-cell', {
                vault: store.isVault
              })}
            >
              <D1Reputation store={store} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default connect(mapStateToProps)(Stores);
