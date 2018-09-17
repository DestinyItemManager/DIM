import * as React from "react";
import classNames from "classnames";
import "./ItemMod.scss";
import { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";

interface Props {
  mod: DestinyInventoryItemDefinition;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { mod } = this.props;

    return (
      <div
        className={classNames(`item-mod`)}
        style={{
          backgroundImage: `url('https://www.bungie.net${mod.displayProperties.icon}')`
        }}
      />
    );
  }
}
