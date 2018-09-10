import { t } from 'i18next';
import { toaster } from '../ngimport-more';

export function handleErrors(response: Response) {
  if (response.status !== 200) {
    const errorObject = new Error(t('DtrReview.ServiceCallError'));
    toaster.pop('error', errorObject);
    throw errorObject;
  }

  return response.text().then((text) => {
    return text ? JSON.parse(text) : {};
  });
}

/**
 * Handle submit errors.
 * In D1, they return a 204 status and a null body to indicate that submission was succesful.
 * Simply parsing a null body is pretty explosive!
 */
export function handleSubmitErrors(response: Response) {
  if (response.status !== 204) {
    const errorObject = new Error(t('DtrReview.ServiceSubmitError'));
    toaster.pop('error', errorObject);
    throw errorObject;
  }

  // https://github.com/github/fetch/issues/268
  return response.text().then((text) => {
    return text ? JSON.parse(text) : {};
  });
}
