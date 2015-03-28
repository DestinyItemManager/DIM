window.addEventListener("request-message", function(event) {
	try {
	  var request = event.detail;
	  //console.log("request id is: " + request.id); 
	  //console.log("request options are " + JSON.stringify(request.opts));
	  var opts = request.opts;
	  var xhr = new XMLHttpRequest();
	  xhr.open(opts.method, opts.route, true);
	  xhr.setRequestHeader('x-csrf', self.options.token);
	  xhr.onload = function () {
	    var reply = { id: request.id, "status": xhr.status, "response" : xhr.response};
		window.postMessage(reply, "*");
	  };
	  xhr.onerror = function() { 
		var reply = {id: request.id, "status": xhr.status, "response" : xhr.response};
		window.postMessage(reply,"*");
	  }
	  //console.log("setting the request header to " + self.options.token);
	  if (opts.payload)
	  	xhr.send(JSON.stringify(opts.payload));
	  else
	  	xhr.send();
	}catch(e){
		console.log("try catch error");
		console.log(e.toString());
	}

}, false);