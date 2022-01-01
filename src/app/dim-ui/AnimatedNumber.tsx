import { animate, Spring, useMotionValue } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

const spring: Spring = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
};

/**
 * A number that animates between values.
 */
export default function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const val = useMotionValue(value);

  useEffect(() => {
    const unsubscribe = val.onChange(
      (value) => ref.current && (ref.current.textContent = Math.floor(value).toLocaleString())
    );
    return unsubscribe;
  }, [val]);

  useEffect(() => {
    const controls = animate(val, value, spring);
    return controls.stop;
  }, [val, value]);

  return <span ref={ref}>{Math.floor(value).toLocaleString()}</span>;
}
