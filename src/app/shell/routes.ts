import { destinyAccountState } from "./destiny-account.route";
import { destiny2State, destiny2InventoryState } from "../destiny2/routes";
import { defaultAccountRoute } from "./default-account.route";
import { whatsNewState } from "../whats-new/routes";
import { ReactStateDeclaration } from "@uirouter/react";
import { states as loginStates } from "../login/routes";
import { states as progressStates } from "../progress/routes";

const routes: ReactStateDeclaration[] = [
  destinyAccountState,
  destiny2State,
  destiny2InventoryState,
  defaultAccountRoute(),
  whatsNewState,
  ...loginStates,
  ...progressStates
];

export default routes;
