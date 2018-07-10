import { t } from 'i18next';
import { toaster } from '../ngimport-more';

export interface DtrSubmitResponse {
  success?: boolean;
}

export function handleD2Errors(response: Response) {
    if (response.status !== 200) {
      const errorObject = new Error(t('DtrReview.ServiceCallError'));
      toaster.pop('error', errorObject);
      throw errorObject;
    }

    return response.json();
  }

export async function handleD2SubmitErrors(response: Response) {
  if (response.status !== 200) {
    const errorObject = new Error(t('DtrReview.ServiceSubmitError'));
    toaster.pop('error', errorObject);
    throw errorObject;
  }

  const data = await response.json() as DtrSubmitResponse;

  if (!data || !data.success) {
    const errorObject = new Error(t('DtrReview.ServiceSubmitError'));
    toaster.pop('error', errorObject);
    throw errorObject;
  }

  return data;
}
