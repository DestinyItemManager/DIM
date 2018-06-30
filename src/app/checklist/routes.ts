import { Checklist } from "./Checklist";
import { ReactStateDeclaration } from "@uirouter/react";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny2.checklist',
  component: Checklist,
  url: '/checklist'
}];
