import { ReactStateDeclaration } from "@uirouter/react";
import GDriveRevisions from "./GDriveRevisions";

export const states: ReactStateDeclaration[] = [{
  name: 'gdrive-revisions',
  component: GDriveRevisions,
  url: '/storage/gdrive-revisions'
}];
