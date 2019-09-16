import React from 'react';
import { DimItem } from './item-types';
import BungieImage from 'app/dim-ui/BungieImage';
import styles from './ElementIcon.m.scss';
import classNames from 'classnames';

export default function ElementIcon({ element }: { element: DimItem['dmg'] }) {
  const images = {
    arc: 'arc',
    solar: 'thermal',
    void: 'void'
  };

  if (images[element]) {
    return (
      <BungieImage
        className={classNames(styles.element, styles[element])}
        src={`/img/destiny_content/damage_types/destiny2/${images[element]}.png`}
      />
    );
  }
  return null;
}
