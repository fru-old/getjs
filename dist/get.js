;(function(global, undefined){ 
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
function define(id, factory) { 
	var newid = id.replace(/\/index$/, '');

	// store mapped id to resolve path relative to old path
	if(newid !== id) original[newid] = id;

	// store factory under both new and old ids
	factories[id] = factories[newid] = factory;
}

/**
 * @Public
 */
function require(id) {
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
}
// Define get
function get(){

}

get.define  = define;
get.require = require;

get.plugin = function(object){

	function extend(target, key, map){
		var functions = (object||{})[key];
		for(var i in functions){
			target[i] = map ? map(functions[i]) : functions[i];
		}
	}

	extend(get, 'static');
};

/**
 * Executed after every module has been defined
 */
function afterDefine(){
	get.plugin(get.require('src/plugins/serialize'));
	get.plugin(get.require('src/plugins/curry'));
}

// Make get globally available
if(typeof exports === "undefined"){
	window.get = get;
}else{
	module.exports = get;
}
;define("src/internal/context", function(require, exports, module){



function expired(){
	throw new Error('This reference has expired.');
}


// get (problem when id is generated it needs to be cloned)
// childrenFind (must return context)
// childrenNext (must return context)
// childrenRun (add operation to pending)
// internal
// hidding doesnt use timestamps and hence it is implemented here


// pending persistant 
// (may be 2. result of operation)
// (is then executed always before everythig else)
// (persist has a minimal timestamp)
// interceptor has to be on node not on context
// event context can not trigger secondary events 
// get.symbol -> tags.id created on read
// clone stream
// two way binding: -render subtree twice -events change subtree
// resolve _ in node get so the type of node can be concidered
// or resolve via reference prop to attr values

// is it possible to have a dupplicate sub tree in tree and ensure no loops?
// how to handel events?

});
;define("src/internal/node", function(require, exports, module){var Stream = require('./stream');

/**
 * Global id generator to return ascending ids. 
 */
var ID = {
	current: 1,
	ascending: function(){
		return ID.current++;
	} 
};

/**
 * Node instance
 */
function Node(nodedata, children, isRoot){
	this.children  = children || new Stream.Array();
	this.nodedata  = nodedata || new Node.DefaultData();
	// Timestamp of the last operation
	this.timestamp = 0;
	// Still need to run on children {timestamp, operation}
	this.pending   = [];
	this.detached  = isRoot || false;
	this.creation  = ID.ascending();
}


Node.KeyValue = function(initial){
	var values = initial || {};
	this.set = function(key, value){
		return (values[key] = value);
	};
	this.get = function(key){
		return values[key];
	};
	this.clone = function(raw){
		var result = {};
		for(var i in values){
			result[i] = values[i];
		}
		return raw ? result : new Node.KeyValue(result);
	};
};

Node.DefaultData = function(){
	this.attr = new Node.KeyValue();
	this.prop = new Node.KeyValue();
	this.path = new Node.KeyValue();
	this.tags = new Node.KeyValue();
	this.text = new Node.KeyValue();
	this.mark = new Node.KeyValue();
};

Node.DefaultData.prototype.clone = function(){
	var data = new Node.DefaultData();
	for(var i in this){
		data[i] = this[i].clone();
	}
	return data;
};

/**
 * Counts when the done callback should be invoked.
 */
Node.DoneCounter = function(done){
	var count = 0, self = this;
	this.start = function(){
		count++;
	};
	this.close = function(){
		if(count>0)count--;
		if(count === 0){
			count = -1;
			if(done)done();
		}
	};
	this.branch = function(done){
		var result = new DoneCounter(function(){
			if(done)done();
			self.close();
		});
		this.start();
		result.expired = this.expired;
		return result;
	};
	this.expired = function(){
		return count < 0;
	};
};

Node.prototype.scheduleClone = function(root){
	var copy = new Node(this.nodedata, this.children, root);
	copy.pending = this.pending.slice(0);
	
	// Both nodes need to be marked for cloning
	node.cloned = true;
	copy.cloned = true;
	
	return copy;
};

Node.prototype.resolveClone = function(){
	if(this.cloned){
		this.nodedata = this.nodedata.clone();
		this.cloned   = false;
	}
};

/**
 * Run operation (can be used on non-root nodes).
 */
Node.prototype.execute = function(operation, timestamp, done){
	if(!timestamp)timestamp = ID.ascending();
	var counter = new Node.DoneCounter(done);
	counter.start();
	if(this.timestamp < timestamp){
		this.timestamp = timestamp;
		var result  = operation(this, timestamp, counter);
		if(result){
			this.pending.push({
				timestamp: timestamp,
				operation: result
			});
		}
	}
	counter.close();
};

/**
 * Get child at specific version timestamp; run operation <= timestamp.
 */
Node.prototype.resolve = function(child, timestamp, done){
	(function recurse(i){
		var index = this.pending[i] || {};
		var ended = this.pending.length <= i;
		var isOld = index.timestamp > timestamp;
		if(ended || isOld){
			done();
		}else{
			child.execute(index.operation, index.timestamp, function(){
				recurse(i+1);
			});
		}
	}(0));
};

/**
 * Called after all matches may have been resolved. This validates the
 * assertions of the operations <= timestamp and removes the finished.
 */
Node.prototype.cleanup = function(timestamp){
	while(this.pending.length > 0){
		if(this.pending[0].timestamp > timestamp)break;
		this.pending.shift();
	}
};

module.exports = Node;});
;define("src/internal/parser", function(require, exports, module){var machine = require('./state');

function run(value, parameter, context){
	if(typeof value !== 'function'){
		return value;
	}
	return value.call(context, parameter);
}

function assert(state, type){
	return new machine.Assertion(function(token){
		if(token.type !== type)return false;
		run(state, token.token, token.context);
		return true;
	});
}

function tokenizer(lang){
	var definition = lang.tokenize;
	var splitter   = '';
	for(var i in definition){
		if(splitter)splitter += '|';
		splitter += '(?:' + i + ')';
		definition[i].regex = new RegExp('^' + i + '$');
	}
	splitter = new RegExp('(' + splitter + ')');
	return function(input){
		var result = [];
		input = input.split(splitter);
		for(var i = 0; i < input.length; i++){
			var token = input[i];
			if(i%2===0){
				if(token !== ''){
					throw new Error('Unexpected char(s): '+token);
				}
			}else{
				for(var j in definition){
					var current = definition[j];
					if(current.regex.test(token)){
						var type  = run(current.type,token);
						if(run(current.invalid,token)){
							throw new Error('Invalid '+type+': '+token);
						}
						result.push({ type: type, token: token });
						break;
					}
				}
			}
		}
		return result;
	};
}

module.exports = function(lang){
	var tokenize = tokenizer(lang);
	var states   = new machine.States();
	for(var i in lang.endStates){
		states.setEndState(lang.endStates[i]);
	}
	for(var j in lang.states){
		var rule = j.split(',');
		var assertion = assert(lang.states[j], rule[2]);
		states.addTransition(rule[0], rule[1], assertion);
	}
	return function(input){
		var tokens  = tokenize(input);
		var current = states;
		var context = lang.context();
		for(var t in tokens){
			var token = tokens[t];
			token.context = context;
			current = current.transition(token);
			if(current.isDone()){
				throw new Error('Unexpected token: '+token.token);
			}
		}
		if(!current.resolve()){
			throw new Error('Unexpected end of input string.');
		}
		return context.value();
	};
};});
;define("src/internal/state", function(require, exports, module){// ** This file describes the state machine that underlies runjs selectors. They
// are specified in a declarative manner. **

// Disjunctive normal form (DNF) is a normalized format that any boolean logic
// formula can be transformed to. This may incur in some cases an exponential
// growth of the resulting DNF formula. Runjs uses DNF because it allows boolean
// expressions to be more easily reasoned about.
// 
// DNF<exp> := [term]
// term     := {truthy: [exp], falsey: [exp]}
//
// A term contains expressions that must all be truthy and falsey respectively 
// for the term to evaluate true. For a DNF to evaluate true only a single term 
// in the array has to be true. So the outer array constitutes OR expressions 
// and the inner arrays are AND expressions.

/**
 * Constructs a DNF term.
 * @constructor
 * @param {Array=} truthy - the DNF term is true these objects resolve to truthy
 * @param {Array=} falsey - the DNF term is true these objects resolve to falsey
 */
function DNF(truthy, falsey){
	this.terms = [{
		truthy: truthy || [],
		falsey: falsey || []
	}];
}

/**
 * Concatenate two DNF expressions using or.
 * @param {DNF} target - these DNF terms are added to this terms.
 * @returns {DNF}      - this
 */
DNF.prototype.or = function(target){
	if(!(target instanceof DNF))target = new DNF([target]);
	this.terms = this.terms.concat(target.terms);
	return this;
};

// Assertions are used to filter context objects. Attributes, properties and meta
// information are asserted using predicate functions.

/**
 * Construct an assertion
 * @constructor
 * @param {function(?)} predicate - evaluate property and return a boolean
 */
function Assertion(predicate){
	/**
 	 * Test a node against assertion
 	 * @param {Object} context - this is the context that is asserted
 	 * @returns {boolean}      - true only when the assertion is true
 	 */
	this.resolve = function(context){
		return predicate(context);
	};
}

/**
 * Assertion that is allways true
 */
Assertion.truthy = {
	resolve: function(){
		return true;
	}
};


// Now we extend DNF to include the same resolve method that Assertion uses.

/**
 * Resolve if a DNF expression is true or false by calling resolve on the
 * objects in the terms.
 * @param {Object=} node - this node context is passed to every resolve method
 * @returns {boolean}    - true only when all DNF terms resolve to true  
 */
DNF.prototype.resolve = function(context){
	var result = false;
	for(var i = 0; i < this.terms.length; i++){

		var termResult = true;
		var t = this.terms[i].truthy;
		var f = this.terms[i].falsey;
		for(var j = 0; j < t.length; j++){	
			termResult &= t[j].resolve(context);
		}
		for(var k = 0; k < f.length; k++){
			termResult &= !f[k].resolve(context);
		}
		if(termResult)result = true;
	}
	return result;
};

// The States object contains both the state machine and all active states. When
// a context needs to be matched `transition` is called to get a new States object
// with the same state machine but possible different active states.

/**
 * State objects contain both a state machine and all active states.
 * @constructor
 * @param {Array.<number>=} states - the active states
 * @param {Object=} transitions    - transitions between states
 * @param {Object=} endStates      - the end states of the state machine
 */
function States(states, transitions, endStates){

	states      = states      || [0];
	transitions = transitions || {};
	endStates   = endStates   || {};

	/**
	 * Add transition between states to the state machine. 
	 * @param {number} from              - transition from this state
	 * @param {number} to                - transition to this state
	 * @param {DNF|Assertion} assertions - assertions for this transition
	 */
	this.addTransition = function(from, to, assertions){
		if(!transitions[from])transitions[from] = [];
		transitions[from].push({
			next: to,
			dnfa: assertions
		});
	};

	/**
	 * Set a state to be an end state.
	 * @param {number} state - the state that becomes an end state
	 */
	this.setEndState = function(state){
		endStates[state] = true;
	};

	/**
	 * Add an index to the array of active states.
	 */
	this.addActiveState = function(index){
		states.push(index);
	};

	/**
 	 * Test if the active states contains end states.
 	 * @returns {boolean} - true only when an end state was reached
 	 */
	this.resolve = function(){
		for(var i = 0; i < states.length; i++){
			if(endStates[states[i]])return true;
		}
		return false;
	};

	/**
	 * Tests if there are not more active states.
	 * @returns {boolean} - true if there are no more active states
	 */
	this.isDone = function(){
		return states.length === 0;
	};

	/**
	 * Build a new States object with active states corresponding to transition
	 * that are resolved with DNF assertions.
	 * @param {Object} context - the context that is used to transition states
	 * @returns {States}       - object with possibly different active states
	 */
	this.transition = function(context){
		if(states.length === 0)return this;
		var added  = {};
		var result = [];
		for(var i = 0; i < states.length; i++){
			var trans = transitions[states[i]] || [];
			for(var j = 0; j < trans.length; j++){
				if(trans[j].dnfa.resolve(context)){
					var newValue = trans[j].next;
					if(!added[newValue]){
						added[newValue] = true;
						result.push(newValue);
					}
				}	
			}
		}
		return new States(result, transitions, endStates);
	};
}

// We already defined a resolve method that can be used to evaluate a DNF
// expression of States. Now we extend DNF to also include the same transition 
// method that States uses.

/**
 * Transition all States object in a DNF expression given the context.
 * @param {Object} context - context that is matched in the state transition
 * @returns {DNF}          - same terms as this but transitioned
 */
DNF.prototype.transition = function(context){
	function copy(array){
		var result = [];
		for(var i = 0; i < array.length; i++){
			result[i] = array[i].transition(context);
		}
		return result;
	}
	var result = new DNF();
	for(var i = 0; i < this.terms.length; i++){
		result.terms[i] = {
			truthy: copy(this.terms[i].truthy),
			falsey: copy(this.terms[i].falsey)
		};
	}
	return result;
};

/**
 * Tests if there are not more active states - this does not work for DNF's
 * @returns {boolean} - true if there are no more active states
 */
DNF.prototype.isDone = function(context){
	return false;
};

module.exports.States = States;
module.exports.DNF = DNF;
module.exports.Assertion = Assertion;});
;define("src/internal/stream", function(require, exports, module){// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to a stream with the same
// arguments must always return the same result. This initial implementation of
// streams serves an array of elements.

/**
 * A possibly infinite stream of elements.
 * @constructor
 * @param {Array} array    - array of elements to serve
 * @param {bool=} infinite - all elements are lazily mapped with this function
 */
function Stream(infinite){
	this.infinite = !!infinite;
}

/**
 * Asynchronous, return the next element that may match the assertions. This may
 * be overrided to do more concrete enhancements that take the assertions into
 * account while traversing.
 * @param {number} minindex          - the result must be at least this
 * @param {DNF|Assertion} assertions - may be used to improve iteration
 * @param {function} done            - invoked with the result of the method
 */
Stream.prototype.next = function(minindex, assertions, done){
	throw new Error('Not implemented.');
};

/**
 * Stream constructed from array.
 * @constructor
 */
Stream.Array = function(array){
	if(array && !(array instanceof Array)){
		array = [array];
	}
	this.elements = array || [];
};

Stream.Array.prototype = new Stream();

Stream.Array.prototype.next = function(minindex, assertions, done){
	if(minindex >= this.elements.length){
		done(null, minindex, null, {length: this.elements.length});
	}else{
		var element = this.elements[minindex];
		if(this.mapper)element = this.mapper(element);
		done(null, minindex, element);
	}
};

/**
 * Offset the stream by 'moving' the elements of the stream.
 * @constructor
 */
function Offset(original, extend){
	this.original = original;
	this.extend   = extend;
}

Offset.prototype = new Stream();

Offset.prototype.next = function(minindex, assertions, done){
	var self = this;
	function result(err, i, element, ended){
		if(ended){
			ended.length += self.extend;
		}
		done(err, i + self.extend, element, ended);
	}
	this.original.next(minindex - this.extend, assertions, result);
};

/**
 * Wraps an existing stream and lazily maps all values. Can be used to map
 * children recursive when the passed mapper replaces children with a new 
 * Stream.Mapper instance.
 * @constructor
 */
function Mapper(original, mapper){
	this.next = function(minindex, assertions, done){
		function result(err, i, element, ended){
			if(element)mapper(element);
			done(err, i, element, ended);
		}
		this.original.next(minindex, assertions, result);
	};
}

Mapper.prototype = new Stream(); 

/**
 * Build a stream that is a concatination of two existing streams.
 * @constructor
 */
function Append(original, stream){
	this.original = original;
	this.stream   = stream;
}

Append.prototype = new Stream();

Append.prototype.next = function(minindex, assertions, done){
	var self = this;
	this.original.next(minindex, assertions, function(err, i, element, ended){
		if(err)return done(err);
		if(!ended){
			done(err, i, element, null);
		}else{
			if(!self.offset){
				self.offset = new Offset(self.stream, ended.length);
			}
			self.offset.next(minindex, assertions, done);
		}
	});
};

/**
 * Build a substream of an existing stream.
 * @constructor
 */
function Sub(original, index, count, fill){
	this.reduced = new Offset(original, -index);
	this.count   = count;
	this.fill    = fill;
}

Sub.prototype = new Stream();

Sub.prototype.next = function(minindex, assertions, done){
	if(minindex >= this.count && this.fill){
		return done(null, null, null, {length: this.count});
	}
	var self = this;
	this.reduced.next(minindex, assertions, function(err, i, element, ended){
		if(err)return done(err);
		if((!ended || self.fill) && i >= self.count){
			done(err, null, null, {length: self.count});
		}else{
			if(self.fill && ended){
				done(err, i, undefined, null);
			}else{
				done(err, i, element, ended);
			}
		}
	});
};

/**
 * The Infinity number is used to build Sub streams.
 */
var infity = Number.POSITIVE_INFINITY;

/**
 *
 */
Stream.prototype.append = function(nodes){
	if(!(nodes instanceof Stream)){
		nodes = new Stream.Array(nodes);
	}
	return new Append(this, nodes);
};

/**
 *
 */
Stream.prototype.map = function(mapper){
	return new Stream.Mapper(this, mapper);
};

/**
 *
 */
Stream.prototype.prepend = function(index, nodes){
	if(!(nodes instanceof Stream)){
		nodes = new Stream.Array(nodes);
	}
	var head = new Sub(this, 0, index, true);
	var tail = new Sub(this, index, infity);
	return new Append(head, new Append(nodes, tail));
};

/**
 *
 */
Stream.prototype.detach = function(index, length){
	var head = new Sub(this, 0, index, true);
	var tail = new Sub(this, index+length, infity);
	return {
		target: new Append(head, tail),
		result: new Sub(this, index, length)
	};
};

module.exports = Stream;});
;define("src/node", function(require, exports, module){

function expired(){
	throw new Error('This reference has expired.');
}

// The context wraps the child stream and nodedata access to support the 
// following features
// - being notified before nodedata or the child stream is changed to clone the
//   node if this is needed
// - expiring the context when done counting
// - No default interceptors
// - hidden nodes & read-only
// - clone already iterates the tree as an operation on all recursive children
// Last:
// - mapping / intercepting the nodes methods; this may be done by intercepting the context

/**
 * Wraps access to a node 
 */
function Context(node, timestamp, count){

	/**
	 *
	 */
	this.clone = function(){
		if(count.expired())expired();
		/*var root = cloning()
		function doClone(context, n){
			root = cloning(n, !root);
			return doClone;
		}
		*/


		/// TODO how to integrate sub each/find in execute???

		var root;
		execute(node, function(context, node){
			root = cloning(node, true);
			return function recurse(context, node){
				cloning(node);
				return recursive;
			};
		}, timestamp);
		// On this operation execute MUST return immediately
		return new Node.Root(root);
	};

	this.internal = function(){
		return node;
	};

	this.isRoot = function(){
		if(count.expired())expired();
		return node.detached;
	};

	this.isInfinite = function(){
		if(count.expired())expired();
		return !!(node.children||{}).infinite;
	};

	this.set = function(type, key, value){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		node.onchange();
		return node.nodedata[type].set(key, value);
	};

	this.get = function(type, key){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].get(key);
	};

	this.all = function(type){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].clone(true);
	};

	function iterator(find, iterate, each, done){
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		find(function(err, i, element, ended){
			if(ended || err){
				_error = err;
				_ended = ended;
				branch.close();
			}else{
				resolve(node, element, timestamp, function(){
					each(new Context(element, timestamp, branch), i);
					iterate(branch);
				});
			}
		});
	}

	this.next = function(start, assertion, each, done){
		if(count.expired())expired();

		iterator(function(found){
			node.children.next(start, assertion, found);
		}, function(branch){
			branch.close();
		}, each, done);
	};

	this.find = function(start, assertion, each, done){
		if(count.expired())expired();
		if(this.isInfinite()){
			if(done)done(null, {length: 0});
			return;
		}
		var recurse;

		iterator(function(found){
			recurse = function(){
				node.children.next(start, assertion, found);
			};
			recurse();
		}, function(){
			start += 1;
			recurse();
		}, each, done);
	};

}

// TODO
// 1: simple: get, set & next
// 2: hidden nodes & infinite nodes

// Immediate
//root() // bool
//set(type, key, value)
//get(type, key)
//all(type) clone raw
//detach -> context
//...

// Async
//next(start, assertion, done)
//find(start, assertion, each, done)

//tags.readonly
//tags.infinite

Node.Root = function(node){
	node.detached = true;
	this.execute = function(operation, done){
		if(!node.detached)expired();
		execute(node, operation, ID.ascending(), done);
	};
};

function Roots(stream){
	this.prependTo = function(context, index){
		
	};
	this.appendTo = function(context){

	};
}

module.exports = Node;});
;define("src/plugins/curry", function(require, exports, module){/**
 * Special currying implementation that uses the _ character.
 * 
 * @setup
 * var print = get.curry(function(a, b, c){
 *   return '' + a + b + (c||'?');
 * });
 * 
 * // An underscore used as a parameter means that all other parameter are
 * // bound to the function. That function is returned and can be called again
 * // with more parameters.
 * 
 * @example print(1,2,3)    // '123' 
 * @example print(1,2,_)(3) // '123' 
 * @example print(1,_)(2,3) // '123' 
 * @example print(_)(1,2,3) // '123' 
 * 
 * // The Underscore placeholder can be used in between other parameters.
 * 
 * @example print(1,_,3)(2)   // '123'
 * @example print(_,2,_)(1,3) // '123'
 *
 * // The number of parameters that the function print was declared with does
 * // not influence currying.
 *
 * @example print(_,2)(1) // '12?'
 * @example print(1,2)    // '12?'
 *
 * It is possible to curry multiple times.
 * 
 * @example print(1,_)(2,_)(3) // '123' 
 */


// To make this compatible with underscore or any other js utility belt the _ 
// variable is only declared when it doesn't already exist.

var underscore = global._ || (global._ = {});

// We only add a reserved key to the underscore object to make it identifiable
// when used for currying.

var reservedKey = '_getjs_internals_currying';

// Now we can construct a function that checks if a parameter is the underscore 

function isUnderscore(target){
  return target && target[reservedKey] === isUnderscore;
}
underscore[reservedKey] = isUnderscore;

/**
 * This transforms a function into a curry-able function.
 * @param {function} func - the function that is curried
 * @returns {function}    - the result
 */
function curry(func){

  return function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var self = this;

    // Find the positions of underscores in the arguments and whether the last
    // argument is an underscore.
    var found = [];
    var last  = false;
    for(var i = 0; i < args.length; i++){
      if(isUnderscore(args[i])){
        if(i === args.length-1){
          last = true;
          args.pop();
        }else{
          found.push(i);
        }
      }
    }

    // When there are no underscores then run the function directly.
    if(!last && found.length === 0){
      return func.apply(self, args);
    }

    // Returns a curry-able function because one can curry multiple times.
    return curry(function(){

      // Checks that the number of arguments is correct.
      var expected = found.length;
      
      if(arguments.length < expected){
        throw new Error("Expect at least " + expected + " arguments.");
      }

      if(!last && arguments.length > expected){
        throw new Error("Expect no more then " + expected + " arguments.");
      }

      // Insert the arguments into the args array
      for(var i = 0; i < arguments.length; i++){
        var value = arguments[i];
        if(i < expected){
          args[found[i]] = value;
        }else{
          args.push(value);
        }
      }

      return func.apply(self, args);
    });
  };
}

// Export the curry function.

module.exports = {
  "static": {
    curry: curry
  }
};

});
;define("src/plugins/serialize", function(require, exports, module){var Stream = require('../internal/stream');
var Node   = require('../internal/node');
var Query  = require('../query/query');

/**
 * Call cb for every property in the object.
 */
function objectSearch(object, cb){
	for(var i in object){
		if(object.hasOwnProperty(i)){
			cb(i, object[i], false);
		}
	}
}

/**
 * Check if object is an array.
 */
function isArray(object){
	return Object.prototype.toString.call( object ) === '[object Array]';
}

/**
 * Call cb for every element in array.
 */
function arraySearch(array, index, flatten, cb){
	for(var i = 0; i < array.length; i++){
		var nindex = index.slice(0);
		nindex.push(i);
		if(flatten && isArray(array[i])){
			arraySearch(array[i], nindex, flatten, cb);
		}else{
			cb(nindex, array[i], true);
		}
	}
}

/**
 * Build node from object.
 */
function makeNode(object, flatten){
	var result   = new Node.DefaultData();
	var children = [];

	function iterator(index, found, array){
		var node = makeNode(found);
		if(node){
			var tag = array ? 'index' : 'name';
			node.nodedata.tags.set(tag, index);
			children.push(node);
		}else{
			result.prop.set(index, found);
		}
	}

	if(isArray(object)){
		result.tags.set('array', true);
		arraySearch(object, [], flatten, iterator);
	}else if(object.constructor === Object){
		objectSearch(object, iterator);
	}else{
		return null;
	}
	return new Node(result, new Stream.Array(children));
}

function fillArray(context, js, result, rest){
	var index = context.get('tags', 'index');
	function recurse(n){
		if(index.length <= n+1){
			result[index[n]] = js;
		}else{
			result[index[n]] = [];
			recurse(n+1);
		}
	}

	if(index && typeof index[0] === 'number'){
		recurse(0);
	}else{
		rest.push(js);
	}
}

function fillObject(context, js, result, rest){
	var name = context.get('tags', 'name');
	if(name){
		result[name] = js;
	}else{
		rest.push(js);
	}
}

/**
 * Convert runjs root back to a js object
 */
function toJS(context, done){
	var isArray = context.get('tags', 'array');
	var rest    = [];
	var result  = isArray?[]:{};
	context.find(0, null, function(child){
		toJS(child, function(js){
			if(isArray){
				fillArray(child, js, result, rest);
			}else{
				fillObject(child, js, result, rest);
			}
		});
	}, function(){
		if(isArray){
			result = result.concat(rest);
		}
		var prop = context.all('prop');
		for(var i in prop){
			result[i] = prop[i];
		}
		done(result);
	});
}

function isTag(tag){
	tag = tag.split(/^([a-zA-Z]*|\*)/)[1];
	var tags = [
		'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside',
		'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote',
		'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code',
		'col', 'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
		'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
		'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'head',
		'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'html', 'i',
		'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
		'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta',
		'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup',
		'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt',
		'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source',
		'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table',
		'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title',
		'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
	];
	return tags.indexOf(tag) !== -1;
}


function buildNodes(object, nodedata){
	var result = [];
	if(isArray(object)){
		for(var i = 0; i < object.length; i++){
			result.push(buildHtml(object[i], nodedate && nodedata.clone()));
		}
	}else{
		result.push(buildHtml(object, nodedate));
	}
	return result;
}


function buildHtml(object, nodedata){
	var result   = nodedata || new Node.DefaultData();
	var children = [];

	for(var i in object){
		var value = object[i];
		switch(i){
			case 'id':
				result.set('attr', 'id', value);
				break;
			case 'class':
				var current = result.get('attr', 'class');
				if(!isArray(current))current = [];
				for(var j in value){
					current.push(j);
				}
				result.set('attr', 'class', current);
				break;
			case 'attr':
				for(var k in value){
					result.set('attr', k, value[k]);
				}
				break;
			case 'child':
				children = children.concat(buildNodes(value));
				break;
			default:
				var tag = i.split(/^([a-zA-Z0-9]*|\*)/)[1];
				if(isTag(tag) || tag === '*'){
					var html = buildNodes(value, Query.create(i));
					children = children.concat(html);
				}else{
					throw new Error('Unserialize key in html literal: '+i+'.');
				}
		}
	}
	return new Node(result, new Stream.Array(children));
}



module.exports = {
	"static": {

		/**
		 * Static method to build a getjs root node from js objec.
		 */
		read: function(data, options){
			if(!options)options = {};

			var root = makeNode(data, !!options.flatten);
			if(!root){
				throw new Error('Expected toplevel array or object.');
			}
			return new Node.Root(root);
		},

		/**
		 * Static method to build html tree from js object
		 */
		html: function(data){
			var result = buildNodes(data);
			if(result.length !== 1){
				throw new Error('Could not find root node.');
			}
			return result[0];
		},

		/**
		 * Build js object from getjs root node.
		 */
		toJS: function(root, done){
			root.execute(function(context){
				toJS(context, function(result){
					done(result);
				});
			});
		}
	}
};

});
;define("src/public", function(require, exports, module){var Query = require('./query');


function Public(){
	this.root  = null;
	this.query = new Query();
}

Public.prototype.get = function(){
	this.query.concat(new Query(arguments));
	return this;
};

Public.prototype.has = function(){
	this.query.concat(new Query(arguments, {
		isHas: true
	}));
	return this;
};

Public.prototype.from = function(root){
	this.root = root;
	return this;
};


Public.prototype.each = function(func){
	if(this.query.matchesRoot()){
		this.root.execute(function(node){
			func(node);
		});
	}else{
		var state = this.query.buildStateMachine();
		this.root.execute(function(){
			return function iterate(node){
				state = state.transition(node);
				if(state.resolve()){
					func(node);
				}
				if(!state.isDone())return iterate;
			};
		});
	}
};

Public.prototype.live = function(func, done){
	
};









module.exports = Public;
});
;define("src/query/lang", function(require, exports, module){/**
 * Language definition:
 *
 * BEGIN -> TERM . TERM
 * BEGIN -> TERM
 *
 * TERM -> **
 * TERM -> name REST 
 * TERM -> REST
 * TERM -> * REST
 * 
 * REST -> REST REST
 * REST -> : name
 * REST -> # name
 * REST -> [ name ]
 * REST -> [ name operation name ]
 * REST -> [ name operation { name } ]
 */

module.exports = {
	
	endStates: [1, 2], // NEXT, REST

	context: function(){ 
		var context = {
			result: [[]],
			last: function(){
				var current = context.result[context.result.length-1];
				if(current.length !== 0){
					return current[current.length-1];
				}
			},
			add: function(assertion){
				context.result[context.result.length-1].push(assertion);
			},
			value: function(){
				return context.result;
			}
		};
		return context;
	},

	tokenize: {
		// All groups used here must be non capturing e.g. (?:...).
		'[=!<>~]+': {
			type: 'operator',
			invalid: function(operator){
				var allowed = /^((===)|(!==)|(==)|(!==)|<|(<=)|>|(>=))$/;
				return !allowed.test(operator);
			}
		},
		'[A-Za-z0-9_\\-]+': { type: 'name' },
		'{{?': { type: '{' },
		'}}?': { type: '}' },
		':|#|\\[|\\]|\\.|\\*\\*?': {
			type: function(simple){ return simple; }
		},
		'\\s': {
			invalid: function(){
				throw new Error('No whitespace allowed.');
			}
		}
	},

	// BEGIN -> 0
	// NEXT -> 1
	// REST -> 2
	// COLON -> 3
	// HASH -> 4
	// ATTRIBUTE -> 6
	// OPERATOR -> 7
	// VALUE -> 8
	// BREAKET -> 9
	// BREAKET_CLOSE -> 10
	// END_VALUE -> 11

	states: {
		// BEGIN -> ** NEXT
		'0,1,**': function(){
			this.result[this.result.length-1] = {
				type: '**'
			};
		},
		// BEGIN -> * REST
		'0,2,*': function(){ 
			this.add({
				type: '_',
				predicate: function(){return true;}
			});
		},
		// BEGIN -> name REST
		'0,2,name': function(name){ 
			this.add({
				type: '_',
				value: name
			});
		},
		// BEGIN -> : COLON
		'0,3,:': null,
		// BEGIN -> # HASH
		'0,4,#': null,
		// BEGIN -> [ ATTRIBUTE	
		'0,6,[': null,

		// REST -> : COLON
		'2,3,:': null,
		// REST -> # HASH
		'2,4,#': null,
		// REST -> [ ATTRIBUTE
		'2,6,[': null,

		// REST -> . BEGIN
		'2,0,.': function(){
			this.result.push([]);
		},
		// NEXT -> . BEGIN
		'1,0,.': function(){
			this.result.push([]);
		},

		// COLON -> name REST
		'3,2,name': function(name){
			this.add({
				type: ':',
				value: name
			});
		},
		// HASH -> name REST
		'4,2,name': function(name){
			this.add({
				type: '#',
				value: name
			});	
		},
		// ATTRIBUTE -> name OPERATOR
		'6,7,name': function(name){
			var last = this.last();
			if(!last || last.type !== ':'){
				this.add(last = {});
			}
			last.type = last.value || '[';
			last.name = name;
		},
		// OPERATOR -> operator VALUE
		'7,8,operator': function(operator){
			var predicate;
			switch (operator) {
				case '==':
				case '===':
					predicate = function(a,b){ return a == b; };
					break;
				case '!=':
				case '!==':
					predicate = function(a,b){ return a != b; };
					break;
				case '<':
					predicate = function(a,b){ return a < +b; };
					break;
				case '<=':
					predicate = function(a,b){ return a <= +b; };
					break;
				case '>':
					predicate = function(a,b){ return a > +b; };
					break;
				case '>=':
					predicate = function(a,b){ return a >= +b; };
					break;
			}
			this.last().operator  = operator;
			this.last().predicate = predicate;
		},

		// OPERATOR -> ] REST
		'7,2,]': null,
		// VALUE -> { BREAKET
		'8,9,{': null,
		// BREAKET_CLOSE -> } END_VALUE
		'10,11,}': null,

		// BREAKET -> name BREAKET_CLOSE
		'9,10,name': function(name){
			var last = this.last();
			last.value  = name;
			last.lookup = true;
		},
		// VALUE -> name END_VALUE
		'8,11,name': function(name){
			var last = this.last();
			last.value = name;
		},
		// END_VALUE -> ] REST
		'11,2,]': null
	}
};});
;define("src/query/query", function(require, exports, module){var parser  = require('../internal/parser');
var machine = require('../internal/state');
var lang    = require('./lang');
var Node    = require('../internal/node');

function Query(traces, isHas){
	this.traces = [];
	this.isHas  = isHas;
	for(var i = 0; i < (traces||[]).length; i++){
		var trace = traces[i];
		if(typeof trace === 'string'){
			trace = Query.parser(trace);
		}
		if(this.isHas){
			if(trace.length !== 1){
				throw new Error('Can not use . with has().');
			}
		}
		if(trace.length>0)this.traces.push(trace);
	}
}

Query.prototype.clone = function(){
	return new Query(this.traces.slice(0), this.isHas);
};

Query.parser = parser(lang);

Query.prototype.matchesRoot = function(){
	return this.traces.length === 0;
};

Query.prototype.normalizeAssertion = function(assertion, data){
	var type  = assertion.type;
	var name  = assertion.name;
	var check = assertion.predicate;
	var value = assertion.value;
	var type2 = null;
	var name2 = null;

	var result;

	if(assertion.lookup){
		var resolved = data.get(value);
		if(value === undefined){
			throw new Error('Could not resolve {{'+value+'}}.');
		}
		value = resolved;
	}
	if(!predicate)predicate = function(a,b){ 
		return a === b || (a&&(''+a)) === b; 
	};

	switch (type) {
		case '_': 
			type2 = type = 'tags';
			name  = 'name';
			name2 = 'index';
			break;
		case '[':
			type  = 'attr';
			type2 = 'prop';
			name2 = name;
			break;
		case ':':
			type = 'attr';
			name = 'class';
			predicate = function(a,b){ return a.indexOf(b) !== -1; };
			break;
		case '#':
			type = 'attr';
			name = 'id';
			break;
	}

	if(!result){
		result = function(context){
			if(type2 && context.get(type, name) === undefined){
				type = type2; 
				name = name2;
			}
			return check(context.get(type, name), value);
		};
	}
	return new machine.Assertion(result);
};

function buildTransition(states, state, j){
	if(state.type === '**'){
		var truthy = machine.Assertion.truthy;
		states.addTransition(j, j, truthy);
		states.addTransition(j, j+1, truthy);
		if(j === 0)states.addActiveState(1);
	}else{
		var assertions = new machine.DNF(state);
		states.addTransition(j, j+1, assertions);
		if((trace[j+1]||{}).type === '**'){
			states.addTransition(j, j+2, assertions);
		}
	}
}

Query.prototype.buildStateMachine = function(data){
	var self = this;
	var norm = function(assertion){
		return self.normalizeAssertion(assertion, data);
	};

	var result;
	for(var i = 0; i < self.traces.length; i++){

		var states = new machine.States();
		var trace  = self.traces[i];
		states.setEndState(trace.length);

		for(var j = 0; j < trace.length; j++){
			var state = trace[j];
			if(state.map)state = state.map(norm);
			buildTransition(states, state, j);		
		}

		if(result) result.or(states);
		else result = new machine.DNF([states]);
	}
	return result;
};

Query.prototype.concat = function(other){
	var self = this.clone();

	if(other.isHas){
		if(self.matchesRoot()){
			throw new Error("Use get() before has()");
		}else{
			var trace = other.traces[0];
			var last  = self.traces.length-1;
			self.traces[last] = self.traces[last].concat(trace);
		}
	}else{
		self.traces = self.traces.concat(other.traces);
	}
};

Query.create = function(query){
	 var result = new Node.DefaultData();
	 query = Query.parser(query);
	 
	 if(query.length !== 1 || query[0].type === '**'){
	 	throw new Error('Can not use . or ** in html literal.');
	 }

	 var classes = [];

	 for(var i = 0; i < query[0].length; i++){
	 	var assertion = query[0][i];

	 	if(assertion.lookup){
	 		throw new Error('Cant use template {{...}} in html literal.');
	 	}

	 	var op = assertion.operator;
	 	if(op && op !== '==' && op !== '==='){
	 		throw new Error('Can not use operator '+op+' in html literal.');
	 	}

	 	var type  = assertion.type;
		var name  = assertion.name;
		var value = assertion.value;

		if(type === ':'){
			classes.push(value);
			continue;
		}

		switch (type) {
			case '_': 
				type = 'tags';
				name = 'name';
				break;
			case '[':
				type = 'attr';
				break;
			case '#':
				type = 'attr';
				name = 'id';
				break;
		}
		result.set(type, name, value);
	}
	if(classes.length > 0){
		result.set('attr', 'class', classes);
	}
	return result;
};

module.exports = Query;});afterDefine(); 
 }(Function("return this")()));