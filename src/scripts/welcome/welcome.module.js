import angular from 'angular';
import welcomeComponent from './welcome.component';
import routing from './welcome.routing';

const welcomeModule = angular
    .module('welcomeModule', [])
    .component('welcome', welcomeComponent)
    .config(routing);

export default welcomeModule.name;