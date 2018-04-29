import { t } from 'i18next';
import { IHttpResponse } from 'angular';

interface DtrSubmitResponse {
  success?: boolean;
}

export function handleD2Errors<T>(response: IHttpResponse<T>) {
    if (response.status !== 200) {
      throw new Error(t('DtrReview.ServiceCallError'));
    }

    return response;
  }

export function handleD2SubmitErrors(response: IHttpResponse<DtrSubmitResponse>) {
  if ((response.status !== 200) ||
      (!response.data) ||
      (!response.data.success)) {
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  return response;
}
