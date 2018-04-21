import { $q } from 'ngimport';
import { t } from 'i18next';
import { IHttpResponse } from 'angular';

export function handleErrors<T>(response: IHttpResponse<T>) {
  if (response.status !== 200) {
    return $q.reject(new Error(t('DtrReview.ServiceCallError')));
  }

  return response;
}

export function handleSubmitErrors<T>(response: IHttpResponse<T>) {
  if (response.status !== 204) {
    return $q.reject(new Error(t('DtrReview.ServiceSubmitError')));
  }

  return response;
}
