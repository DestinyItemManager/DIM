import { $q, } from 'ngimport';
import { t } from 'i18next';

class D2TrackerErrorHandler {
  handleErrors(response) {
    if (response.status !== 200) {
      return $q.reject(new Error(t('DtrReview.ServiceCallError')));
    }

    return response;
  }

  handleSubmitErrors(response) {
    if ((response.status !== 200) ||
        (!response.data) ||
        (!response.data.success)) {
      return $q.reject(new Error(t('DtrReview.ServiceSubmitError')));
    }

    return response;
  }
}

export { D2TrackerErrorHandler };
