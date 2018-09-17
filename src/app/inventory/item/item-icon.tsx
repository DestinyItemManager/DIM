import * as React from 'react';
import './item-icon.scss';
import { D2Item } from '../item-types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import BungieImage from '../../dim-ui/BungieImage';
import ItemImage from './item-image';

interface Props {
  item: D2Item;
}

// tslint:disable-next-line:no-empty-interface
interface State {
}

export default class ItemIcon extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    const { item } = this.props;

    if (!item) {
      return null;
    }

    let className = `forsaken-item`;

    if (item.dmg) {
      className = className + ` ${item.dmg}`;
    }

    if (item.masterwork) {
      className = className + ' masterwork';
    }

    if (item.isExotic) {
      className = className + ' exotic';
    }

    const category = item.sockets && item.sockets.categories
      .find((category) => category.category.categoryStyle === DestinySocketCategoryStyle.Consumable);

    return (
      <div className={className}>
        <ItemImage backgroundUrl={item.icon} hasBorder={!item.masterwork} />
        <div className='plugs'>
          { category && category.sockets.map((socketInfo, index) => {
              if (index > 2) {
                return null;
              }

              return <div key={socketInfo.socketIndex} className={`plug-${index + 1}`}>
                {socketInfo.plug && category.category.categoryStyle !== DestinySocketCategoryStyle.Reusable &&
                  <BungieImage
                    className="item-mod"
                    src={socketInfo.plug.plugItem.displayProperties.icon}
                  />
                }
                </div>;
            })
          }
          {/* <div className='area-overlap plug-1'/>
          <div className='plug-2'/>
          <div className='plug-3'/> */}
        </div>
        <div className='attributes'>
          <div className='area-overlap attribute-1' />
          <div className='attribute-2'>
            <div className='power'>{item.primStat && item.primStat.value}</div></div>
        </div>
      </div>
    );
  }

  // mapSocketsToImages(sockets: DimSockets) {
  //   if (sockets && sockets.sockets) {
  //     sockets.sockets
  //       .find((socket) => socket.plug)
  //       .map((socket) => {});
  //   }
  // }
}
