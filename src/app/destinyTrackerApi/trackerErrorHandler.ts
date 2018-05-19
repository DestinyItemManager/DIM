import { t } from 'i18next';

export function handleErrors(response: Response) {
  if (response.status !== 200) {
    throw new Error(t('DtrReview.ServiceCallError'));
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
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  // https://github.com/github/fetch/issues/268
  return response.text().then((text) => {
    return text ? JSON.parse(text) : {};
  });
}
