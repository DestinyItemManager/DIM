import { t } from 'app/i18next-t';
import Checkbox from 'app/settings/Checkbox';
import { fineprintClass, settingClass } from 'app/settings/SettingsPage';
import { Settings } from 'app/settings/initial-settings';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import {
  lazyLoadStreamDeck,
  startStreamDeckConnection,
  stopStreamDeckConnection,
} from 'app/stream-deck/stream-deck';
import { useSelector } from 'react-redux';
import { streamDeckEnabled, streamDeckSetup } from '../actions';
import { streamDeckEnabledSelector } from '../selectors';

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
      dispatch(streamDeckSetup(true));
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
      </div>
    </section>
  );
}
