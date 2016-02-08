"use strict";

/*
	use this tool to send a new index file to elasticsearch
*/

(function(){
	// includes
	var make = require('../lib/make.js'),
		fs = require('fs');

	// assignments
	var items = JSON.parse(fs.readFileSync(__dirname + '/advertising_tins_store.json', 'utf8')),
		index = "test-collectorsdb";

	// the process
	make.makeIndex(items, index, true).then(function(data){
		console.info("done!!!");
	});

})();