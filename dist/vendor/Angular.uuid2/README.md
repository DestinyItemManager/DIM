Angular UUID and GUID Generator
===========================

Angular UUID and GUID Generator

##How to use
###1
incluede `angular.uuid2.js` or `angular.uuid2.min.js` 
```html
<script src="angular.uuid2.js"></script>
````

or you can install this package from bower 

```
bower install angular.uuid2
````


###2
```javascript
var app = angular.module('app',['angularUUID2']);
````

###3
Inject into your controller

```javascript
app.controller('mainCtrl', ['$scope','uuid2', function($scope,uuid2){

}])
````

###4.1
now you can get UUID 

```javascipt
app.controller('mainCtrl', ['$scope','uuid', function($scope,uuid2){
	$scope.getId = function(){
		$scope.id = uuid2.newuuid();
	}
}])
````
###4.2
or GUID 
```javascript
app.controller('mainCtrl', ['$scope','uuid2', function($scope,uuid2){
	$scope.getId = function(){
		$scope.id = uuid2.newguid();
	}
}])
````

