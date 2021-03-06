(function(){
	"use strict";
	
	var exports = {};

	// includes
	var winston = require('winston'),
		Q = require('q');

	// assignments
	var logger;

	// public methods
	function addLogFile(filename){
		var infoFile = __dirname + '/../logs/' + filename + "-info.log",
			errorFile = __dirname + '/../logs/' + filename + "-error.log",
			verboseFile  = __dirname + '/../logs/' + filename + "-verbose.log";

		logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Console)(),
				new (winston.transports.File)({ filename: errorFile, name:"error_file", level: 'error'}),
				new (winston.transports.File)({ filename: infoFile, name:"info_file", level: 'info'}),
				new (winston.transports.File)({ filename: verboseFile, name:"verbose_file", level: 'verbose'})
			]
		  });

		winston.level = 'debug';
		logger.level = 'debug';

		log("verbose", "adding log file", {filename: filename});
	}

	function log(type, message, meta){
		if(logger) {
			logger.log(type, message, meta || {});
		} else {
			winston.log(type, message, meta || {});
		}
	}

	function report(){
		var deferred = Q.defer(),
			options = {
			from:   new Date() - (24 * 60 * 60 * 1000) * 2,
			until:  new Date(),
			limit:  10000,
			start:  0,
			order:  'asc',
			//fields: ['message', 'meta']
		};

		logger.query(options, function (err, result) {
			if (err) {
				log("error", "winston query error", err);
				deferred.reject(err);
			} else {
				deferred.resolve(_parse(result));
			}
		});

		return deferred.promise;
	}

	// private methods
	function _parse(report){
		return report;
	}

	// exports
	exports.addLogFile = addLogFile;
	exports.report = report;
	exports.log = log;

	module.exports = exports;
})();