import { i15dDurationFromMs } from 'app/utils/time';
import React, { useEffect, useRef, useState } from 'react';

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
      {i15dDurationFromMs(diff, compact)}
    </span>
  );
}
