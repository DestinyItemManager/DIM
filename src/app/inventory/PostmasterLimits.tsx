import React from 'react';
import { connect } from 'react-redux';
import './PostmasterLimits.scss';
import { InventoryBucket } from './inventory-buckets';
import { RootState } from 'app/store/reducers';
import { AppIcon, warningIcon } from 'app/shell/icons';

// Props provided from parents
interface ProvidedProps {
  storeId: string;
  bucketId: string;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  usedCapacity: number;
  bucket: InventoryBucket;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { storeId, bucketId } = props;
  const store = state.inventory.stores.find((s) => s.id === storeId)!;

  return {
    bucket: state.inventory.buckets!.byId[props.bucketId],
    usedCapacity: store.buckets[bucketId].length
  };
}

type Props = ProvidedProps & StoreProps;

class PostmasterLimits extends React.Component<Props> {
  REDZONE_LIMIT = 0.85;

  render() {
    const redzone =
      this.props.bucket.name === 'Lost Items' &&
      (this.props.usedCapacity / this.props.bucket.capacity >= this.REDZONE_LIMIT ? true : false);

    return (
      <div className={'postmaster-limits' + (redzone ? ' redzone' : '')}>
        {redzone && <AppIcon className="fa-3x icon" icon={warningIcon} />}
        <div className="postmaster-limits text">{this.props.bucket.name.toUpperCase()}</div>
        <div className="postmaster-limits text">
          {this.props.usedCapacity}/{this.props.bucket.capacity}
        </div>
      </div>
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(PostmasterLimits);
