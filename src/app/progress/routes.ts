import Progress from './Progress';
import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.progress',
    component: Progress,
    url: '/progress'
  }
];
