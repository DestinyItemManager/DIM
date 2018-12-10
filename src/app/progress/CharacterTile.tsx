import { DestinyCharacterComponent } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { AppIcon, powerActionIcon } from '../shell/icons';

// TODO: this should probably move to a library of character functions
export function characterIsCurrent(
  character: DestinyCharacterComponent,
  lastPlayedDate: Date
): boolean {
  return lastPlayedDate.getTime() === new Date(character.dateLastPlayed).getTime();
}

export default function CharacterTile({
  defs,
  character,
  lastPlayedDate
}: {
  character: DestinyCharacterComponent;
  defs: D2ManifestDefinitions;
  lastPlayedDate: Date;
}) {
  const race = defs.Race[character.raceHash];
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const className = classy.genderedClassNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const current = characterIsCurrent(character, lastPlayedDate) ? 'current' : '';

  // TODO: update this to be a D2-specific, simplified tile
  return (
    <div className={classNames('character', { current })}>
      <div className="character-box destiny2">
        <div className="background" style={bungieBackgroundStyle(character.emblemBackgroundPath)} />
        <div className="details">
          <div className="emblem" />
          <div className="character-text">
            <div className="top">
              <div className="class">{className}</div>
              <div className="powerLevel">
                <AppIcon icon={powerActionIcon} />
                {character.light}
              </div>
            </div>
            <div className="bottom">
              <div className="race-gender">{genderRace}</div>
              <div className="level">{character.levelProgression.level}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
