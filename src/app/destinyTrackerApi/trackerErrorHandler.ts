import { t } from 'i18next';
import { IHttpResponse } from 'angular';

export function handleErrors<T>(response: IHttpResponse<T>) {
  if (response.status !== 200) {
    throw new Error(t('DtrReview.ServiceCallError'));
  }

  return response;
}

export function handleSubmitErrors<T>(response: IHttpResponse<T>) {
  if (response.status !== 204) {
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  return response;
}
