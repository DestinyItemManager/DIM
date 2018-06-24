import { destinyAccountState } from "./destiny-account.route";
import { destiny2State, destiny2InventoryState } from "../destiny2/routes";
import { defaultAccountRoute } from "./default-account.route";

const routes = [
  destinyAccountState,
  destiny2State,
  destiny2InventoryState,
  defaultAccountRoute()
];

export default routes;
