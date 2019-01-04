import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { ItemPickerState } from './item-picker';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';
import {
  SearchConfig,
  searchConfigSelector,
  SearchFilters,
  searchFiltersConfigSelector
} from '../search/search-filters';
import SearchFilterInput from '../search/SearchFilterInput';
import { sortItems } from '../shell/dimAngularFilters.filter';
import { itemSortOrderSelector } from '../settings/item-sort';
import classNames from 'classnames';
import { t } from 'i18next';
import './ItemPicker.scss';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  searchConfig: SearchConfig;
  filters: SearchFilters;
  itemSortOrder: string[];
}

function mapStateToProps(state: RootState, { filterItems }: ProvidedProps): () => StoreProps {
  const filteredItemsSelector = createSelector(
    storesSelector,
    (stores) => stores.flatMap((s) => (filterItems ? s.items.filter(filterItems) : s.items))
  );

  return () => ({
    allItems: filteredItemsSelector(state),
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state),
    itemSortOrder: itemSortOrderSelector(state)
  });
}

type Props = ProvidedProps & StoreProps;

interface State {
  query: string;
  equip: boolean;
}

class ItemPicker extends React.Component<Props, State> {
  state: State = { query: '', equip: true };

  render() {
    const { allItems, prompt, searchConfig, filters, itemSortOrder } = this.props;
    const { query, equip } = this.state;

    const header = (
      <div>
        <h1>{prompt || t('ItemPicker.ChooseItem')}</h1>
        <div className="item-picker-search">
          <SearchFilterInput
            searchConfig={searchConfig}
            placeholder="Search items"
            onQueryChanged={this.onQueryChanged}
          />
          <div className="split-buttons">
            <button
              className={classNames('dim-button', { selected: equip })}
              onClick={this.setEquip}
            >
              {t('MovePopup.Equip')}
            </button>
            <button
              className={classNames('dim-button', { selected: !equip })}
              onClick={this.setStore}
            >
              {t('MovePopup.Store')}
            </button>
          </div>
        </div>
      </div>
    );

    const filter = filters.filterFunction(query);

    const items = sortItems(allItems.filter(filter), itemSortOrder);

    return (
      <Sheet onClose={this.onSheetClosed} header={header} sheetClassName="item-picker">
        {({ onClose }) => (
          <div className="sub-bucket">
            {items.map((item) => (
              <ConnectedInventoryItem
                key={item.index}
                item={item}
                onClick={() => this.onItemSelected(item, onClose)}
              />
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  private onQueryChanged = (query: string) => this.setState({ query });

  private onItemSelected = (item: DimItem, onClose: () => void) => {
    this.props.onItemSelected({ item, equip: this.state.equip });
    onClose();
  };

  private onSheetClosed = () => {
    this.props.onCancel();
    this.props.onSheetClosed();
  };

  private setEquip = () => this.setState({ equip: true });
  private setStore = () => this.setState({ equip: false });
}

export default connect<StoreProps>(mapStateToProps)(ItemPicker);
