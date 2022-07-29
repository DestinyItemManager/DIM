import { t } from 'app/i18next-t';
import { NotificationError, showNotification } from 'app/notifications/notifications';
import { notificationPromise } from 'app/stream-deck/msg-handlers';
import { infoLog } from 'app/utils/log';
import styles from './AuthorizationNotification.m.scss';

interface StreamDeckChallengeProps {
  challenge: number;
}

function StreamDeckChallenge({ challenge }: StreamDeckChallengeProps) {
  return (
    <div className={styles.authorization}>
      <span>{t('StreamDeck.Authorization.Title')}</span>
      <div className={styles.authorizationChallenge}>{challenge}</div>
    </div>
  );
}

// Show notification asking for selection
export function showStreamDeckAuthorizationNotification(challenge: number) {
  showNotification({
    title: `Elgato Stream Deck`,
    body: <StreamDeckChallenge challenge={challenge} />,
    type: 'progress',
    duration: 500,
    promise: notificationPromise.promise
      ?.then(() => {
        infoLog('sd', 'ok');
        return true;
      })
      ?.catch((e) => {
        throw new NotificationError(e.message, {
          body: t('StreamDeck.Authorization.Error'),
        });
      }),
  });
}
