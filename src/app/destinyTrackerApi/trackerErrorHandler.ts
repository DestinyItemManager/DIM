import { $q } from 'ngimport';
import { t } from 'i18next';

export class TrackerErrorHandler {
  handleErrors(response) {
    if (response.status !== 200) {
      return $q.reject(new Error(t('DtrReview.ServiceCallError')));
    }

    return response;
  }

  handleSubmitErrors(response) {
    if (response.status !== 204) {
      return $q.reject(new Error(t('DtrReview.ServiceSubmitError')));
    }

    return response;
  }
}
