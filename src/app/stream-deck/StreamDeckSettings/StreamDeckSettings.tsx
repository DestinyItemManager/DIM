import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown, lockIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';

import ExternalLink from 'app/dim-ui/ExternalLink';
import { streamDeckConnectedSelector } from 'app/stream-deck/selectors';
import {
  lazyLoadStreamDeck,
  startStreamDeckConnection,
  stopStreamDeckConnection,
} from 'app/stream-deck/stream-deck';
import {
  setStreamDeckAuth,
  setStreamDeckEnabled,
  streamDeckEnabled,
} from 'app/stream-deck/util/local-storage';
import clsx from 'clsx';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './StreamDeckSettings.m.scss';

const randomToken = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

const STREAM_DECK_DEEP_LING = 'streamdeck://plugins/message/com.dim.streamdeck';

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
        <div className={styles.authentication}>
          <button
            type="button"
            className="dim-button"
            onClick={() => {
              const auth = {
                instance: window.crypto.randomUUID(),
                token: randomToken(16),
              };
              setStreamDeckAuth(auth);
              const query = new URLSearchParams(auth).toString();
              window.open(`${STREAM_DECK_DEEP_LING}/connect?${query}`);
              startStreamDeckConnection();
            }}
          >
            <i className={lockIcon} />
            <span>{t('StreamDeck.Authorize')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
