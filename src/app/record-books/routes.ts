import { ReactStateDeclaration } from '@uirouter/react';
import RecordBooks from './RecordBooks';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny1.record-books',
    component: RecordBooks,
    url: '/record-books'
  }
];
