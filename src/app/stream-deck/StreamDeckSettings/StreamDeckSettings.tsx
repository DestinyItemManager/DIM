import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import {
  startStreamDeckConnection,
  stopStreamDeckConnection,
  streamDeckChangeStatus,
} from 'app/stream-deck/actions';
import {
  generateIdentifier,
  resetStreamDeckAuthorization,
} from 'app/stream-deck/authorization/authorization';
import { streamDeckConnectedSelector, streamDeckEnabledSelector } from 'app/stream-deck/selectors';
import { streamDeckLocal } from 'app/stream-deck/util/local-storage';
import { useSelector } from 'react-redux';
import './StreamDeckSettings.scss';

export const $streamDeckFeature = ['beta', 'dev'].includes($DIM_FLAVOR);

export default function StreamDeckSettings() {
  const dispatch = useThunkDispatch();
  const connected = useSelector(streamDeckConnectedSelector);
  const enabled = useSelector(streamDeckEnabledSelector);

  const onPluginInstall = () => {
    window.open('https://apps.elgato.com/plugins/com.dim.streamdeck');
  };

  const onStreamDeckChange = async (enabled: boolean) => {
    streamDeckLocal.setEnabled(enabled);
    dispatch(streamDeckChangeStatus(enabled));
    generateIdentifier();
    if (enabled) {
      dispatch(startStreamDeckConnection());
    } else {
      dispatch(stopStreamDeckConnection());
    }
  };

  const onStreamDeckAuthorizationReset = () => {
    resetStreamDeckAuthorization();
    dispatch(stopStreamDeckConnection()).then(() => dispatch(startStreamDeckConnection()));
  };

  return (
    <section id="stream-deck">
      <h2>{t('Settings.StreamDeck')}</h2>
      <div className={`setting stream-deck-settings connected-${connected}`}>
        <div className="setting horizontal">
          <label htmlFor="streamDeckEnabled">{t('StreamDeck.Enable')}</label>
          <Switch name="streamDeckEnabled" checked={enabled} onChange={onStreamDeckChange} />
        </div>
        <div className="fineprint">{t('StreamDeck.FinePrint')}</div>
        {!connected && (
          <button
            type="button"
            className="dim-button download-stream-deck-plugin"
            onClick={onPluginInstall}
          >
            <AppIcon icon={faArrowCircleDown} /> {t('StreamDeck.Install')}
          </button>
        )}
      </div>

      <div className="setting">
        <button type="button" className="dim-button" onClick={onStreamDeckAuthorizationReset}>
          {t('StreamDeck.Authorization.Reset')}
        </button>
      </div>
    </section>
  );
}
