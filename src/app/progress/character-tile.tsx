import { DestinyCharacterComponent, DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { bungieBackgroundStyle, BungieImage } from '../dim-ui/bungie-image';
import { isWellRested } from '../inventory/store/well-rested';

interface CharacterTileProps {
  character: DestinyCharacterComponent;
  characterProgression: DestinyCharacterProgressionComponent;
  defs: D2ManifestDefinitions;
  lastPlayedDate: Date;
}

// TODO: this should probably move to a library of character functions
export function characterIsCurrent(character: DestinyCharacterComponent, lastPlayedDate: Date): boolean {
  return lastPlayedDate.getTime() === new Date(character.dateLastPlayed).getTime();
}

export function CharacterTile(props: CharacterTileProps) {
  const { defs, character, characterProgression, lastPlayedDate } = props;

  const race = defs.Race[character.raceHash];
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const className = classy.genderedClassNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const current = characterIsCurrent(character, lastPlayedDate) ? 'current' : '';

  const wellRested = isWellRested(defs, characterProgression);

  // TODO: update this to be a D2-specific, simplified tile
  return (
    <div className={classNames('character', { current })}>
      <div className="character-box destiny2">
        <div className="background" style={bungieBackgroundStyle(character.emblemBackgroundPath)}/>
        <div className="details">
          <div className="emblem"/>
          <div className="character-text">
            <div className="top">
              <div className="class">{className}</div>
              <div className="powerLevel">{character.light}</div>
            </div>
            <div className="bottom">
              <div className="race-gender">{genderRace}</div>
              {wellRested &&
                <WellRestedPerkIcon defs={defs} />}
              <div className="level">{character.levelProgression.level}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WellRestedPerkIcon(props: { defs: D2ManifestDefinitions }) {
  const { defs } = props;
  const perkDef = defs.SandboxPerk.get(1519921522);
  return <BungieImage className="perk" src={perkDef.displayProperties.icon} title={perkDef.displayProperties.description} />;
}
