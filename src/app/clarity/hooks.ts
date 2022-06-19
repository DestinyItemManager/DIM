import { useSelector } from 'react-redux';
import { Line } from './descriptions/descriptionInterface';
import { clarityDescriptionsSelector } from './selectors';

export interface CommunityInsight {
  simpleDescription: Line[];
}

export function useCommunityInsight(hash: number | undefined): CommunityInsight | undefined {
  const descriptions = useSelector(clarityDescriptionsSelector);
  if (!hash) {
    return;
  }
  const perk = descriptions?.[hash];
  if (!perk || perk.statOnly || !perk.simpleDescription) {
    return;
  }
  return {
    simpleDescription: perk.simpleDescription,
  };
}
