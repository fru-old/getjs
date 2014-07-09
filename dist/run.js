;(function(run, global, undefined){ 
 "use strict"; 

var modules   = {};
var factories = {};
var original  = {};

/**
 * This converts relative paths into absolute module names
 */
function normalize(id, base){
	
	// Some code golf to get the number of "directories" of the id back.
	var dots = /(\.?\.\/?)*/.exec(id)[0];
	var dirCount = Math.floor(dots.replace(/\//g, '').length/1.9 + 0.99);

	if(dirCount){
		// Reduce base by found number of "directories"
		var reduced = base.split('/');
		reduced = reduced.slice(0, reduced.length - dirCount);
		reduced = reduced.join('/');
		
		if(reduced){
			id = reduced + '/' + id.slice(dots.length);
		}
	}
	return id.replace(/\/$/, '');
}

/**
 * @Public
 */
var define = run.define = function(id, factory) { 
	var newid = id.replace(/\/index$/, '');

	// store mapped id to resolve path relative to old path
	if(newid !== id) original[newid] = id;

	// store factory under both new and old ids
	factories[id] = factories[newid] = factory;
};

/**
 * @Public
 */
var require = run.require = function(id) {
	if (!modules[id]){		
		var message = "Could not load module: '"+id+"'";
		if(!factories[id])throw new Error(message);

		// creates custome require function
		var customeRequire = function(newid){
			return require(normalize(newid, original[id] || id));
		};
		
		// This stops infinite recursion with circular dependencies
		var module = {exports: modules[id] = {}};

		// Build module
		factories[id](customeRequire, module.exports, module);
		modules[id] = module.exports;
	}
	
	return modules[id];
};
;define("src/curry", function(require, exports, module){

// Identify the underscore variable
var _curry = (global._ || (global._ = {})).runid = {
  equals: function(target){
    return target && this === target.runid;
  }
};

var curry = module.exports = function(func, enableUncurry){
  
  var uncurry = false;

  var curryable = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var self = this;

    var posCurry = [], last = false;

    if(!uncurry){
      for(var i = 0; i < args.length; i++){
        if(_curry.equals(args[i])){
          posCurry.push(i);
        }
      }
      last = _curry.equals(args[args.length-1]);
    }

    if(posCurry.length === 0 || uncurry){
      return func.apply(self, args);
    }

    return curry(function(){
      var cargs = Array.prototype.slice.call(arguments, 0);

      var expected = posCurry.length - (last ? 1 : 0);
      if(cargs.length < expected){
        throw new Error("Expect at least "+expected+" arguments.");
      }

      if(last)args.pop();
      for(var i = 0; i < cargs.length; i++){
        if(i < expected)args[posCurry[i]] = cargs[i];
        else args.push(cargs[i]);
      }

      return func.apply(self, args);
    }, true);
  };

  curryable.uncurry = function(){
    if(!enableUncurry)throw "Uncurry disabled.";
    uncurry = true;
  };

  return curryable;  
};

});
;define("src/emitter", function(require, exports, module){
});
;define("src/index", function(require, exports, module){var curry = require('./curry');});
;define("src/toml", function(require, exports, module){

/**
 * Filters comments from a single line of toml 
 * @expose uncomment
 * @examples
 * uncomment.exec('code# comment')[1]      // 'code'
 * uncomment.exec('test# # comment')[1]    // 'test'
 * uncomment.exec('"test#" # comment')[1]  // '"test#" '
 */
var uncomment = (function(){

	var comment = '(?:#.*)?';
	var string  = '("([^\\\\"]|(\\\\.))*("|$))';
	var single  = string.replace(/\"/g, '\'');
	var regexp  = string.replace(/\"/g, '/');
	var other   = '([^"\\/\\\'#]*)';
	var isline  = [string, single, regexp, other].join('|');
	
	return new RegExp('^(('+isline+')*)'+comment+'$');
}());

/**
 * RegExp to find and parse table entities
 * @expose isTable
 * @examples
 * isTable.test('[table]')         // true
 * isTable.exec(' [[table]]')[1]   // ' '
 * isTable.exec(' [[table]]')[2]   // '['
 * isTable.exec(' [[table]]')[3]   // 'table'
 */
var isTable   = /^(\s*)\[(\[?)([^\[\]]*)\]\]?\s*(?:#.*)?$/;

/**
 * Attribute lines allways start with a name followed by an equals.
 * @expose canBeLine
 * @examples 
 * canBeLine.test('test=xyz')    // true
 * canBeLine.exec('test=xyz')[1] // 'test'
 * canBeLine.exec('test=xyz')[2] // 'xyz'
 */
var canBeLine = /^\s*([^ \t\[\]]*)\s*=(.*)$/;

// Random string to escape dollar (other types of escaping may fail)
var dollar = 'DollarWWbpyfvjYHaPCXNRW2YTjqj4AvxrC4mZ9BBHFJZ9VNyp';

function unescape(string){
	return string.replace(dollar, '$$');
}

exports.parse = function (code, walker){

	// We are going to use replace - so escape dollar	
	code = code.replace(/\$/g, dollar);

	// Split into lines and normalize whitespace
	code = code.replace(/\r/g, '').split('\n');

	for(var i = 0; i < code.length; i++){

		var table = isTable.exec(code[i]);
		if(!table){
			// Remove all comments table does this 
			code[i] = code[i].replace(uncomment,'$1');
		}
		
		code[i] = code[i].trim();
		if(!code[i])continue;
		
		var line  = canBeLine.exec(code[i]);
		parseLine(table, line, i, code[i], false, walker);
	}

	parseLine(null, null, code.length, null, true, walker);

	return walker.result();
};

// Current expression (can span multiple lines)
var lastExpr  = '';
// Current table
var lastTable = null;
// Current attribute name
var lastAttr  = null;
// Current attributes store
var lastAttrs = null;

function parseLine(table, line, i, current, end, walker){
	var valid = walker.parseExpression(unescape(lastExpr));

	if(lastAttr){ 
		
		// has propertie that neeeds to be valid.
		if((table || end) && !valid){
			walker.error('Expression invalid', i, lastExpr);
			// if walker didnt throw Exception
			lastAttr = null;
			lastExpr = '';
			
		}else if((table || end || line) && valid){
			if(!lastAttrs)lastAttrs = {};
			lastAttrs[lastAttr] = valid.value;
			lastAttr = null;
			lastExpr = '';

		}else{ 
			lastExpr += '\n' + current;
		}
	}

	if(!lastAttr){

		if(table || end){
			if(lastTable){
				var tabspace = walker.smallTabs ? '  ' : '    ';
 				var indent   = lastTable[1].replace(/\t/g, tabspace);
 				var isDouble = !!lastTable[2].length;

 				var name = lastTable[3].trim();
 				name = name.replace(/(^\.+)|(\.+$)/g, '');
 				name = unescape(name.replace(/\.+/g, '.'));

 				if(name !== lastTable[3]){
 					walker.error('Invalid tablename', i, lastTable[3]);
 				}

				sendTable(indent.length, isDouble, name, lastAttrs,  walker);
			}else if(lastAttrs){
				walker.root(lastAttrs);
			}
			lastTable = table;
			lastAttrs = {};
		}else if(line){

			lastAttr = unescape(line[1]).trim();
			lastExpr = line[2]; 
		}else{

			walker.error('Can not parse', i, current);
		}
	}
}

// Previously indented tables
var indentions = [];

// Keys found in the root
var rootkeys = {};

/**
 * The walker must at least support these methods:
 * - parseKey() -> {id: , attr: {}}
 * - push(key {id,attr}, attr, leaf, duplicate)
 * - pop()
 * - parseExpression() -> {value: } or. false
 * - error(message, linenumber)
 * - smallTabs = false
 */
function sendTable(indent, isArray, name, attr, walker){

	while((indentions[indentions.length-1]||{}).indent >= indent){
		var count = indentions.pop().level;
		for(var i = 0; i < count; i++){
			walker.pop();
		}
	}

	name = name.split('.');
	
	var childreen;
	if(indentions.length > 0){
		childreen = indentions[indentions.length-1].childreen;
	}else{
		childreen = rootkeys;
	}	

	indentions.push({
		level: name.length,
		indent: indent,
		childreen: {}
	});

	var keys = '';
	for(var k = 0; k < name.length; k++){
		var key = walker.parseKey(name[k]);
		keys += '.'+key.key;
		var duplicate = !!childreen[keys];
		childreen[keys] = true;
		walker.push(key, attr, k === name.length - 1, duplicate, isArray);
	}
}

});
;define("src/traverse", function(require, exports, module){
function Set(array){
	
	var result = [];
	result.set = {};

	if(array.set)return array;

	var oldpush = Array.prototype.push;
	result.push = function(element){
		var key = JSON.stringify(element);
		if(result.set[key]){
			oldpush.call(result, element);
			result.set[key] = true;	
		}
	}

	return result;
}






/**
 * Match a dom element and transform state
 * @param {object} node            - the dom node that will be matched
 * @param {object} previousMatches - current state to be transformed 
 * @param {number} maxLookAhead    - maximum transition look ahead
 */
function transition(node, previousMatches, maxLookAhead){

	// TODO cleanup names used:
	// transition, match, matches, before...

	var states   = previousMatches.states;
	var previous = previousMatches.matches;
	maxLookAhead = maxLookAhead || 2;
	var matches  = [];
	var counter  = 0;

	for(var i = 0; i < states.length; i++){
		var targetSet =  result.matches[i] = new Set([]);

		for(var ahead = 0; ahead <= maxLookAhead; ahead++){
			var iBefore = i - maxLookAhead + ahead;
			if(iBefore < 0)continue;

			for(var c = 0; c < previous[iBefore].length; c++){

				// todo check if these parameters are optimal
				var previousMatch = {
					position: iBefore,
					state: states[iBefore],
					states: states,
					context: previous[iBefore][c]
				};
				
				findPossibleTransitions(node, previousMatch, i, targetSet);
			}
		}
		counter += targetSet.length;
	}

	return {
		states:  states,
		matches: matches,
		hasMatches: counter > 0,
		hasEndState: (matches[matches.length-1] || []).length > 0;
	};

	// current contains all possible states
	// current has a coolection of states that the parent of element could have matched
	// if the last state matches current will 
}

function findPossibleTransitions(node, previousMatch, transitionToState, foundMatches){
	// todo next
}

// key could be hasEndState
function resolveDNF(dnf, key){

}

function matchAttributes(){

}






























































/*
 * This file is the core of run.js and describes the basic transformations,  
 * there syntax and how these are applied to trees. Because of the lazy nature
 * of run.js the transformations are only applied once needed. Transforamtions 
 * are speciefied in a declarative manner to optimize lazy evaluation. This 
 * API should generally not be exposed to the user.  
 */

 function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};






























/*
 * View of single node so that no operation has to directly change the 
 * underlying tree
 */ 

function Node(){

    // Every node is [startchildreen, generator=null, endchildreen]
    this.hint = function(){

    }
}

/*
 * Basic operations that are executed on a previously selected node. These 
 * operations are a lot like bytecodes as there are compact, generic and
 * meant to be generated from more high level transformations.
 *  
 * operation := {name, args, enabled}
 * 
 * example: {
 *      name: 'wrap',
 *      args: ['span'],
 *      enabled: true
 * }
 * 
 * Enabled can also be a function that would have access to the current nodes 
 * attributes, state and context information. When falsey the operation will 
 * not run.
 *
 * Like bytecode an operation can access a stack to store and retrieve args or 
 * operands. TODO: decribe stack usage
 */

Node.prototype.run= function(operation, stack){
    var enabled = operation.enabled;
    if(isFunction(enabled))
    if(enabled){

    }
}

/*
 * 
 */


/*
 * Ths basic attribute selector is used to find and filter nodes. 
 * 
 * attribute := {name, expected, comparator}
 * 
 * examples: {name: 'id', expected: 'header', comparator: run.equals}
 * examples: {name: 'class', expected: 'cname', comparator: run.in}
 */

/*
 * Disjunctive normal form (DNF) is a normaized format that any boolean logic
 * formular can be transformed to. This may incur in some cases an exponential
 * growth of the resulting DNF formular. 
 * 
 * dnf  := [term]
 * term := {truthy: [], falsey: []}
 *
 * A term contains expressions that musst all be truthy and falsey respectivly 
 * for the term to evaluate true. For a dnf to evaluate true only a single term 
 * in the array has to be true. So the outer array constitutes OR expressions 
 * and the inner arrays are AND expressions. 
 */




});
;define("src/utils", function(require, exports, module){exports.warn = function(message){
	
};});
 run.require("src"); 
 }((typeof exports === "undefined" ? window.run={} : exports),Function("return this")()));