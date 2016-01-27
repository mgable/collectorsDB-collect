"use strict";
(function(){
	var cheerio = require('cheerio'),
		util = require('./util.js'),
		requestObject = util.getRequestObject(),
		parser = {},
		make = {};

	require('datejs');

	function parse(data){
		util.logger.log("parsing: " + requestObject.path);

		var $ = cheerio.load(data),
			results = $("a").map(function(a,b){return myMap(b);}).get(),
			filteredResults = results.filter(function(item){ if (item){return item;}});
		return filteredResults;
	}

	function myMap(data){
		var obj = {};
		//obj.id = util.generateUID();
		obj.title = removeDoubleEscape(data.children[1].data); //title
		obj.link = decodeLink(data.attribs.href); //link to item
		obj.id = util.generateHashCode(obj.link);
		obj.meta = makeSaleData(removeDoubleEscape(data.attribs.x)); //selling price / time of sale / bids / watchers
		obj.src = decodeLink(data.children[0].attribs.src); // image src

		obj.meta.date = {
			"formatted": getDate(obj.meta.date.replace(/^\-/,'').toLowerCase()).toISOString(),
			"origin": obj.meta.date
		};

		if (!obj.src || !obj.title || !obj.link) {
			return false;
		}

		return obj;
	}

	function decodeLink(link){
		return removeDoubleEscape(decodeURIComponent(link).replace(/\\(.)/g,"$1")).replace(/\"/g,"");
	}

	function removeDoubleEscape(link){
		return link.replace(/\\(.)/g,"$1");
	}

	function makeSaleData(line){
		var obj = {}, 
		 	attributes = [{name: "price", type: "float"},{name: "date", type: "string"}, {name: "bids", "type": "integer"},{name: "watchers", type: "integer"}];

		line.replace(/[^\/]*/g, function(data){
			if (data){
				var attribute = attributes.shift();			
				obj[attribute.name] = make[attribute.type](data);
		 	}
		});
		 
		 return obj;
	}

	function makeFloat(num){
		return Math.round(parseFloat(num.replace(/,/,"")) * 100);
	}

	function makeDate(date){
		return new Date(date);
	}

	function makeInteger(num){
		return parseInt(num, 10);
	}

	function makeString(str){
		return str.toString();
	}

	function getDate(which){
		try {
			return eval("Date.today().last()." + which + "()"); // jshint ignore:line
		}catch(e){
			return Date.today();
		}
	}

	make.float = makeFloat;
	make.date = makeDate;
	make.integer = makeInteger;
	make.string = makeString;

	parser.parse = parse;
	
	module.exports = parser;
})();