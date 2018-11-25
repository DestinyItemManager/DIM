import * as React from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import { D1Item } from '../inventory/item-types';
import BungieImage from '../dim-ui/BungieImage';
import store from '../store/store';
import { Provider } from 'react-redux';

interface Props {
  item: D1Item & { vendorIcon: string };
  shiftClickCallback?(item: D1Item): void;
}

export default class LoadoutBuilderItem extends React.Component<Props> {
  render() {
    const { item } = this.props;

    if (item.isVendorItem) {
      return (
        <div className="item-overlay-container">
          <div className="vendor-icon-background">
            <BungieImage src={item.vendorIcon} className="vendor-icon" />
          </div>
          <Provider store={store}>
            <ConnectedInventoryItem item={item} onClick={this.itemClicked} />
          </Provider>
        </div>
      );
    }

    return (
      <ItemPopupTrigger item={item}>
        <Provider store={store}>
          <ConnectedInventoryItem item={item} onClick={this.itemClicked} />
        </Provider>
      </ItemPopupTrigger>
    );
  }

  private itemClicked = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.shiftKey && this.props.shiftClickCallback) {
      e.preventDefault();
      e.stopPropagation();
      this.props.shiftClickCallback(this.props.item);
    }
  };
}
