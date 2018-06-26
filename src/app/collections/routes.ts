import { ReactStateDeclaration } from "@uirouter/react";
import Collections from "./Collections";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny2.collections',
  component: Collections,
  url: '/collections'
}];
