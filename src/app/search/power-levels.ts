import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';

// shortcuts for power numbers
const currentSeason = D2SeasonInfo[D2CalculatedSeason];
export const powerLevelByKeyword = {
  powerfloor: currentSeason.powerFloor,
  softcap: currentSeason.softCap,
  powerfulcap: currentSeason.powerfulCap,
  pinnaclecap: currentSeason.pinnacleCap,
};
