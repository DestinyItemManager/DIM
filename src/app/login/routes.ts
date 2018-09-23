import Login from './Login';
import { ReactStateDeclaration } from '@uirouter/react';

export const states: ReactStateDeclaration[] = [
  {
    name: 'login',
    url: '/login',
    component: Login,
    params: {
      reauth: false
    }
  }
];
