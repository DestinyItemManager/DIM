import * as React from 'react';

import './HotkeysCheatSheet.scss';
import { getApplicationKeyMap, GlobalHotKeys, KeyMap } from 'react-hotkeys';
import { t } from 'i18next';
import { itemTags } from '../inventory/dim-item-info';

interface State {
  visible: boolean;
}

const keyMap: KeyMap = {
  ShowHotkeys: '?'
};

export default class HotkeysCheatSheet extends React.Component<{}, State> {
  state: State = { visible: false };

  render() {
    const global = <GlobalHotKeys keyMap={keyMap} handlers={{ ShowHotkeys: this.toggle }} />;

    if (!this.state.visible) {
      return global;
    }

    // TODO: why does this not include the global keys??
    const appKeyMap = getApplicationKeyMap();

    return (
      <div className="cfp-hotkeys-container" onClick={this.hide}>
        {global}
        <div className="cfp-hotkeys">
          <h4 className="cfp-hotkeys-title">{t('Hotkey.CheatSheetTitle')}</h4>
          <table>
            <tbody>
              {Object.keys(appKeyMap).map((actionName) => (
                <tr key={actionName}>
                  <td className="cfp-hotkeys-keys">
                    {appKeyMap[actionName].map((keySequence) => (
                      <span key={keySequence.toString()} className="cfp-hotkeys-key">
                        {keySequence}
                      </span>
                    ))}
                  </td>
                  <td className="cfp-hotkeys-text">{getActionName(actionName)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  private toggle = () =>
    this.setState((state) => ({
      visible: !state.visible
    }));

  private hide = () => this.setState({ visible: false });
}

function getActionName(actionName: string) {
  if (actionName.startsWith('MarkItemAs_')) {
    actionName = actionName.replace('MarkItemAs_', '');
    const tag = itemTags.find((t) => t.type === actionName);
    if (tag) {
      return t('Hotkey.MarkItemAs', { tag: t(tag.label) });
    }
  }

  return t('Hotkey.' + actionName);
}
