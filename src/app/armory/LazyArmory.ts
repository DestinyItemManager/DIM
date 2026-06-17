import { lazyWithRetry } from 'app/utils/chunk-load';

export default lazyWithRetry(() => import('./Armory' /* webpackChunkName: "item-popup-armory" */));
