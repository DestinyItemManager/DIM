import * as React from 'react';
import { UIView } from "@uirouter/react";
import ManifestProgress from '../shell/ManifestProgress';

export default function Destiny2() {
  console.log("DESTINY 2")
  return (
    <>
      <div id="content">
        <UIView/>
      </div>
      <div className="store-bounds"/>
      <ManifestProgress destinyVersion={2} />
    </>
  );
}
