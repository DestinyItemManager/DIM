import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { AppIcon, faArrowCircleDown } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import {
  startStreamDeckConnection,
  stopStreamDeckConnection,
  streamDeckChangeStatus,
} from 'app/stream-deck/actions';
import { streamDeckConnectedSelector, streamDeckEnabledSelector } from 'app/stream-deck/selectors';
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
    localStorage.setItem('stream-deck-enabled', enabled.toString());
    dispatch(streamDeckChangeStatus(enabled));
    if (enabled) {
      dispatch(startStreamDeckConnection());
    } else {
      dispatch(stopStreamDeckConnection());
    }
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
    </section>
  );
}
