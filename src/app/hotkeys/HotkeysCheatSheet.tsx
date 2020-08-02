import React, { useState } from 'react';

import './HotkeysCheatSheet.scss';
import { t } from 'app/i18next-t';
import hotkeys from './hotkeys';
import _ from 'lodash';
import GlobalHotkeys from './GlobalHotkeys';

export default function HotkeysCheatSheet() {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible((visible) => !visible);

  const hide = () => setVisible(false);

  const global = (
    <GlobalHotkeys
      hotkeys={[
        {
          combo: '?',
          description: t('Hotkey.ShowHotkeys'),
          callback: toggle,
        },
      ]}
    />
  );

  if (!visible) {
    return global;
  }

  const appKeyMap = hotkeys.getAllHotkeys();

  return (
    <div className="cfp-hotkeys-container" onClick={hide}>
      {global}
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
