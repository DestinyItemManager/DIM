import * as React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import { DimItem } from '../inventory/item-types';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import Sheet from '../dim-ui/Sheet';

export default class ComponentPlayground extends React.Component {
  render() {
    const fakeWeapon = {
      icon: '/common/destiny2_content/icons/97a3cc17cab25c15b51b1e268886e8d1.jpg',
      dtrRating: 4.6,
      dtrRatingCount: 100,
      masterwork: true,
      dmg: 'void',
      isNew: true,
      location: {
        type: 'energy'
      },
      bucket: {
        type: 'energy'
      },
      ammoType: DestinyAmmunitionType.Special,
      visible: true,
      primStat: {
        value: 300
      },
      isDestiny2() {
        return true;
      },
      isDestiny1() {
        return false;
      }
    };

    const fakeArmor = {
      icon: '/common/destiny2_content/icons/3f5aa270f8a7e4b2a01bbbd36937f765.jpg',
      quality: {
        min: 96
      },
      isNew: true,
      location: {
        type: 'energy'
      },
      bucket: {
        type: 'energy'
      },
      percentComplete: 0.6,
      visible: true,
      primStat: {
        value: 300
      },
      isDestiny2() {
        return true;
      },
      isDestiny1() {
        return false;
      }
    };

    const fakeStack = {
      icon: '/common/destiny2_content/icons/259c571eb7f9f85e56be657f371e303f.jpg',
      maxStackSize: 100,
      amount: 10,
      quality: {
        min: 96
      },
      isNew: true,
      location: {
        type: 'energy'
      },
      bucket: {
        type: 'energy'
      },
      visible: true,
      primStat: {
        value: 300
      },
      isDestiny2() {
        return true;
      },
      isDestiny1() {
        return false;
      }
    };
    return (
      <div className="dim-page">
        <InventoryItem item={(fakeWeapon as any) as DimItem} tag="favorite" rating={4.8} />
        <InventoryItem item={(fakeArmor as any) as DimItem} tag="junk" rating={2.1} />
        <InventoryItem item={(fakeStack as any) as DimItem} />
        <Sheet onClose={() => console.log('close')} />
      </div>
    );
  }
}
