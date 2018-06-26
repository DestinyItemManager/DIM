import { module } from 'angular';
import 'angular-duration-format';

import { RecordBooksComponent } from './record-books.component';

export default module('recordBooksModule', ['angular-duration-format'])
  .component('recordBooks', RecordBooksComponent)
  .name;
