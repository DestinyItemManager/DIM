import React, { useState, useEffect, useRef } from 'react';
import { t } from 'app/i18next-t';

/**
 * Render a countdown to a specific date.
 */
export default function Countdown({
  endTime,
  compact,
}: {
  endTime: Date;
  /** Render the time as a compact string instead of spelled out */
  compact?: boolean;
}) {
  const [diff, setDiff] = useState(endTime.getTime() - Date.now());
  const interval = useRef(0);

  useEffect(() => {
    const update = () => {
      const diff = endTime.getTime() - Date.now();
      // We set the diff just to make it re-render. We could just as easily set this to now(), or an incrementing number
      setDiff(diff);
      if (diff <= 0) {
        clearInterval(interval.current);
      }
    };
    interval.current = window.setInterval(update, 60000);
    update();
    return () => clearInterval(interval.current);
  }, [endTime]);

  return (
    <span className="countdown" title={endTime.toLocaleString()}>
      {dhm(diff / 1000, compact)}
    </span>
  );
}

function pad(n: number, width: number) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join('0') + s;
}

function dhm(seconds: number, compact = false) {
  seconds = Math.max(0, seconds);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400; // seconds with full days taken out
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600; // seconds with full hours taken out
  const minutes = Math.floor(seconds / 60);
  const hhMM = `${hours}:${pad(minutes, 2)}`;
  const context = compact ? 'compact' : ''; // t('Countdown.Days_compact')
  return days ? `${t('Countdown.Days', { count: days, context })} ${hhMM}` : `${hhMM}`;
}
