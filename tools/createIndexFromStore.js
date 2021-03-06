"use strict";
/*
	use this tool to recreate the index from the DynamoDB store
*/
(function(){

	// includes
	var program = require('commander'),
		Q = require('q'),
		AWS = require('aws-sdk'),
		fs = require('fs'),
		nodefs = require("node-fs"),
		util  = require('../bin/util.js'),
		Configuration = require('../lib/configuration.js');

	// assignments
	var deferred = Q.defer(),
		table = "advertising_tins_store",
		filename = table + ".json",
		startKey,
		results = [],
		count = 0,
		docClient;

	// the process
	Configuration.init().then(function(config){
		util.setConfig(config).then(function(){
			docClient = util.getDynamoClient();
			getDataFromDynamo(table, startKey).then(function(data){
				console.info("saving %s items", data.length);
				saveLocal(__dirname, filename, JSON.stringify(data));
			});
		});
	});
	

	function getDataFromDynamo(table, startKey){
		var params = {
			TableName: table,
			ConsistentRead: false, // optional (true | false)
			ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
		};

		if (startKey){
			console.info("fetching more data");
			params.ExclusiveStartKey = startKey;
		}

		docClient.scan(params, function(err, data) {
			if (err) {
				console.info(err); // an error occurred
				return deferred.reject(err);
			} else {
				results = results.concat(data.Items);
				count += data.Count;
				console.info("got %s items", count);
				if (data.LastEvaluatedKey){	
					getDataFromDynamo(table, data.LastEvaluatedKey);
				} else {
					return deferred.resolve(results);
				}
			} 
		});

		return deferred.promise;
	}

	function saveLocal(path, file, data){
		makeDirectories(path); 
		fs.writeFileSync(file, data);
	}

	function makeDirectories(path){
		nodefs.mkdirSync(path, "41777", true);
	}

})();