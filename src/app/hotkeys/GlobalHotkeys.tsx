import React from 'react';
import hotkeys, { Hotkey } from './hotkeys';

interface Props {
  hotkeys: Hotkey[];
  children?: React.ReactNode;
}

let componentId = 0;

export default class GlobalHotkeys extends React.Component<Props> {
  private id = componentId++;

  componentDidMount() {
    hotkeys.register(this.id, this.props.hotkeys);
  }

  componentWillUnmount() {
    hotkeys.unregister(this.id);
  }

  render() {
    return this.props.children || null;
  }
}
