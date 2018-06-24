import { destinyAccountResolver } from "../shell/destiny-account.route";
import { ReactStateDeclaration } from "@uirouter/react";
import Destiny from "../destiny2/Destiny";

// Root state for Destiny 1 views
export const states: ReactStateDeclaration[] = [{
  name: 'destiny1',
  parent: 'destiny-account',
  redirectTo: 'destiny1.inventory',
  url: '/d1',
  component: Destiny,
  resolve: {
    account: destinyAccountResolver(1)
  }
}];
