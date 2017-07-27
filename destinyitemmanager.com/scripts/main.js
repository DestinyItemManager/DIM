'use strict';

var helloWorld = function helloWorld() {
  return console.log('Hello World');
};
helloWorld();

var mobileMenu = document.querySelector('.mobile-menu');
var slidingPanelScreen = document.querySelector('.sliding-panel-fade-screen');
var slidingPanelMenu = document.querySelector('.sliding-panel-content');

mobileMenu.addEventListener('click', function () {
  slidingPanelScreen.classList.add('is-visible');
  slidingPanelMenu.classList.add('is-visible');
});

slidingPanelScreen.addEventListener('click', function () {
  slidingPanelScreen.classList.remove('is-visible');
  slidingPanelMenu.classList.remove('is-visible');
});
//# sourceMappingURL=main.js.map