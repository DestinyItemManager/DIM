import { t } from 'app/i18next-t';

/**
 * splits a number of milliseconds into [days, hours, minutes, seconds, milliseconds]
 *
 * negative durations are treated as 0
 */
export function durationFromMs(ms: number) {
  ms = Math.floor(Math.max(0, ms));
  const days = Math.floor(ms / 86400000); // 86400000 ms per day
  ms %= 86400000; // ms now has full days taken out
  const hours = Math.floor(ms / 3600000); // 3600000 ms per hour
  ms %= 3600000; // ms now has full hours taken out
  const minutes = Math.floor(ms / 60000); // 60000 ms per minute
  ms %= 60000; // ms now has full minutes taken out
  const seconds = Math.floor(ms / 1000); // 1000 ms per second
  ms %= 1000; // ms now has full seconds taken out
  return [days, hours, minutes, seconds, ms];
}

/**
 * print a number of milliseconds as d:h:m:s
 *
 * negative durations are treated as 0
 */
export function timerDurationFromMs(milliseconds: number) {
  const duration = durationFromMs(milliseconds).slice(0, -1);
  while (duration[0] === 0 && duration.length > 3) {
    duration.shift();
  }
  return duration.map((u, i) => `${u}`.padStart(i === 0 ? 0 : 2, '0')).join(':');
}

/**
 * print a number of milliseconds as something like "4d 0:51",
 * containing days, minutes, and hours.
 * uses i18n to choose an appropriate substitute for that "d"
 *
 * negative durations are treated as 0
 */
export function i15dDurationFromMs(milliseconds: number, compact = false) {
  const [days, hours, minutes] = durationFromMs(milliseconds);
  const hhMM = `${hours}:${`${minutes}`.padStart(2, '0')}`;
  return days
    ? `${t('Countdown.Days', {
        count: days,
        context: compact ? 'compact' : '',
        contextList: 'compact',
      })} ${hhMM}`
    : `${hhMM}`;
}
