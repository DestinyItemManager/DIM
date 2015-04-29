AngularJS-Toaster
=================

**AngularJS Toaster** is an AngularJS port of the **toastr** non-blocking notification jQuery library. It requires AngularJS v1.2.6 or higher and angular-animate for the CSS3 transformations. 
(I would suggest to use /1.2.8/angular-animate.js, there is a weird blinking in newer versions.)

### Current Version 0.4.12

## Demo
- Simple demo is at http://plnkr.co/edit/HKTC1a
- Older versions are http://plnkr.co/edit/1poa9A or http://plnkr.co/edit/4qpHwp or http://plnkr.co/edit/lzYaZt (with version 0.4.5)
- Older version with Angular 1.2.0 is placed at http://plnkr.co/edit/mejR4h
- Older version with Angular 1.2.0-rc.2 is placed at http://plnkr.co/edit/iaC2NY
- Older version with Angular 1.1.5 is placed at http://plnkr.co/mVR4P4

## Getting started

Optionally: to install with bower, use:
```
bower install --save angularjs-toaster
```

* Link scripts:

```html
<link href="https://cdnjs.cloudflare.com/ajax/libs/angularjs-toaster/0.4.9/toaster.min.css" rel="stylesheet" />
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular.min.js" ></script>
<script src="https://code.angularjs.org/1.2.0/angular-animate.min.js" ></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/angularjs-toaster/0.4.9/toaster.min.js"></script>
```

* Add toaster container directive: 

```html
<toaster-container></toaster-container>
```

* Prepare the call of toaster method:

```js
	// Display an info toast with no title
	angular.module('main', ['toaster'])
	.controller('myController', function($scope, toaster) {
	    $scope.pop = function(){
	        toaster.pop('success', "title", "text");
	    };
	});
```

* Call controller method on button click:

```html
<div ng-controller="myController">
    <button ng-click="pop()">Show a Toaster</button>
</div>
```

### Close Button

The Close Button's visibility can be configured at three different levels:

* Globally in the config for all toast types:
```html
<toaster-container toaster-options="'close-button': true"></toaster-container>
```

* Per info-class type:
By passing the close-button configuration as an object instead of a boolean, you can specify the global behavior an info-class type should have.
```html
<toaster-container toaster-options="{'close-button': { 'toast-warning': true, 'toast-error': false } }"></toaster-container>
```
If a type is not defined and specified, the default behavior for that type is false.

* Per toast constructed via toaster.pop('success', "title", "text"):
```html
toaster.pop({
                type: 'error',
                title: 'Title text',
                body: 'Body text',
                showCloseButton: true
            });
```
This option is given the most weight and will override the global configurations for that toast.  However, it will not persist to other toasts of that type and does not alter or pollute the global configuration.


### Other Options

```html
// Change display position
<toaster-container toaster-options="{'position-class': 'toast-top-full-width'}"></toaster-container>
```

### Animations
Unlike toastr, this library relies on ngAnimate and CSS3 transformations for animations.
		
## Author
**Jiri Kavulak**

## Credits
Inspired by http://codeseven.github.io/toastr/demo.html.

## Copyright
Copyright © 2013 [Jiri Kavulak](https://twitter.com/jirikavi).

## License 
AngularJS-Toaster is under MIT license - http://www.opensource.org/licenses/mit-license.php