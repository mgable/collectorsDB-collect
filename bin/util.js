(function(){
	"use strict";

	var exports = {};

	// includes - their's
	var program = require('commander'),
		Q = require('q'),
		AWS = require('aws-sdk'),
		url = require('url'),
		nodefs = require("node-fs");
		// datejs extends date prototype
		require('datejs');

	// includes - mine
	var	logger = require('./log.js'),
		sysConfig = require('../config/config.js');

	// assignments
	var config,
		currentCategory,
		rawTable,
		diffTable,
		storeTable,
		S3Bucket,
		imageDirectory,
		searchHostIndex;

	// program configuration
	program
		.version('0.0.1')
		.option('-t, --test', 'test mode')
		.option('-c, --create', 'create table')
		.option('-m, --noimages', 'do not download images')
		.option('-i, --init', 'initalize new indexes')
		.option('-x, --nosave', 'do not save')
		.option('-z, --noindex', 'do not index')
		.option('-F, --File [url]', 'load configuration from file [url]')
		.option('-l, --localsave', 'save to local filesystem')
		.parse(process.argv);

	// public methods
	function getCategories(){
		var deferred = Q.defer();

		deferred.resolve(config.source.categories);

		return deferred.promise;
	}

	function init(){
		logger.addLogFile(getIndexType() + "_" + _getDateString()); //'./logs/category_20160101-type.log'
	}

	function getConfigValue(value){
		return config[value];
	}

	function getSysConfigValue(value){
		return sysConfig[value];
	}

	function makeOptions(urlstr, contentType){
		var urlObj = (url.parse(_addProtocal(urlstr)));

		var	options = {
			host: urlObj.hostname,
			port: urlObj.port || 80,
			path: urlObj.path,
			method: 'GET',
			agent: false,
			contentType: contentType || getSysConfigValue("contentTypes").html
		};

		return options;
	}

	function makeDirectories(path){
		nodefs.mkdirSync(path, "41777", true);
		return path + "/";
	}

	function setConfig(_config){
		var deferred = Q.defer();

		config = _config;
		deferred.resolve(config);
		_makeDirectories();

		return deferred.promise;
	}

	function getRequest(category){
		return makeOptions(getConfigValue("source").domain + _getPageTemplate(category.id), getSysConfigValue("contentTypes").json);
	}

	function setCategory(category){
		currentCategory = category;
	}

	function getCurrentCategory(){
		return currentCategory;
	}

	function getTodaysKey(d){
		return parseInt(_getDateString(d), 10);
	}

	function getYesterdaysKey(){
		return getKey(1);
	}

	function getKey(daysAgo){
		return parseInt(_getDateString(Date.today().add(-daysAgo).days()), 10);
	}

	function getRawTable(){
		return _getRoot() + rawTable;
	}

	function getDiffTable(){
		return _getRoot() + diffTable;
	}

	function getImagePath(){
		return _getRoot() + "/" + imageDirectory +  makePathFromDateString(_getDateString()) + "/";
	}

	function getStoreTable(){
		return _getRoot() + storeTable;
	}

	function getS3Bucket(){
		return S3Bucket;
	}

	function getSearchHost(){
		return config.aws.ES.endpoint;
	}

	function getSearchHostIndex(){
		return searchHostIndex;
	}

	function getIndexType(){
		return _getRoot();
	}

	function generateHashCode(s){
		return Math.abs(s.split("").reduce(function(a,b){a = ((a << 5) - a) + b.charCodeAt(0);return a & a;}, 0)); // jshint ignore:line
	}

	function getMapping(){
		// var obj = {},
		// 	type = getIndexType();

		// obj[type] = config.aws.ES.mappings;
		return config.aws.ES.mappings;
	}

	function getDynamoClient(){
		var localConfig = getConfigValue("aws");
		
		// AWS configuration
		AWS.config.update({
			region: localConfig.dynamo.region,
			endpoint: localConfig.dynamo.endpoint
		});

		var credentials = new AWS.SharedIniFileCredentials({profile: localConfig.profile});
		AWS.config.credentials = credentials;

		return new AWS.DynamoDB.DocumentClient();
	}

	function makePathFromDateString(dateStr){
		var date = dateStr.toString().match(/(\d{4})(\d{2})(\d{2})/);
		date.shift();
		return date.join("/");
	}

	// private methods
	function _init(){
		if (program.test){
			logger.log("warn", "Running in TEST mode.");
		}

		if (program.noimages){
			logger.log("warn", "Running in NO SAVE IMAGES mode.");
		}

		if (program.nosave){
			logger.log("warn", "Running in NO SAVE mode.");
		}

		if (program.init){
			logger.log("warn", "Running in INIT mode");
		}

		if (program.program){
			logger.log("warn", "Running in PROGRAM mode");
		}

		if (program.localsave){
			logger.log("warn", "Running in LOCAL SAVE mode");
		}
	}

	function _getPageTemplate(id){
		return getConfigValue("source").pageUrlTemplate.replace(/( \*{3}) config\.category\.id (\*{3} )/, id);
	}

	function _getDateString(d){
		var date = d || new Date();
		return date.getFullYear().toString() + _pad(date.getMonth()+1) + _pad(date.getDate());
	}

	function _pad(date){
		return ("00" + date).slice(-2);
	}

	function _getRoot(){
		var root = currentCategory && currentCategory.name ? currentCategory.name : config.source.categories[0].name;
		return root;
	}

	function _makeDirectories(){
		var c = config.output.directories,
			testPrefix = "test";

		rawTable = program.test ? "_" + testPrefix  + c.rawTable : c.rawTable;
		storeTable = program.test ? "_" + testPrefix + c.storeTable : c.storeTable;
		diffTable = program.test ? "_" + testPrefix + c.diffTable : c.diffTable;
		imageDirectory = c.imageDirectory;
		searchHostIndex = program.test ? testPrefix + "-" +  config.aws.ES.index : config.aws.ES.index;
		S3Bucket = program.test ? testPrefix + "-" + config.aws.S3.bucket : config.aws.S3.bucket;
	}

	function _addProtocal(url){
		if (/^http\:\/\//.test(url)){
			return url;
		} else {
			return "http://" + url;
		}
	}

	//exports
	exports.program = program;
	exports.setConfig = setConfig;
	exports.makeOptions = makeOptions;
	exports.getCategories = getCategories;
	exports.init = init;
	exports.logger = logger;
	exports.getConfigValue = getConfigValue;
	exports.getSysConfigValue = getSysConfigValue;
	exports.getTodaysKey = getTodaysKey;
	exports.getYesterdaysKey = getYesterdaysKey;
	exports.getKey = getKey;
	exports.getRawTable = getRawTable;
	exports.getDiffTable = getDiffTable;
	exports.getStoreTable = getStoreTable;
	exports.getImagePath = getImagePath;
	exports.getS3Bucket = getS3Bucket;
	exports.getRequest = getRequest;
	exports.generateHashCode = generateHashCode;
	exports.getDynamoClient = getDynamoClient;
	exports.makePathFromDateString = makePathFromDateString;
	exports.getSearchHostIndex = getSearchHostIndex;
	exports.getSearchHost = getSearchHost;
	exports.getIndexType = getIndexType;
	exports.getMapping = getMapping;
	exports.getCurrentCategory = getCurrentCategory;
	exports.setCategory = setCategory;
	exports.makeDirectories = makeDirectories;

	module.exports = exports;

	// process
	_init();

}());