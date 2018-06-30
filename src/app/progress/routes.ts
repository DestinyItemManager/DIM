import { Progress } from "./Progress";
import { ReactStateDeclaration } from "@uirouter/react";
import { Checklist } from "../checklist/Checklist";

export const states: ReactStateDeclaration[] = [{
  name: 'destiny2.progress',
  component: Progress,
  url: '/progress'
},
{
  name: 'destiny2.checklist',
  resolve: {
    src: () => Checklist
  },
  component: Checklist,
  url: '/checklist'
}];
