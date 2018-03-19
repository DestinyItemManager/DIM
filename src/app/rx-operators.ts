// Spelling out each operator we need helps save on bundle size, but it's a pain
// to type everywhere. So we keep them all here and you just have to import rx-operators.
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
