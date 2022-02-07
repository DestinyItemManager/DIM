import { currentAccountSelector } from 'app/accounts/selectors';
import { getStores } from 'app/bungie-api/destiny2-api';
import FileUpload from 'app/dim-ui/FileUpload';
import { t } from 'app/i18next-t';
import { setMockProfileResponse } from 'app/inventory/actions';
import { loadStores } from 'app/inventory/d2-stores';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { ThunkResult } from 'app/store/types';
import { download } from 'app/utils/util';
import React from 'react';
import { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import './settings.scss';

export function TroubleshootingSettings() {
  const currentAccount = useSelector(currentAccountSelector);
  const dispatch = useThunkDispatch();

  const saveProfileResponse = async () => {
    if (currentAccount) {
      download(
        JSON.stringify(await getStores(currentAccount), null, '\t'),
        'profile-data.json',
        'application/json'
      );
    }
  };

  const importMockProfile: DropzoneOptions['onDrop'] = async (files) => {
    if (files.length !== 1) {
      return;
    }

    try {
      await dispatch(importMockProfileResponse(files[0]));
      await dispatch(loadStores());
      alert('succeeded');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section id="troubleshooting">
      <div className="setting">
        <button type="button" className="dim-button" onClick={saveProfileResponse}>
          {t('Settings.ExportProfile')}
        </button>

        {$DIM_FLAVOR === 'dev' && (
          <FileUpload
            title="Upload Profile Response JSON"
            accept=".json"
            onDrop={importMockProfile}
          />
        )}
      </div>
    </section>
  );
}

function importMockProfileResponse(file: File): ThunkResult {
  return async (dispatch) => {
    const fileText = await file.text();
    let profileResponse = JSON.parse(fileText);
    // if it's a full copy of the bnet Response wrapper, unwrap it
    if (profileResponse?.Response?.profileInventory) {
      profileResponse = profileResponse.Response;
    }
    // if it doesn't look like it has what we need, throw
    if (!profileResponse?.profileInventory) {
      throw 'uploaded profile response looks invalid';
    }
    dispatch(setMockProfileResponse(JSON.stringify(profileResponse)));
  };
}
