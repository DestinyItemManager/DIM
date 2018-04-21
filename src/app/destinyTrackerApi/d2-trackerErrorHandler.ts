import { $q } from 'ngimport';
import { t } from 'i18next';
import { IHttpResponse } from 'angular';
import { DtrSubmitResponse } from '../item-review/destiny-tracker.service';

export function handleD2Errors<T>(response: IHttpResponse<T>) {
    if (response.status !== 200) {
      return $q.reject(new Error(t('DtrReview.ServiceCallError')));
    }

    return response;
  }

export function handleD2SubmitErrors(response: IHttpResponse<DtrSubmitResponse>) {
  if ((response.status !== 200) ||
      (!response.data) ||
      (!response.data.success)) {
    return $q.reject(new Error(t('DtrReview.ServiceSubmitError')));
  }

  return response;
}
