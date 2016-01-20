/* jshint shadow: true */

"use strict";

(function(){
	var fs  = require("fs"),
		nodefs = require("node-fs"),
		Q = require("q"),
		http = require("http"),
		url = require('url'),
		logger = require('./logging.js'),
		config = require('./config.js'),
		today = new Date(), 
		diffDirectory = config.sys_config.diffDirectory || "diffs/",
		rawDirectory = config.sys_config.rawDirectory || "raw/",
		storeDirectory = config.sys_config.storeDirectory || "store/",
		indexDirectory = config.sys_config.indexDirectory || "index/",
		category = config.category,
		categoryName = category.name,
		categoryDirectory = categoryName  + "/",
		location = "local",
		util = {};

	function fetchPage(options){
		util.logger.log("fetching: " + options.path);

		var deferred = Q.defer(),
			container = "",
			req = http.request(options, function(res) {

				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					container += chunk;
				});

				res.on('end', function(){
					return deferred.resolve(container);
				});

				res.on('error', function(err){
					util.logger.log(err, 'error');
				});
			});

		req.on('error', function(err) {
			util.logger.log(err, 'error');
			return deferred.reject(err);
		});

		// write data to request body
		req.write('data\n');
		req.end();

		return deferred.promise;
	}

	function generateUID() {
		return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4); // jshint ignore:line
	}

	function getFileName(suffix){
		var suffix =  suffix || "json";
		return categoryName + "." + suffix;
	}

	function getRequestObject(){
		return {
			host: config.domain,
			port: 80,
			path: getPageTemplate(config.category.id),
			method: 'POST'
		};
	}

	function makeLocalImagePath(dateStr, id, filename){
		return makePathFromDateString(dateStr) + "/" + id + "/" + filename;
	}

	function getRawDataPath(fileOverwrite){
		return getRoot() + rawDirectory  + makePathFromDateString(fileOverwrite || getDateString()) + "/";
	}

	function getStoreFilePath(){
		return getRoot() + storeDirectory;
	}

	function getImagePath(fileOverwrite){
		return getStoreFilePath() + "images/" +  makePathFromDateString(fileOverwrite || getDateString()) + "/";
	}

	function getDiffPath(fileOverwrite){
		return getDiffDirectory() + makePathFromDateString(fileOverwrite || getDateString()) + "/";
	}

	function getDiffDirectory(){
		return getRoot() + diffDirectory;
	}

	function getFormattedFile(){
		return getRoot() + indexDirectory;
	}

	function getRoot(){
		var root = config[location].dataRoot;
		return root + categoryDirectory;
	}

	function makePathFromDateString(dateStr){
		var date = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
		date.shift();
		return date.join("/");
	}

	function getDateString(d){
		var date = d || today;
		return date.getFullYear().toString() + pad(date.getMonth()+1) + pad(date.getDate());
	} 

	function pad(date){
		return ("00" + date).slice(-2);
	}

	function getFileContents(filename){
		if (!filename) {return false;}
			
		if (fileExists(filename)){
			var contents = fs.readFileSync(filename).toString();
			return contents ? JSON.parse(contents): false;
		} else {
			return false;
		}
	}

	function save(filename, path, file, data, contentType){ //filename, path, file, data, config.contentType.json
		saveLocal(filename, path, file, data, contentType);
	}


	function saveLocal(filename, path, file, data){
		makeDirectories(path); 
		fs.writeFileSync(file, data);
		logger.log("saving: " + file);
	}

	function fileExists(filePath){
	    try {
	        return fs.statSync(filePath).isFile();
	    } catch (err) {
	        return false;
	    }
	}

	function makeDirectories(path){
		nodefs.mkdirSync(path, "41777", true);
	}

	function readDirectory(path){
		return fs.readdirSync(path);
	}

	function getPageTemplate(id){
		return config.pageUrlTemplate.replace(/( \*{3}) config\.category\.id (\*{3} )/, id);
	}

	function makeOptions(urlstr){
		var urlObj = (url.parse(urlstr));

		var	options = {
			host: urlObj.host,
			port: 80,
			path: urlObj.path,
			method: 'GET',
			agent: false
		};

		return options;
	}

	util.getFormattedFile = getFormattedFile;
	util.fetchPage = fetchPage;
	util.fileExists = fileExists;
	util.readDirectory = readDirectory;
	util.makeOptions = makeOptions;
	util.getDateString = getDateString;
	util.getFileContents = getFileContents;
	util.getFileName = getFileName;
	util.getRawDataPath = getRawDataPath;
	util.getStoreFilePath = getStoreFilePath;
	util.getDiffPath = getDiffPath;
	util.getDiffDirectory = getDiffDirectory;
	util.getImagePath = getImagePath;
	util.getRequestObject = getRequestObject;
	util.logger = logger;
	util.save = save;
	util.generateUID = generateUID;
	util.makeLocalImagePath = makeLocalImagePath;

	module.exports = util;

})();