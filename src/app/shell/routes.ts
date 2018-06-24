import { destinyAccountState } from "./destiny-account.route";
import { destiny2State, destiny2InventoryState } from "../destiny2/routes";
import { defaultAccountRoute } from "./default-account.route";
import { whatsNewState } from "../whats-new/routes";
import { ReactStateDeclaration } from "@uirouter/react";
import { states as loginStates } from "../login/routes";
import { states as progressStates } from "../progress/routes";
import { states as vendorsStates } from "../d2-vendors/routes";
import { states as collectionsStates } from "../collections/routes";
import { states as storageStates } from "../storage/routes";

const routes: ReactStateDeclaration[] = [
  destinyAccountState,
  destiny2State,
  destiny2InventoryState,
  defaultAccountRoute,
  whatsNewState,
  ...loginStates,
  ...progressStates,
  ...vendorsStates,
  ...collectionsStates,
  ...storageStates
];

export default routes;
