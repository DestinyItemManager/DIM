import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown, faExternalLinkAlt } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';

import ExternalLink from 'app/dim-ui/ExternalLink';

import Checkbox from 'app/settings/Checkbox';
import { fineprintClass, settingClass } from 'app/settings/SettingsPage';
import { Settings } from 'app/settings/initial-settings';
import {
  lazyLoadStreamDeck,
  startStreamDeckConnection,
  stopStreamDeckConnection,
} from 'app/stream-deck/stream-deck';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { streamDeckEnabled } from '../actions';
import { streamDeckEnabledSelector } from '../selectors';
import { streamDeckAuthorizationInit } from '../util/authorization';
import styles from './StreamDeckSettings.m.scss';

export default function StreamDeckSettings() {
  const dispatch = useThunkDispatch();
  const enabled = useSelector(streamDeckEnabledSelector);

  const onStreamDeckChange = async (enabled: boolean) => {
    // on switch toggle set if Stream Deck feature is enabled or no
    dispatch(streamDeckEnabled(enabled));
    // start or stop WebSocket connection
    if (enabled) {
      await lazyLoadStreamDeck();
      dispatch(startStreamDeckConnection());
    } else {
      dispatch(stopStreamDeckConnection());
    }
  };

  return (
    <section id="stream-deck">
      <h2>Elgato Stream Deck</h2>
      <div className={settingClass}>
        <Checkbox
          name={'streamDeckEnabled' as keyof Settings}
          label={t('StreamDeck.Enable')}
          value={enabled}
          onChange={onStreamDeckChange}
        />
        <div className={fineprintClass}>{t('StreamDeck.FinePrint')}</div>

        <div>
          {!enabled ? (
            <ExternalLink
              className={styles.link}
              href="https://marketplace.elgato.com/product/dim-stream-deck-11883ba5-c8db-4e3a-915f-612c5ba1b2e4"
            >
              <button type="button" className={clsx('dim-button', styles.button)}>
                <AppIcon icon={faArrowCircleDown} ariaHidden /> {t('StreamDeck.Install')}
              </button>
            </ExternalLink>
          ) : (
            <button
              type="button"
              className={clsx('dim-button', styles.button)}
              onClick={() => dispatch(streamDeckAuthorizationInit())}
            >
              <i className={faExternalLinkAlt} />
              <span>{t('StreamDeck.Authorize')}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
