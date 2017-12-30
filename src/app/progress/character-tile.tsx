import * as React from 'react';
import { IDestinyCharacterComponent } from '../bungie-api/interfaces';

interface CharacterTileProps {
  character: IDestinyCharacterComponent;
  defs;
  lastPlayedDate: Date;
}

export function CharacterTile(props: CharacterTileProps) {
  const { defs, character, lastPlayedDate } = props;

  const race = defs.Race[character.raceHash];
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const className = classy.genderedClassNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const current = lastPlayedDate.getTime() == new Date(character.dateLastPlayed).getTime() ? 'current' : '';

  // TODO: update this to be a D2-specific, simplified tile
  return <div className={`character ${current ? 'current' : ''}`}>
    <div className="character-box destiny2">
      <div className="background" style={{ backgroundImage: `url(https://www.bungie.net${character.emblemBackgroundPath})` }}></div>
      <div className="details">
        <div className="emblem"></div>
        <div className="character-text">
          <div className="top">
            <div className="class">{ className }</div>
            <div className="powerLevel">{character.light}</div>
          </div>
          <div className="bottom">
            <div className="race-gender">{genderRace}</div>
            <div className="level">{character.levelProgression.level}</div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}