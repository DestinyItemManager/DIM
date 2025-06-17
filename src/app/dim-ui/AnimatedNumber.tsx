import { animate, motion, Transition, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';

const spring: Transition<number> = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeOut',
};

/**
 * A number that animates between values.
 */
export default function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const val = useMotionValue(value);
  const transformedVal = useTransform(val, (v) => Math.floor(v));

  useEffect(() => {
    animate(val, value, spring);
  }, [val, value]);

  return <motion.span className={className}>{transformedVal}</motion.span>;
}
