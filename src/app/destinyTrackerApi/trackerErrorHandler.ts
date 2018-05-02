import { t } from 'i18next';

export function handleErrors(response: Response) {
  if (response.status !== 200) {
    throw new Error(t('DtrReview.ServiceCallError'));
  }

  return response.json();
}

export function handleSubmitErrors(response: Response) {
  if (response.status !== 204) {
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  return response.json();
}
