import * as React from 'react';
import classNames from 'classnames';
import { DimStore } from './store-types';

export default function SimpleCharacterTile({ character }: { character: DimStore }) {
  return (
    <div className={classNames('character', { current: character.current })}>
      <div
        className={classNames('character-box', {
          destiny2: character.isDestiny2()
        })}
      >
        <div className="background" style={{ backgroundImage: `url(${character.background})` }} />
        <div className="details">
          <div className="emblem" style={{ backgroundImage: `url(${character.icon})` }} />
          <div className="character-text">
            <div className="top">
              <div className="class">{character.className}</div>
              <div className="powerLevel">{character.powerLevel}</div>
            </div>
            <div className="bottom">
              <div className="race-gender">{character.genderRace}</div>
              <div className="level">{character.level}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
