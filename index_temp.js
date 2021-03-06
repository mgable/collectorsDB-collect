(function(){
	"use strict";

	// includes
	var configuration = require('./lib/configuration.js'),
		util = require('./bin/util.js'),
		start = require('./lib/start_process.js'),
		fetch = require('./lib/fetch_data.js'),
		parser = require('./lib/parse_data.js'),
		save = require('./lib/save_data.js'),
		diff = require('./lib/make_diff.js'),
		make = require('./lib/make_index.js'),
		finish = require('./lib/finish_process.js'),
		
		//definitions
		startProcess = start.startProcess,
		fetchData = fetch.fetchData,
		parseData = parser.parseData,
		saveData = save.saveData,
		makeDiff = diff.makeDiff,
		saveDiff = save.saveDiff,
		fetchAdditionData = fetch.fetchAdditionData,
		saveStore = save.saveStore,
		fetchImages = fetch.fetchImages,
		makeIndex = make.makeIndex,
		finishProcess = finish.finishProcess;

	// the process
	configuration.init().then(config => {
		util.setConfig(config).then(() => {
			util.getCategories()
			.then(categories => {

				_process(categories);

				function _process(categories){
					if (categories.length){
						var category = categories.pop();

						startProcess(category)
						.then(fetchData)
						.then(parseData)
						.then(saveData)
						.then(makeDiff)
						.then(saveDiff)
						.then(fetchAdditionData)
						.then(saveDiff)
						.then(saveStore)
						.then(fetchImages)
						.then(makeIndex)
						.then(finishProcess)
						.then(() => {
							_process(categories);
						});
					} else {
						console.info("completely done!!!!!!");
					}
					
				}
			});
		});
	});
	
})();