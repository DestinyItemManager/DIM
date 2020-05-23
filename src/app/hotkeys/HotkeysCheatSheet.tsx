import React from 'react';

import './HotkeysCheatSheet.scss';
import { t } from 'app/i18next-t';
import hotkeys from './hotkeys';
import _ from 'lodash';
import GlobalHotkeys from './GlobalHotkeys';

interface State {
  visible: boolean;
}

export default class HotkeysCheatSheet extends React.Component<{}, State> {
  state: State = { visible: false };

  render() {
    const global = (
      <GlobalHotkeys
        hotkeys={[
          {
            combo: '?',
            description: t('Hotkey.ShowHotkeys'),
            callback: this.toggle,
          },
        ]}
      />
    );

    if (!this.state.visible) {
      return global;
    }

    const appKeyMap = hotkeys.getAllHotkeys();

    return (
      <div className="cfp-hotkeys-container" onClick={this.hide}>
        {global}
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'esc',
              description: '',
              callback: this.hide,
            },
          ]}
        />
        <div className="cfp-hotkeys">
          <h4 className="cfp-hotkeys-title">{t('Hotkey.CheatSheetTitle')}</h4>
          <div className="cfp-hotkeys-list">
            {_.map(
              appKeyMap,
              (description, combo) =>
                description.length > 0 && (
                  <React.Fragment key={combo}>
                    <div className="cfp-hotkeys-keys">
                      <span className="cfp-hotkeys-key">{combo}</span>
                    </div>
                    <div className="cfp-hotkeys-text">{description}</div>
                  </React.Fragment>
                )
            )}
          </div>
        </div>
      </div>
    );
  }

  private toggle = () =>
    this.setState((state) => ({
      visible: !state.visible,
    }));

  private hide = () => this.setState({ visible: false });
}
