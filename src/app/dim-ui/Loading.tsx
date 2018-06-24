import * as React from 'react';
import './Loading.scss';

export function Loading() {
  return (
    <div className="dim-loading">
    <div>
      <svg
        version="1.1"
        id="Layer_1"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        enable-background="new 0 0 500 500"
      >
        <polyline
          className="outer"
          fill="none"
          stroke="#efefef"
          stroke-width="63"
          stroke-linecap="square"
          stroke-miterlimit="10"
          points="249.3,67.8
          431.7,250.2 249.3,432.6 66.8,250.2 157.3,159.4 "
        />

        <line
          className="inner"
          fill="none"
          stroke="#efefef"
          stroke-width="63"
          stroke-linecap="square"
          stroke-miterlimit="10"
          x1="249.4"
          y1="251.5"
          x2="249.1"
          y2="251.2"
        />
      </svg>
      <div className="outlines">
        <div className="outline" />
        <div className="outline" />
      </div>

      <div className="outlines2">
        <div className="outline" />
        <div className="outline" />
      </div>
      </div>
    </div>
  );
}
