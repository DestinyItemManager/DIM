import React from 'react';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';

export function ItemSubHeader({ item }: { item: DimItem }) {
  const light = item.primStat?.value.toString();
  const maxLight = item.isDestiny2() && item.powerCap;

  const classType =
    item.classType !== DestinyClass.Unknown &&
    // These already include the class name
    item.type !== 'ClassItem' &&
    item.type !== 'Artifact' &&
    item.type !== 'Class' &&
    !item.classified &&
    item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1);

  const subtitleData = {
    light,
    maxLight,
    statName: item.primStat?.stat.displayProperties.name,
    classType: classType ? classType : ' ',
    typeName: item.typeName,
  };

  return (
    <>
      {light
        ? t('MovePopup.Subtitle.Gear', subtitleData)
        : t('MovePopup.Subtitle.Consumable', subtitleData)}
    </>
  );
}
