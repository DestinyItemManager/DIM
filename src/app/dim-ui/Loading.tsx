import React from 'react';
import './Loading.scss';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

export function Loading({ message }: { message?: string }) {
  return (
    <section className="dim-loading">
      <div className="logo-container">
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
        <div className="logo-square" />
      </div>

      {message && (
        <TransitionGroup className="loading-text-container">
          <CSSTransition
            key={message}
            classNames="loading-text"
            timeout={{ enter: 200, exit: 200 }}
          >
            <div className="loading-text">{message}</div>
          </CSSTransition>
        </TransitionGroup>
      )}
    </section>
  );
}
