/*
	use this tool to send a new index file to elasticsearch
*/

(function(){
	"use strict"

	// includes
	var make = require('../lib/make_index.js'),
		configuration = require('../lib/configuration.js'),
		util = require('../bin/util.js'),
		get = require('../bin/get.js'),
		fs = require('fs');

	// assignments

	// the process
	configuration.init().then(function(config){
		util.setConfig(config).then(function(){
			//raw file
			 var todayKey = util.getTodaysKey(),
				table = util.getRawTable();

			// var todayKey = util.getYesterdaysKey(),
			// 	table = util.getRawTable();

			// diff file
			// var todayKey = util.getTodaysKey(),
			// 	table = util.getDiffTable();

			//store file
			// var todayKey = util.getTodaysKey(),
			// 	table = util.getStoreTable();

				console.info(todayKey);
				console.info(table);

			get.getItem(table, {date: todayKey}).then(function(diff){
				console.info("diff");
				fs.writeFileSync(table + "_" + todayKey + ".json", JSON.stringify(diff));
			});

			// get.getBulkDataAll(table).then(function(diff){
			// 	fs.writeFileSync(table + "_" + todayKey + ".json", JSON.stringify(diff));
			// });
		});
	});

})();