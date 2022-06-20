import { useSelector } from 'react-redux';
import { Perk } from './descriptions/descriptionInterface';
import { clarityDescriptionsSelector } from './selectors';

export function useCommunityInsight(hash: number | undefined): Perk | undefined {
  const descriptions = useSelector(clarityDescriptionsSelector);
  if (!hash) {
    return;
  }
  const perk = descriptions?.[hash];
  if (!perk || perk.statOnly || !perk.simpleDescription) {
    return;
  }
  return perk;
}
