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
;define("src/curry", function(require, exports, module){

// Identify the underscore variable
var _curry = (global._ || (global._ = {})).runid = {
  equals: function(target){
    return target && this === target.runid;
  }
};

function curry(func, enableUncurry){
  
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
    return this;
  };

  return curryable;  
}

module.exports = curry;

});

// Define get
function get(){

}

get.define  = define;
get.require = require;

// Make get globally available

if(typeof exports === "undefined"){
	window.get = get;
}else{
	module.exports = get;
}


/**
 * Executed after every module has been defined
 */
function afterDefine(){
	get.require('src/static')(get);	
}
;define("src/node", function(require, exports, module){var Stream = require('./stream');

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

Node.prototype.onchange = function(){
	if(this.cloned){
		var data = {}, pending = [];
		for(var i in this.nodedata){
			data[i] = this.nodedata[i].clone();
		}
		for(var j in this.pending){
			pending[j] = this.pending[j];
		}
		this.nodedata = data;
		this.cloned   = false;
	}
};

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

/**
 * Counts when the done callback should be invoked.
 */
function DoneCounter(done){
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
}

function cloning(node, root){
	// Both nodes need to be marked for cloning
	node.cloned = true;

	var clone = new Node(node.nodedata, node.children, root);
	clone.pending = node.pending;
	clone.cloned  = true;
	return clone;
}

// Run operation
function execute(node, operation, timestamp, done){
	var counter = new DoneCounter(done);
	counter.start();
	if(node.timestamp < timestamp){
		node.timestamp = timestamp;
		var context = new Context(node, timestamp, counter);
		var result  = operation(context, node);
		if(result){
			node.pending.push({
				timestamp: timestamp,
				operation: result
			});
		}
	}
	counter.close();
}

// Get child at specific version and timestamp; run operation <= timestamp
function resolve(parent, child, timestamp, done){
	(function recurse(i){
		var index = parent.pending[i] || {};
		var ended = parent.pending.length <= i;
		var isold = index.timestamp > timestamp;
		if(ended || isold){
			done();
		}else{
			execute(child, index.operation, index.timestamp, function(){
				recurse(i+1);
			});
		}
	}(0));
}

// Called after all matches may have been resolved. This validates the
// assertions of the operations <= timestamp and removes the finished.
function cleanup(parent, timestamp){
	while(parent.pending.length > 0){
		if(parent.pending[0].timestamp > timestamp)break;
		parent.pending.shift();
	}
}

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
		var root;
		function doClone(context, node){
			root = cloning(node, !root);
			return doClone;
		}
		execute(node, doClone, ID.ascending(), function(){});
		// On this operation execute MUST return immediately
		return new Root(root);
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

	this.next = function(start, assertion, each, done){
		if(count.expired())expired();
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		node.children.next(start, assertion, function(err, i, element, ended){
			if(ended || err){
				_error = err;
				_ended = ended;
				branch.close();
			}else{
				resolve(node, element, timestamp, function(){
					each(new Context(element, timestamp, branch), i);
					branch.close();
				});
			}
		});
	};

	this.find = function(start, assertion, each, done){
		if(count.expired())expired();
		if(this.isInfinite()){
			if(done)done(null, {length: 0});
			return;
		}
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		(function recurse(n){
			node.children.next(n, assertion, function(err, i, element, ended){
				if(ended || err){
					_error = err;
					_ended = ended;
					branch.close();
				}else{
					resolve(node, element, timestamp, function(){
						each(new Context(element, timestamp, branch), i);
						recurse(i+1);
					});
				}	
			});
		}(start));
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
;define("src/parse", function(require, exports, module){/**
 * A parsable stream of tokens
 * @constructor
 */
function Parsable(original){
	this.original = original;
}

/**
 * Create a stream of tokens from a regex
 */
Parsable.tokenize = function(string, regex){
	var pos = 0;
	return new Parsable(string.match(regex).map(function(token){
		var result = {
			data: token, 
			pos: pos, 
			assert: function(expected, returnResult){
				var token = this.data;
				if(expected === 'name'){
					if(token.name || '#:[]=!<>.*{}'.indexOf(token[0])===-1){
						return true;
					}
				}else if(token === expected ){
					return true;
				}
				if(returnResult)return false;
				throw new Error([
					'Unexpected symbol "'+token+'" ',
					'expected "'+expected+'" ',
					'at column: '+this.pos
				].join(''));
			}
		};
		pos += token.length;
		return result;
	}));
};

/**
 * Map a stream of tokens.
 */
Parsable.prototype.parse = function(each){
	var current, state = 0;
	var parsable = new Parsable(this.original.map(function(token, i){
		if(!token)return token;
		var removed = false;
		var actions = {
			// Modify current state
			setState: function(s){ state = s; },
			setCurrent: function(c){ current = c; },
			// Remove the current token from the parsable stream
			remove: function(){ removed = true; },
			// Validate the type of the current token
			expected: function(expected, returnResult){
				return token.assert(expected, returnResult);
			}
		};
		var result = each.call(actions, token.data, state, current);
		return removed ? null : {
			data: result, 
			pos: token.pos, 
			assert: token.assert
		};
	}));
	if(state > 0)throw new Error('Unexpected ending.');
	return parsable;
};

module.exports = function(string){

	var parsed = Parsable.tokenize(string,
		/\#|\:|\[|\]|[\=\!<>]+|\{|\}|\*+|\.|[^\#\:\[\]\=\!<>\{\}\*\.]+/g

	).parse(function(token, state, current){

		var name;

		// 0 -> current may be falsy or the current name array
		// 1 -> {{
		// 2 -> {{temp
		// 3 -> {{temp}
		// 4 -> {{temp}}
		
		switch (state) {
    		case 0:
    			if(token[0] === '*'){
    				name = {wildcard: token.length};
    				break;
				}else if(this.expected('name', true)){
					name = {constant: token};
					break;
				}else if(token === '{'){
    				this.setState(1);
				}else{
					this.setCurrent(null);
					return token;
				}
				break;
    		case 1:
    			this.expected('{');
    			this.setState(2);
    			break;
    		case 2:
    			this.expected('name');
    			name = {breakets: token};
    			this.setState(3);
    			break;
    		case 3:
    			this.expected('}');
    			this.setState(4);
    			break;
    		case 4:
    			this.expected('}');
    			this.setState(0);
    			break;
    	}
    	
    	if(!current){
    		this.setCurrent(current = (name ? [name] : []));
    		return {name: current};
    	}else{
    		this.remove();
    		if(name)current.push(name);
    	}

	}).parse(function(token, state, current){

		var newCurrent;

		// -1 -> possibly [ after :
		// 0  -> default
		// 1  -> name after #
		// 2  -> name after :
		// 3  -> allready found [
		// 4  -> allready found [name
		// 5  -> allready found [name=
		// 6  -> expect ]

		switch (state) {
			case -1:
				if(token === '['){
					this.setState(3);
					break;
				}
			/* falls through */
			case 0:
				if(token.name){
					newCurrent = {type: '_', name: token.name};
				}else{
					switch (token) {
						case '.':
							return token;
						case '#':
							this.setState(1);
							break;
						case ':':
							this.setState(2);
							break;
						case '[':
							this.setState(3);
							break;
						default:
							this.expected('#, : or [');
					}
					newCurrent = {type: token};
				}
				break;
			case 1:
			case 2:
				this.expected('name');
				current.name = token.name;
				this.setState(state === 1 ? 0 : -1);
				break;
			case 3:
				this.expected('name');
				current.prop = token.name;
				this.setState(4);
				break;
			case 4:
				if('=!<>'.indexOf(token[0])!==-1){
					current.assert = token;
					this.setState(5);
				}else{
					this.expected(']');
					this.setState(0);
				}
				break;
			case 5:
				this.expected('name');
				current.value = token.name;
				this.setState(6);
				break;
			case 6:
				this.expected(']');
				this.setState(0);
				break;
		}

		if(newCurrent){
			this.setCurrent(newCurrent);
    		return newCurrent;
		}else{
			this.remove();
		}
	});

	// 

	var result = [[]];

	parsed.parse(function(token){
		if(token === '.'){
			result.push([]);
		}else{
			result[result.length-1].push(token);
		}
	});
	
	return result;
};
});
;define("src/query", function(require, exports, module){var parse   = require('./parse');
var machine = require('./state');


function Query(){
	this.root = 
	this.traces = [];
}

Query.buildStateMachine = function(traces){

	function equals(target, value){
		return target === value;
	}

	// TODO: Can this not go into the parser?
	function buildAssertions(assertions, result){
		var truthy = [];
		assertions.map(function(assertion){
			switch (assertion.type) {
				case '_':
					if(assertion.name.length === 1 && assertion.name[0].constant){
						truthy.push(new machine.Assertion(
							'tags', 'name', equals, assertion.name[0].constant
						));
					}else if(assertion.name.wildcard===1){
						truthy.push(machine.Assertion.truthy);
					}else{
						// TODO
					}
					break;
				// TODO
				case '#':
					break;
				case '[':
					break;
				case ':':
					break;
			}
		});
		return new machine.DNF(truthy);
	}

	function isWildcard(state, count){
		if(state.length === 1 && (state[0]||{}).type === '_'){
			// {type: '_', name: [{wildcard: 2}]}
			var number = (state[0].name||{}).wildcard;
			return number === count;
		}
		return false;
	}

	var result;
	traces.map(function(trace){
		var states = new machine.States();
		trace.map(function(state, index){
			if(isWildcard(state,2)){
				var truthy = machine.Assertion.truthy;
				states.addTransition(index, index+1, truthy);
				states.addTransition(index, index, truthy);
			}else{
				var assertions = buildAssertions(state);
				states.addTransition(index, index+1, assertions);
			}
		});
		states.setEndState(trace.length);
		if(result){
			result.or(states);
		}else{
			result = new machine.DNF([states]);
		}
	});

	//if(!result){
		// TODO
	//}
	return result;
};

Query.prototype.get = function(){

};

Query.prototype.has = function(){

};

Query.prototype.from = function(){

};

Query.prototype.each = function(){

};

Query.prototype.live = function(){

};

module.exports = Query;
});
;define("src/state", function(require, exports, module){// ** This file describes the state machine that underlies runjs selectors. They
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

// Assertions are used to filter node objects. Attributes, properties and meta
// information are asserted using predicate functions.

/**
 * Construct an assertion
 * @constructor
 * @param {string}   type           - one of 'attr', 'prop', 'tags' and 'meta'
 * @param {string}   name           - the key of the property to be tested
 * @param {function(?,?)} predicate - evaluate property and return a boolean
 * @param {?}        value          - the reference value to be tested against
 */
function Assertion(type, name, predicate, value){
	/**
 	 * Test a node against assertion
 	 * @param {Object} node - this is the node context that is asserted
 	 * @returns {boolean}   - true only when the assertion is true
 	 */
	this.resolve = function(node){
		return predicate(value, node.get(type, name));
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
DNF.prototype.resolve = function(node){
	var result = false;
	for(var i = 0; i < this.terms.length; i++){

		var termResult = true;
		var t = this.terms[i].truthy;
		var f = this.terms[i].falsey;
		for(var j = 0; j < t.length; j++){	
			termResult &= t[j].resolve(node);
		}
		for(var k = 0; k < f.length; k++){
			termResult &= !f[k].resolve(node);
		}
		if(termResult)result = true;
	}
	return result;
};

// The States object contains both the state machine and all active states. When
// a node needs to be matched `transition` is called to get a new States object
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
	 * Build a new States object with active states corresponding to transition
	 * that are resolved with DNF assertions.
	 * @param {Object} node - the node context that is used to transition states
	 * @returns {States}    - new object with possibly different active states
	 */
	this.transition = function(node){
		if(states.length === 0)return this;
		var added  = {};
		var result = [];
		for(var i = 0; i < states.length; i++){
			var trans = transitions[states[i]] || [];
			for(var j = 0; j < trans.length; j++){
				if(trans[j].dnfa.resolve(node)){
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
 * Transition all States object in a DNF expression given the node.
 * @param {Object} node - node context that is matched in the state transition
 * @returns {DNF}       - same terms as this but transitioned
 */
DNF.prototype.transition = function(node){
	function copy(array){
		var result = [];
		for(var i = 0; i < array.length; i++){
			result[i] = array[i].transition(node);
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

module.exports.States = States;
module.exports.DNF = DNF;
module.exports.Assertion = Assertion;});
;define("src/static", function(require, exports, module){var Stream = require('./stream');
var Node   = require('./node');

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
	return (typeof object !== 'string') && (typeof object.length === 'number');
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





module.exports = function(get){

	/**
	 * Static method to build a getjs root node from js objec.
	 */
	get.read = function(data, options){
		if(!options)options = {};
		var type = options.type ? options.type.toLowerCase() : '';

		if(!type || type === 'js'){
			var root = makeNode(data, !!options.flatten);
			if(!root){
				throw new Error('Expected toplevel array or object.');
			}
			return new Node.Root(root);
		}
	};

	/**
	 * Build js object from getjs root node.
	 */
	get.toJS = function(root, done){
		root.execute(function(context){
			toJS(context, function(result){
				done(result);
			});
		});
	};

};

});
;define("src/stream", function(require, exports, module){// A static collection of elements which can be extended to serve data from ajax
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

module.exports = Stream;});afterDefine(); 
 }(Function("return this")()));