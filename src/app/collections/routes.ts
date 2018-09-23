import { ReactStateDeclaration } from '@uirouter/react';
import Collections from './Collections';
import SinglePresentationNode from './SinglePresentationNode';

export const states: ReactStateDeclaration[] = [
  {
    name: 'destiny2.collections',
    component: Collections,
    url: '/collections?{presentationNodeHash:int}'
  },
  {
    name: 'destiny2.presentationNode',
    component: SinglePresentationNode,
    url: '/collections/node/{presentationNodeHash:int}'
  }
];
