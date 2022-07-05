import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';

import ExternalLink from 'app/dim-ui/ExternalLink';
import { streamDeckConnectedSelector } from 'app/stream-deck/selectors';
import {
  lazyLoadStreamDeck,
  resetStreamDeckAuthorization,
  startStreamDeckConnection,
  stopStreamDeckConnection,
} from 'app/stream-deck/stream-deck';
import { setStreamDeckEnabled, streamDeckEnabled } from 'app/stream-deck/util/local-storage';
import clsx from 'clsx';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './StreamDeckSettings.m.scss';

export default function StreamDeckSettings() {
  const dispatch = useThunkDispatch();
  const connected = useSelector(streamDeckConnectedSelector);
  const [enabled, setEnabled] = useState(streamDeckEnabled());

  const onStreamDeckChange = async (enabled: boolean) => {
    // on switch toggle set if Stream Deck feature is enabled or no
    setStreamDeckEnabled(enabled);
    // update local state (to prevent lag on lazy loading feature)
    setEnabled(enabled);
    // start or stop WebSocket connection
    if (enabled) {
      await lazyLoadStreamDeck();
      dispatch(startStreamDeckConnection());
    } else {
      dispatch(stopStreamDeckConnection());
    }
  };

  const onStreamDeckAuthorizationReset = async () => {
    // regenerate client identifier and remove shared key for Stream Deck
    await resetStreamDeckAuthorization();
    await dispatch(stopStreamDeckConnection());
    await dispatch(startStreamDeckConnection());
  };

  return (
    <section id="stream-deck">
      <h2>Elgato Stream Deck</h2>
      <div className="setting">
        <div className="setting horizontal">
          <label htmlFor="streamDeckEnabled">{t('StreamDeck.Enable')}</label>
          <Switch name="streamDeckEnabled" checked={enabled} onChange={onStreamDeckChange} />
        </div>
        <div className="fineprint">
          {t('StreamDeck.FinePrint')} <b>{t('StreamDeck.OldExtension')}</b>
        </div>
        {connected ? (
          <div className={styles.connected}>{t('StreamDeck.Connected')}</div>
        ) : (
          <div>
            <ExternalLink href="https://apps.elgato.com/plugins/com.dim.streamdeck">
              <button type="button" className={clsx('dim-button', styles.downloadPlugin)}>
                <AppIcon icon={faArrowCircleDown} /> {t('StreamDeck.Install')}
              </button>
            </ExternalLink>
            <span className={styles.notConnected}>{t('StreamDeck.NotConnected')}</span>
          </div>
        )}
        <div className={styles.resetButton}>
          <button type="button" className="dim-button" onClick={onStreamDeckAuthorizationReset}>
            {t('StreamDeck.Authorization.Reset')}
          </button>
        </div>
      </div>
    </section>
  );
}
