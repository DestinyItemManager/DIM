import { IQService } from "angular";

class D2TrackerErrorHandler {
  $i18next: any;
  $q: IQService;
  constructor($q, $i18next) {
    this.$q = $q;
    this.$i18next = $i18next;
  }

  handleErrors(response) {
    if (response.status !== 200) {
      return this.$q.reject(new Error(this.$i18next.t('DtrReview.ServiceCallError')));
    }

    return response;
  }

  handleSubmitErrors(response) {
    if ((response.status !== 200) ||
        (!response.data) ||
        (!response.data.success)) {
      return this.$q.reject(new Error(this.$i18next.t('DtrReview.ServiceSubmitError')));
    }

    return response;
  }
}

export { D2TrackerErrorHandler };
