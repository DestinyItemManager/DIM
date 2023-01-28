import { animate, motion, Tween, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

const spring: Tween = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeOut',
};

/**
 * A number that animates between values.
 */
export default function AnimatedNumber({ value }: { value: number }) {
  const val = useMotionValue(value);
  const transformedVal = useTransform(val, (v) => Math.floor(v));

  useEffect(() => {
    animate(val, value, spring);
  }, [val, value]);

  return <motion.span>{transformedVal}</motion.span>;
}
