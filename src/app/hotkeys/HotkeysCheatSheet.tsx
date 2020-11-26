import KeyHelp from 'app/dim-ui/KeyHelp';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useState } from 'react';
import GlobalHotkeys from './GlobalHotkeys';
import hotkeys from './hotkeys';
import './HotkeysCheatSheet.scss';
import { useHotkey } from './useHotkey';

export default function HotkeysCheatSheet() {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible((visible) => !visible);

  const hide = () => setVisible(false);

  useHotkey('?', t('Hotkey.ShowHotkeys'), toggle);

  if (!visible) {
    return null;
  }

  const appKeyMap = hotkeys.getAllHotkeys();

  return (
    <div className="cfp-hotkeys-container" onClick={hide}>
      <GlobalHotkeys
        hotkeys={[
          {
            combo: 'esc',
            description: '',
            callback: hide,
          },
        ]}
      />
      <div className="cfp-hotkeys">
        <h4 className="cfp-hotkeys-title">{t('Hotkey.CheatSheetTitle')}</h4>
        <div className="cfp-hotkeys-list">
          {_.sortBy(Object.entries(appKeyMap), ([combo]) => combo).map(
            ([combo, description]) =>
              description.length > 0 && (
                <React.Fragment key={combo}>
                  <div className="cfp-hotkeys-keys">
                    <KeyHelp combo={combo} className="cfp-hotkeys-key" />
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
