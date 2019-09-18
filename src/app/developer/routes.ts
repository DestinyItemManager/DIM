import { ReactStateDeclaration } from '@uirouter/react';
import Developer from './Developer';

export const states: ReactStateDeclaration[] =
  $DIM_FLAVOR === 'dev'
    ? [
        {
          name: 'developer',
          url: '/developer',
          component: Developer
        }
      ]
    : [];
