import { motion, Tween, useSpring, useTransform } from 'framer-motion';
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
  const val = useSpring(value, spring);
  const transformedVal = useTransform(val, (v) => Math.floor(v).toLocaleString());

  useEffect(() => {
    val.set(value);
  }, [val, value]);

  return <motion.span>{transformedVal}</motion.span>;
}
