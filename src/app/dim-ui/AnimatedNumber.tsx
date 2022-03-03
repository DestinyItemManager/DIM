import { animate, Tween, useMotionValue } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

const spring: Tween = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeOut',
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
