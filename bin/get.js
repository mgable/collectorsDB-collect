(function(){
	"use strict";

	var exports = {};

	// includes
	var Q = require('q'),
		util = require('./util.js');

	//asignments
	var results = [],
		count = 0,
		dynamoClient,
		params,
		deferred = Q.defer();


	//public methods
	function getData(keys, table){
		var dynamoClient = util.getDynamoClient(),
			deferred = Q.defer(),
			RequestItems = {};
		
		RequestItems[table] = {Keys: keys, ConsistentRead: false};

		var params = {
		    RequestItems: RequestItems,
		    ReturnConsumedCapacity: 'NONE'
		};
		
		dynamoClient.batchGet(params, function(err, data) {
		    if (err) {
		    	util.logger.log("error", "could not get data", err);
		    	deferred.reject(err);
			} else {
				util.logger.log("verbose", "get data was a success");
				deferred.resolve(data.Responses[table]);
			}
		});

		return deferred.promise;
	}


	function getBulkData(table, key){
		_reset();
		dynamoClient = util.getDynamoClient();

		params = {
			TableName: table,
			FilterExpression: "#date = :date",
		    ExpressionAttributeValues: {":date": key},
		    ExpressionAttributeNames: {"#date":"date"},
			ConsistentRead: false, // optional (true | false)
			ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
		};


		_getBulkData(table, null, key);

		return deferred.promise;
	}

	// private methods
	function _reset(){
		results = [];
		count = 0;
		deferred = Q.defer();
	}

	function _getBulkData(table, startKey, key){
		if (startKey){
			params.ExclusiveStartKey = startKey;
		}

		dynamoClient.scan(params, function(err, data) {
			if (err) {
				console.info(err); // an error occurred
				deferred.reject(err);
			} else {
				results = results.concat(data.Items);
				count += data.Count;
				console.info("got %s items", count);
				if (data.LastEvaluatedKey){	
					_getBulkData(table, data.LastEvaluatedKey, key);
				} else {
					deferred.resolve(results);
				}
			} 
		});
	}

	// exports
	exports.getData = getData;
	exports.getBulkData = getBulkData;

	module.exports = exports;
}());