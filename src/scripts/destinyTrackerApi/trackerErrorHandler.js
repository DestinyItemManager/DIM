class TrackerErrorHandler {
  constructor($q, $translate) {
    this.$q = $q;
    this.$translate = $translate;
  }

  handleErrors(response) {
    if (response.status !== 200) {
      return this.$q.reject(new Error(this.$translate.instant('DtrReview.ServiceCallError')));
    }

    return response;
  }

  handleSubmitErrors(response) {
    if (response.status !== 204) {
      return this.$q.reject(new Error(this.$translate.instant('DtrReview.ServiceSubmitError')));
    }

    return response;
  }
}

export { TrackerErrorHandler };
