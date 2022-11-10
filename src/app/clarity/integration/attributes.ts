import { shouldShowBadge } from 'app/inventory/BadgeInfo';
import { DimItem } from 'app/inventory/item-types';
import store from 'app/store/store';
import { sendItemToClarity } from './comunication';

type AttributeNames =
  | 'item'
  | 'perks'
  | 'stats'
  | 'background'
  | 'backgroundBefore'
  | 'armoryStats'
  | 'armoryPerks';

/**
 ** Attributes will be used to determent where things are
 ** If clarity is not installed no attributes will be added
 * @param attributeName Name of attribute
 * @returns attributes
 */
export function clarityAttribute(attributeName: AttributeNames, item?: DimItem | undefined) {
  store.getState().clarity.loadClarity;

  const clarityActive = store.getState().clarity.loadClarity;
  const attributes = {} as { clarity: string };
  if (!clarityActive) {
    return attributes;
  }

  const itemAttributes = (item: DimItem) => {
    const badge = shouldShowBadge(item);

    const att = [
      ['crafted', item.crafted],
      ['masterwork', item.masterwork],
      ['deepsight', Boolean(item.deepsightInfo)],
      ['engram', item.isEngram],
      ['badge', badge],
      ['unique', badge && item.uniqueStack],
      ['full', item.maxStackSize !== 1 && item.amount === item.maxStackSize],
    ];
    const newAttributes = att.flatMap(([name, value]) => (value ? name : []));

    if (newAttributes.length === 0) {
      return 'other';
    }
    return newAttributes.join(' ');
  };

  const uniqueIdentifier = Math.random().toString().slice(2);

  switch (attributeName) {
    case 'perks':
    case 'armoryPerks':
    case 'stats':
    case 'armoryStats':
      if (!item) {
        break;
      }
      attributes.clarity = `${attributeName}=${uniqueIdentifier}`;
      sendItemToClarity(item, `${attributeName}=${uniqueIdentifier}`);
      break;
    case 'item':
      if (!item) {
        break;
      }
      attributes.clarity = `${attributeName}=${itemAttributes(item)}`;
      break;
    case 'background':
    case 'backgroundBefore':
      attributes.clarity = `${attributeName}`;
      break;
    default:
      break;
  }

  return attributes;
}
