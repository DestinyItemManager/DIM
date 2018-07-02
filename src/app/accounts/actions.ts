import { DestinyAccount } from "./destiny-account.service";
import { createStandardAction } from "typesafe-actions";

export const set = createStandardAction('accounts/SET')<DestinyAccount[]>();
