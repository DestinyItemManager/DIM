import SettingsPage from './SettingsPage';
import { ReactStateDeclaration } from '@uirouter/react';
import GDriveRevisions from '../storage/GDriveRevisions';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings',
    url: '/settings?gdrive',
    component: SettingsPage
  },
  {
    name: 'gdrive-revisions',
    component: GDriveRevisions,
    url: '/settings/gdrive-revisions'
  }
];
