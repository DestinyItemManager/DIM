import { t } from 'i18next';

export interface DtrSubmitResponse {
  success?: boolean;
}

export function handleD2Errors(response: Response) {
  if (response.status !== 200) {
    throw new Error(t('DtrReview.ServiceCallError'));
  }

  return response.json();
}

export async function handleD2SubmitErrors(response: Response) {
  if (response.status !== 200) {
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  const data = (await response.json()) as DtrSubmitResponse;

  if (!data || !data.success) {
    throw new Error(t('DtrReview.ServiceSubmitError'));
  }

  return data;
}
