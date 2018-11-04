import SettingsPage from './SettingsPage';
import { ReactStateDeclaration } from '@uirouter/react';
import { settingsReady } from './settings';
import GDriveRevisions from '../storage/GDriveRevisions';
import DiagnosticsPage from './DiagnosticsPage';

export const states: ReactStateDeclaration[] = [
  {
    name: 'settings',
    url: '/settings?gdrive',
    component: SettingsPage,
    resolve: {
      settings: () => settingsReady
    }
  },
  {
    name: 'gdrive-revisions',
    component: GDriveRevisions,
    url: '/settings/gdrive-revisions'
  },
  {
    name: 'diagnostics',
    url: '/settings/diagnostics',
    component: DiagnosticsPage
  }
];
