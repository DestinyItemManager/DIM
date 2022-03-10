export const resonantElementTagsByObjectiveHash: Record<number, string> = {
  2215515944: 'ruinous', // Ruinous Element
  2215515945: 'adroit', // Adroit Element
  2215515946: 'mutable', // Mutable Element
  2215515947: 'energetic', // Energetic Element
  3934906303: 'drowned', // Drowned Element
} as const;

export const resonantMaterialStringVarHashes: {
  currentCountHash: number;
  maxCapacityHash: number;
  materialHash: number;
}[] = [
  { currentCountHash: 2829303739, maxCapacityHash: 107662911, materialHash: 163842161 }, // Adroit Element
  { currentCountHash: 3436494927, maxCapacityHash: 1317327163, materialHash: 3077242389 }, // Drowned Element
  { currentCountHash: 1238436609, maxCapacityHash: 2920404369, materialHash: 163842163 }, // Energetic Element
  { currentCountHash: 1178490630, maxCapacityHash: 2677935394, materialHash: 163842162 }, // Mutable Element
  { currentCountHash: 2653558736, maxCapacityHash: 1852772272, materialHash: 163842160 }, // Ruinous Element
  { currentCountHash: 2747150405, maxCapacityHash: 2029874829, materialHash: 3491404510 }, // Neutral Element
];
