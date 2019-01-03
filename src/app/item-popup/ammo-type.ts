import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';

export function ammoTypeClass(ammoType: DestinyAmmunitionType) {
  return {
    [DestinyAmmunitionType.Primary]: 'ammo-primary',
    [DestinyAmmunitionType.Special]: 'ammo-special',
    [DestinyAmmunitionType.Heavy]: 'ammo-heavy'
  }[ammoType];
}
