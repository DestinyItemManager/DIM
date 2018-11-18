import { ReactStateDeclaration } from '@uirouter/react';
import Developer from './Developer';
import ComponentPlayground from './ComponentPlayground';

export const states: ReactStateDeclaration[] =
  $DIM_FLAVOR === 'dev'
    ? [
        {
          name: 'developer',
          url: '/developer',
          component: Developer
        },
        {
          name: 'components',
          url: '/components',
          component: ComponentPlayground
        }
      ]
    : [];
