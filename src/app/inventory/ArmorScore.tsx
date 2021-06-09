import { generateGradient } from 'app/utils/gradient-generator';
import clsx from 'clsx';
import React from 'react';
import styles from './ArmorScore.m.scss';

interface Props {
  score: number;
}

export default function ArmorScore({ score }: Props) {
  const colors = generateGradient('#FF0000', '#00FF00', 124);
  const bgColor = colors[Math.max(score - 13, 0)];
  return (
    <span className={clsx(styles.score)} style={{ ...styles, backgroundColor: bgColor }}>
      {score}
    </span>
  );
}
