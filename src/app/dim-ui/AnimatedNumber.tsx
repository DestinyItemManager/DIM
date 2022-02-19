import React from 'react';
import { animated, config, useSpring } from 'react-spring';

const spring = {
  ...config.stiff,
  clamp: true,
};

/**
 * A number that animates between values.
 */
export default function AnimatedNumber({ value }: { value: number }) {
  const animatedValue = useSpring<{ val: number }>({ val: value, config: spring });
  return <animated.span>{animatedValue.val.to((val: number) => Math.floor(val))}</animated.span>;
}
