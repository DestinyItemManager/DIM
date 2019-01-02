import { ReactStateDeclaration } from '@uirouter/react';
import About from './About';
import Support from './Support';
import FilterHelp from '../search/FilterHelp';

export const states: ReactStateDeclaration[] = [
  {
    name: 'about',
    component: About,
    url: '/about'
  },
  {
    name: 'support',
    component: Support,
    url: '/backers'
  },
  {
    name: 'filters',
    component: FilterHelp,
    url: '/search-help'
  }
];
