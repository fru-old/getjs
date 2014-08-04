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
;define("src/child", function(require, exports, module){
// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to a stream with the same
// arguments must always return the same result. This initial implementation of
// streams serves an array of elements.

function Children(){
	// Operations that still needs to run on the nodes in this stream during the
	// iteration of this stream with next
	this.pending = []; 
	// Stream of wrapped nodes
	this.stream  = new ArrayStream();
}

function Wrapper(original){
	// This contains the diffrent versions of this wrapped node
	this.versions = {
		0: original
	};
}

Children.prototype.next = function(index, assertions, offset, done){
	throw new Error("Not implemented.");
};

Children.prototype.clear = function(){
	this.

	// {target: , result: }
};

Children.prototype.clone = function(){
	// {target: , result: }
};

Children.prototype.concat = function(nodes){

};

Children.prototype.insert = function(index, nodes){

};

Children.prototype.detach = function(index){
	// {target: , result: }
};

/**
 * Iterate over each element that may match the assertions beginning at the
 * start index.
 * @param {function} each - called for every element found
 * @param {DNF|Assertion} assertions - assertion that may filter elements
 * @param {number} start  - starting index where the iteration begins
 * @param {function} done - called when no more elements can be found.
 */
Stream.prototype.each = function(each, assertions, start, done){
	var self  = this;

	self.next(start||0, assertions, 0, function(err, index, element, ended){
		if(err)return done(err);
		else if(ended) return done && done();	
		
		each.call(index, element, function(){
			self.each(each, assertions, index+1, done);
		});
	});
};

// detach, insert

Stream.prototype.insert()








/**
 * A possibly infinite stream of elements.
 * @constructor
 * @param {Array} array      - array of elements to serve
 * @param {function=} mapper - all elements are lazily mapped with this function
 */
function ArrayStream(array, mapper){
	this.elements = array || [];
	this.mapper = mapper;
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
	if(minindex >= this.elements.length){
		done(null, minindex, null, {length: this.elements.length});
	}else{
		var element = this.elements[minindex];
		if(this.mapper)element = this.mapper(element);
		done(null, minindex, element);
	}
};

// This can be used to iterate over the indexes in the stream. Assertions may be
// used by a concrete implementation to enhance the iteration.
// ```
// stream.each(function(index, element, next){
//     // use index and element
//     next();
// }, assertions);
// ```

/**
 * Next element at index and offset all indexes by a given number.
 * @param {Stream|Children} target   - 
 * @param {function} cb   - 
 * @param {number} index  - 
 * @param {DNF|Assertion} assertions -
 * @param {number} offset - 
 */
function next(target, cb, index, assertions, offset){
	if(!offset)offset = 0;
	function offsetCb(err, i, element, ended){
		if(ended)ended.length -= offset;
		cb(err, i - offset, element, ended);
	}
	target.next(index + offset, assertions, offsetCb);
}

/**
 * Build a stream that is a concatination of two existing streams.
 * @constructor
 */
function AppendStream(original, stream){

	this.next = function(minindex, assertions, done){
		next(original, function(err, i, element, ended){
			if(err)return done(err);
			if(!ended){
				done(err, i, element, null);
			}else{
				next(stream, done, minindex, assertions, -ended.length);
			}
		}, minindex, assertions);
	};
}

/**
 * Build a substream of an existing stream.
 * @constructor
 */
function SubStream(original, index, count, fill){

	this.next = function(minindex, assertions, done){
		if(minindex >= count && fill){
			return done(null, null, null, {length: count});
		}
		next(original, function(err, i, element, ended){
			if(err)return done(err);
			if((!ended || fill) && i >= count){
				done(err, null, null, {length: count});
			}else{
				if(fill && ended){
					done(err, i, undefined, null);
				}else{
					done(err, i, element, ended);
				}
			}
		}, minindex, assertions, index);
	};
}

var infity = Number.POSITIVE_INFINITY;

/**
 * Childreen class that contains a collection of nodes and exposes all basic
 * transformations that can be executed on the collection.
 */
function Children(initial){
	if(!(initial instanceof Stream)){
		initial = null;
	}
	this.stream = initial || new Stream();
}

Children.prototype = new Stream();

Children.prototype.get = function(index, done){
	return this.stream.next(index, null, function(){
		
	});
};

Children.prototype.next = function(minindex, assertions, done){
	return this.stream.next(minindex, assertions, done);
};

Children.prototype.each = function(each, assertions, start, done){
	return this.stream.each(each, assertions, start, done);
};

Children.prototype.append = function(element){
	if(!(element instanceof Stream)){
		element = new Stream([element]);
	}
	this.stream = new AppendStream(this.stream, element);
};

Children.prototype.insert = function(index, element){
	if(!(element instanceof Stream)){
		element = new Stream([element]);
	}
	var head = new SubStream(this.stream, 0, index, true);
	var tail = new SubStream(this.stream, index, infity);
	tail = new AppendStream(element, tail);
	this.stream = new AppendStream(head, tail);
};

Children.prototype.detach = function(index, length){
	var head = new SubStream(this.stream, 0, index, true);
	var tail = new SubStream(this.stream, index+length, infity);
	var mid  = new SubStream(this.stream, index, length);
	this.stream = new AppendStream(head, tail);
	return mid;
};

module.exports = Stream;
Stream.Append = AppendStream;
Stream.Sub = SubStream;



});
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
;define("src/node", function(require, exports, module){// tags.index = [0,4,1]
// tags.name = 'xyz'
// tags.root = true

// prop.1 = 1

var Stream = require('./child');

get.json = function(object, options){
	var flatten = (options||{}).flatten;

	var root = makenode(object);
	if(!root){
		throw new Error('Expected toplevel array or object.');
	}
	root.tags.root = true;
	return root;

	function makenode(object){
		var result = new InternalNode();
		var children = [];
		function iterator(index, found, tag){
			var node = makenode(found);
			if(node){
				node.tags[tag] = index;
				children.push(node);
			}else{
				result.prop[index] = found;
			}
		}

		if(typeof object.length === 'number'){
			result.tags.array = true;
			arraysearch(object, [], iterator);
		}else if(object.constructor === Object){
			objectsearch(object, iterator);
		}else{
			return null;
		}

		result.children = new Stream(children);
		return result;
	}

	function objectsearch(object, cb){
		for(var i in object){
			if(object.hasOwnProperty(i)){
				cb(i, object[i], 'name');
			}
		}
	}

	function arraysearch(array, index, cb){
		for(var i = 0; i < array.length; i++){
			var nindex = index.slice(0).push(i);
			if(flatten && array[i].length){
				arraysearch(array[i], nindex, cb);
			}else{
				cb(nindex, array[i], 'index');
			}
		}
	}
};

});
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

exports.parse = function(string){

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
 	 * @param {Object} node - this is the node that is asserted
 	 * @returns {boolean}   - true only when the assertion is true
 	 */
	this.resolve = function(node){
		var expected = (node[type] || {})[name];
		return predicate(value, expected);
	};
}

// Now we extend DNF to include the same resolve method that Assertion uses.

/**
 * Resolve if a DNF expression is true or false by calling resolve on the
 * objects in the terms.
 * @param {Object=} node - this node is passed to every resolve method
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
	 * @param {Object} node - the node that is used to transition the states
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
 * @param {Object} node - node that is matched in the state transition
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
 run.require("src"); 
 }((typeof exports === "undefined" ? window.run={} : exports),Function("return this")()));