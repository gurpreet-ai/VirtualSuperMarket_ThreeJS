function JSONLoader() {};
/*
	Defines an object, JSONLoader which has two functions, 
	load(), and processResult(). load() performace a fairly generic
	JS api call, the parses the result as JSON and passes that object
	to processResult(). processResult() does nothing, because it
	is designed to be overridden. It is currently overridden by
	ConfigLoader. 
*/
JSONLoader.prototype = {
	load : function(url) {
		var xhr = new XMLHttpRequest();
		var length = 0;
		var loader = this;
		xhr.onreadystatechange = function() {
			if ( xhr.readyState == 4 ) {
				if ( xhr.status == 200 || xhr.status == 0 ) {
					try {
						//call processResult when we get a valud response
						loader.processResult(JSON.parse( xhr.responseText ));
					} catch ( error ) {
						console.error( error );
					}
				} else {
					console.error( "Couldn't load [" + url + "] [" + xhr.status + "]" );
				}
			} else if ( xhr.readyState == 2 ) {
				length = xhr.getResponseHeader( "Content-Length" );
			}
		};
		//a few paramters for the http request
		xhr.open( "GET", url, true );
		xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
		xhr.setRequestHeader( "Content-Type", "text/plain" );
		xhr.send( null );
	},
	//this function should be overriden 
	processResult : function(json) {
		console.error("Do not directly create a JSONLoader");
	}
}