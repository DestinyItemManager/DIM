'use strict';

const mobileMenu = document.querySelector('.mobile-menu');
const slidingPanelScreen = document.querySelector('.sliding-panel-fade-screen');
const slidingPanelMenu = document.querySelector('.sliding-panel-content');

mobileMenu.addEventListener('click', () => {
  slidingPanelScreen.classList.add('is-visible');
  slidingPanelMenu.classList.add('is-visible');
});

slidingPanelScreen.addEventListener('click', () => {
  slidingPanelScreen.classList.remove('is-visible');
  slidingPanelMenu.classList.remove('is-visible');
});
