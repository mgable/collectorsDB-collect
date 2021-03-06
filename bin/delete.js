(function(){
	"use strict";

	var exports = {};

	// includes
	var Q = require("q");

	var util = require("./util.js");

	// assignments
	var dynamoClient,
		scanParams,
		deleteParams,
		count = 0, 
		items = [],
		table,
		date,
		startingDelay,
		increment,
		size,
		delay,
		deferred;

	// public methods
	function removeAll(_table, _date){
		var config = util.getConfigValue("aws");

		table = _table;
		date = _date;
		count = 0;
		items = [];

		deferred = Q.defer();
		dynamoClient = util.getDynamoClient();
		scanParams = _makeParams(table, date);
		startingDelay = config.dynamo.settings.startingDelay;
		increment = config.dynamo.settings.increment;
		delay = startingDelay;
		size = config.dynamo.settings.size;

		util.logger.log("info", "Starting clean-up", {table: table, date: date});
		dynamoClient.scan(scanParams, _onScan);

		return deferred.promise;
	}

	// public methods
	function remove(_table, _date){
		var config = util.getConfigValue("aws");

		table = _table;
		date = _date;


		deferred = Q.defer();
		dynamoClient = util.getDynamoClient();

		util.logger.log("info", "Starting clean-up", {table: table, date: date});

		_delete( _makeParam(table,date));

		return deferred.promise;
	}

	// private methods
	function _makeParams(table, date){ // for scan
		return {
			TableName: table, 
			FilterExpression: "#date < :date",
			ExpressionAttributeNames: {"#date": "date"},
			ExpressionAttributeValues: {":date": date}
		};
	}

	function _makeParam(table, key){
		return {
    		TableName: table,
    		Key: {"date": key}
    	};
	}

	function _onScan(err, data) {
		if (err) {
			util.logger.log("error", "Unable to scan the table. Error JSON", {error: err});
		} else {
			count += data.Items.length;
			items = items.concat(data.Items);

			// continue scanning if we have more items
			if (typeof data.LastEvaluatedKey !== "undefined") {
				util.logger.log("verbose", "Scanning for more...");
				scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
				dynamoClient.scan(scanParams, _onScan);
			} else {
				util.logger.log("verbose", "Finished Scaning", {count: count});
				_deleteAll(items);
			}
		}
	}

	function _delete(params){
		dynamoClient.delete(params, (err, data) => {
			if (err) {
				util.logger.log("error", "delete error", {params});
				deferred.resolve(false);
			} else {
				util.logger.log("verbose", "deleted item", {params});
				deferred.resolve(true);
			} 
		});
	}

	function _deleteAll(items){
		var processItems = _makeItems(items),
			obj = {};

			obj[table] = [];
			deleteParams = {
				RequestItems: obj
			};

		_delIt(processItems);

		function _delIt(results){
			if (results.length){
				deleteParams.RequestItems[table] = results.splice(0,size);
				dynamoClient.batchWrite(deleteParams, _onDelete);

				setTimeout(function(){
					_delIt(results);
				}, delay);

			} else {
				util.logger.log("info", "completed sending items for clean-up");
				deferred.resolve(true);
			}
		}
	}

	function _makeItems(items){
		return items.map(function(item){
			return {
				DeleteRequest:
					{Key: 
						{link: item.link, date: item.date}
					}
				};
		});
	}

	function _onDelete(err, data){
		 if (err) {
			util.logger.log("error", "Unable to scan the table. Error JSON", {error: err});
		} else {

			util.logger.log("verbose", "delete succeed");
			// continue scanning if we have more items
			if (typeof data.LastEvaluatedKey !== "undefined") {
				deleteParams.ExclusiveStartKey = data.LastEvaluatedKey;
				dynamoClient.BatchWrite(deleteParams, _onDelete);
			} else {
				util.logger.log("info", "clean-up completed", {table:table, date: date, count: count});
			}
		}
	}

	//exports
	exports.remove = remove;
	exports.removeAll = removeAll;

	module.exports = exports;
}());