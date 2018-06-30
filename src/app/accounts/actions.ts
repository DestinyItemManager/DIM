import { DestinyAccount } from "./destiny-account.service";
import { action } from "typesafe-actions";

export const set = (accounts: DestinyAccount[]) => action('accounts/SET', accounts);
