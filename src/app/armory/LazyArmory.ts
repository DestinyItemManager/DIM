import { lazyWithRetry as lazy } from 'app/utils/chunk-load';

export default lazy(() => import('./Armory' /* webpackChunkName: "item-popup-armory" */));
