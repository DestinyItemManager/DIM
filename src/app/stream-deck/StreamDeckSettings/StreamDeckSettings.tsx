import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown, faExternalLinkAlt } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';

import ExternalLink from 'app/dim-ui/ExternalLink';
import { streamDeckSelector } from 'app/stream-deck/selectors';
import {
  lazyLoadStreamDeck,
  startStreamDeckConnection,
  stopStreamDeckConnection,
} from 'app/stream-deck/stream-deck';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { streamDeckEnabled } from '../actions';
import { streamDeckAuthorizationInit } from '../util/authorization';
import styles from './StreamDeckSettings.m.scss';

export default function StreamDeckSettings() {
  const dispatch = useThunkDispatch();
  const { connected, enabled } = useSelector(streamDeckSelector);

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
      <div className="setting">
        <div className="setting horizontal">
          <label htmlFor="streamDeckEnabled">{t('StreamDeck.Enable')}</label>
          <Switch name="streamDeckEnabled" checked={enabled} onChange={onStreamDeckChange} />
        </div>
        <div className="fineprint">
          {t('StreamDeck.FinePrint')} <b>{t('StreamDeck.OldExtension')}</b>
        </div>
        {!connected && (
          <div>
            <ExternalLink href="https://marketplace.elgato.com/product/dim-stream-deck-11883ba5-c8db-4e3a-915f-612c5ba1b2e4">
              <button type="button" className={clsx('dim-button', styles.downloadPlugin)}>
                <AppIcon icon={faArrowCircleDown} /> {t('StreamDeck.Install')}
              </button>
            </ExternalLink>
          </div>
        )}
        <div className={styles.authentication}>
          <button
            type="button"
            className="dim-button"
            onClick={() => dispatch(streamDeckAuthorizationInit())}
          >
            <i className={faExternalLinkAlt} />
            <span>{t('StreamDeck.Authorize')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
