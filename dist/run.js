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

/**
 * A possibly infinite stream of elements.
 * @constructor
 * @param {Array} array      - array of elements to serve
 * @param {function=} mapper - all elements are lazily mapped with this function
 */
function Stream(array, mapper){
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
 * Iterate over each element that may match the assertions beginning at the
 * start index.
 * @param {function} each - called for every element found
 * @param {DNF|Assertion} assertions - assertion that may filter elements
 * @param {number} start  - starting index where the iteration begins
 * @param {function} done - called when no more elements can be found.
 */
Stream.prototype.each = function(each, assertions, start, done){
	var self  = this;

	self.next(start||0, assertions, function(err, index, element, ended){
		if(err)return done(err);
		else if(ended) return done && done();	
		
		each(index, element, function(){
			self.each(each, assertions, index+1, done);
		});
	});
};


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

Children.Stream = Stream;

module.exports = Children;



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
;define("src/emitter", function(require, exports, module){
});
;define("src/index", function(require, exports, module){var curry = require('./curry');});
;define("src/input", function(require, exports, module){// https://github.com/ichord/Caret.js/blob/master/src/jquery.caret.js
// http://stackoverflow.com/questions/6930578/get-cursor-or-text-position-in-pixels-for-input-element


// http://stackoverflow.com/questions/2897155/get-cursor-position-in-characters-within-a-text-input-field

// Bounding client rect.
// http://stackoverflow.com/questions/11955345/function-to-get-position-of-an-element-relative-to-the-top-most-window

// http://stackoverflow.com/questions/12194113/how-to-get-range-of-selected-text-of-textarea-in-javascript
function getTextSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end   = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }
    return {start: start, end: end};
}
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


exports.parse = function (code, walker){

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

			lastAttr = line[1].trim();
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
 * Represents a tree node
 */
function Node(){
	this.attr = {};
	this.prop = {};
	this.tag  = null;
	this.text = null;

	this.childreen = new Childreen();
	this.pending   = []; // Array of pending operations to be applied on childreen
	this.previous  = {}; // Operations that are pending or true when allready run
	this.minimum   = -1; // Pending can't have an id less then this

	// TODO write methods to transform pending and operation.count
}

Node.prototype.transform = function(){
	// operations can only change childreen, attributes or properties

	// detach, append, insert, dowrap, unwrap, maping, seting, hassub
	// Traverse over subtree and produce result - hassub

	// operations that "deal" with a child like "detach child at index n"
	// means that every previous operation like "wrap child at index n" has 
	// to be executed or added to pending operation on child n first. 

	// This function can call resolve for this and every child of this.
};

/**
 * Propagate transformations of id <= maximum to the child at index
 * This is called on traversal to pass operations to childreen
 */
Node.prototype.propagate = function(index, maximum){
	// copy only to childreen if this transformation was not applied to parent
	
	// xyz.** -> detach does not detach all descendents of xyz only the childreen

	// But an operation can specifically attach new operations to this.
	// They are not run on this node but pending to be appliable to the childreen.
};












































































});
;define("src/usage", function(require, exports, module){
var interoperability = {
    "ResultSet": {
        "totalResultsAvailable": "1827221",
        "totalResultsReturned": 2,
        "firstResultPosition": 1,
        "Result": [
            {
                "Title": "potato jpg",
                "Summary": "Kentang Si bungsu dari keluarga Solanum tuberosum L ini ternyata memiliki khasiat untuk mengurangi kerutan  jerawat  bintik hitam dan kemerahan pada kulit  Gunakan seminggu sekali sebagai",
                "Url": "http://www.mediaindonesia.com/spaw/uploads/images/potato.jpg",
                "ClickUrl": "http://www.mediaindonesia.com/spaw/uploads/images/potato.jpg",
                "RefererUrl": "http://www.mediaindonesia.com/mediaperempuan/index.php?ar_id=Nzkw",
                "FileSize": 22630,
                "FileFormat": "jpeg",
                "Height": "362",
                "Width": "532",
                "Thumbnail": {
                    "Url": "http://thm-a01.yimg.com/nimage/557094559c18f16a",
                    "Height": "98",
                    "Width": "145"
                }
            },
            {
                "Title": "potato jpg",
                "Summary": "Introduction of puneri aloo This is a traditional potato preparation flavoured with curry leaves and peanuts and can be eaten on fasting day  Preparation time   10 min",
                "Url": "http://www.infovisual.info/01/photo/potato.jpg",
                "ClickUrl": "http://www.infovisual.info/01/photo/potato.jpg",
                "RefererUrl": "http://sundayfood.com/puneri-aloo-indian-%20recipe",
                "FileSize": 119398,
                "FileFormat": "jpeg",
                "Height": "685",
                "Width": "1024",
                "Thumbnail": {
                    "Url": "http://thm-a01.yimg.com/nimage/7fa23212efe84b64",
                    "Height": "107",
                    "Width": "160"
                }
            }
        ]
    }
};


// Only global object is get

// get.func    -> Type: FunctionWrapper
// get.json    -> Type: Pointer
// get.toml    -> Type: Pointer
// get('path') -> Type: Pointer

// pointer.get(['path', 'or'])
// pointer.filter();
// pointer.read();
// pointer.toml();
// pointer.prop();
// pointer.attr();
// pointer.tags();
// pointer.path();
// pointer.each();

// pointer.toJSON({}) // seperate from read so that options can be passed 

// pointer.version();
// pointer.clone(); 
// pointer.restore();
// pointer.extend(); // (clone coud be version + extend)
// pointer.component();

// Pointer only store: roots, paths and operations 
// Never stores any nodes
// Immediate runs these directly but doesnt store found nodes
// Except => detached roots
// pointer.immediate();
// pointer.prop('propname').immediate() -> returns result;
// When not run used immediate filter for propname

// apply operation op with timestamp to node n
// 1. Check than n has never run this op -> otherwise skip all 
// 2. When node was detached after op was issued -> increase counter
// 3. Prepare meta data
// 4. Match selector and if it matches run op
// 5. Add timestamp to op.previous = {}
// 6. Add operation to op.pending = Queue if op is still matchable
// 7. If n is no root increase op counter on parent
// Whenever any end is reached -> cleanup finished operations

// Objects: Operation is passed to n this has a counter which is increased
// Operation is matched and cloned (reset counter) and stored in n 



// pointer.append(); === each(function(){this.append();})
// pointer.before();
// pointer.after();
// pointer.detach();



// TODO thinking
// 1. Can we have an operation that runs for every newly attached node (e.g set every node to span)
// 2. Can we bind to mutations in node and execute action when change 
// in attr or e.g. children was detected
// 3. meta information
// - index of current node
// - depth in tree (stored for every op and increased on cloning)
// - ...

// TODO
// 1. path expression parser
// 2. child.js rethink use of indexes!!!!
// titles.each(function(node, next){
//  node may only be accessed until next is called -> afterwards it throws exception
// });
// detached nodes do not expire

// wrap called on a detached node should makes the formerly detached node expire.
// => Explicit Root Type on which root may be called without expiring -> just the node in .root is changed and expired






var titles = get('ResultSet.Result.[Title]').json(interoperability, {
	// ResultSet checks tags.name and then tags.prop
	// [Title] checks attr first and then prop
	// ResultSet.Result.:prop(Title)
	// ResultSet.Result.*
	// ResultSet.Result.:tags(type=='Object')
	// :tags(prop=='ResultSet').Result.:tags(prop falsey)
	flatten: false  // arrays in arrays become node and are not flattened
});

//Could also do: get.read(interoperability).get('');

titles.prop('Title', 'New title');
titles.prop('Title', function(value){
	return value + ' dom link';
});
titles.each(function(){
	this.prop('Title', this.prop('Title') + " dom link");
});

titles.prop('Title'); // Error: Can only get prop of resolved nodes
titles.immediate().prop('Title');

// Set function
titles.prop('Title', get.func(alert));
titles.prop('Title'); // -> alert




titles.each(function(node){
	this.append({
		name: 'title',
		text: this.prop('Title'),
		attr: {
			'class': ['custome', 'title']
		}
	});
});

titles.each('[Title]',function(){
	var node = this.append({});
	node.text(this.prop('Title'));
});

titles.filter(':single').each(function(){
	// ResultSet.Result.[Title]:single
	// Returns a single instance - which may not be the first instance in the document
	// !== titles.each(':single',function(){ this filters just before each is run
});

titles.each(function(){

	// Special cases here first and each work different
	var node = this.first('title'); // actual node
	this.each('title', function(){ // runs immediately and in order
		//this.detach(); // is this possible
	});

	this.before('selector:any', { // usual case. Doesnt support any . or ** selectors...
		text: 'text'
	});
	// !!!! might not be the same position as when gotten...
	this.after(node, { // most imperative control
		text: 'text'
	});

	// ResultSet.Result.[Title]:any
});

// When resolved with .immediate() meta data contains the position??

// Differenece between node in each loop or pointer???


// Global plugin setTag:

titles.setTag({
	'div:c1': 'ResultSet.Result.[Title].title'
});

// Components

titles.append({ name: '' });

get('ResultSet.Result').make(new XYComponent({
	'test': 'value',
	'test2.path': 'path'
}));

// virtual paths
// path : { 'xy', 'path'} // called with test.xy.

get('xyz').toml('# and no newlines and maxlength', {
	walker: custome_walker
});


var old = titles.version({recurse: false});
old.restore();

// Maybe not needed
get('xyz').html('<div> </div>');


// extend, ...


// How can the elements found under #result be merged into titles?
titles.draw('#result');


// close tree insertion
titles.each(function(node){
    other.append(node.detach());
}).immediate();




// Get syntax

get('{{title}}.name.{{other}}', {
    title: 'title',
    other: 'other'
});

get('title').get(1).get('x.y').get(-1)

get('title1', 'title2', '{{title}}', {
    title: 'title3'
});

get(['title1', 'title2', '{{title}}', {
    title: 'title3'
}]);

// !!! There is a difference between first child element and first match
// !!! get(1) works but get('title:1.xyz') does not! 



// While in an each difference between each and get
titles.each(function(){
    this.each('filter',...) // runs immediate
    this.get('filter').each(...) // runs later
    this.first() // runs immediate
    this.nth(3) // runs immediate
    this.nth(-1) // runs immediate
    this.last() // runs immediate 
})

// Children Length ??
// nth(-1) & last() & get(-1) can only run when the size of 
// children length is known or a search is started...



// Global matches
// Components may 'require' global matches 
// If a component is added to a root so are the global path matchers
// The component can then access them.});
;define("src/utils", function(require, exports, module){exports.warn = function(message){
	
};});
 run.require("src"); 
 }((typeof exports === "undefined" ? window.run={} : exports),Function("return this")()));