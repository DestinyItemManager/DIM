import * as React from 'react';
import classNames from 'classnames';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import './ItemMod.scss';

interface Props {
  mod: DestinyInventoryItemDefinition;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { mod } = this.props;

    return (
      <div
        className={classNames(`item-mod`)}
        style={bungieBackgroundStyle(mod.displayProperties.icon)}
      />
    );
  }
}
