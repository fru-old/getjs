var parser  = require('./parser');
var machine = require('./state');

/**
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

var querylang = {
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
				value: name,
				predicate: function(a,b){return a === b;}
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
				value: name,
				predicate: function(a,b){ return a !== undefined; }
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
			last.predicate = function(a,b){ return a !== undefined; };
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
};

function Query(traces, options){
	this.traces = [];
	this.option = options || {};
	for(var i = 0; i < (traces||[]).length; i++){
		var trace = traces[i];
		if(typeof trace === 'string'){
			trace = Query.parser(trace);
		}
		if(this.option.isHas){
			// TODO: check for no _ and no .'s
		}
		this.traces.push(trace);
	}
}

Query.parser = parser(querylang);

Query.prototype.matchesRoot = function(){
	return this.traces.length === 0;
};

Query.prototype.normalizeAssertion = function(assertion, data){
	var type = assertion.type;
	var name = assertion.name;
	var predicate = assertion.predicate;
	var value = assertion.value;

	// TODO This may need to be configurable 
	// via this.option.type === 'html' ?
	switch (type) {
		case '_':
			type = 'tags';
			name = 'name';
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
		case '[':
			type = 'attr';
			break;
	}

	if(assertion.lookup)value = data.get(value);
	return new machine.Assertion(type, name, predicate, value);
};

Query.prototype.buildStateMachine = function(data){
	var self = this;
	function normalizeAssertion(assertion){
		return self.normalizeAssertion(assertion, data);
	}

	var result;
	for(var i = 0; i < this.traces.length; i++){

		var states = new machine.States();
		var trace  = this.traces[i];
		states.setEndState(trace.length);

		for(var j = 0; j < trace.length; j++){
			var state = trace[j];
			if(state.type === '**'){
				var truthy = machine.Assertion.truthy;
				states.addTransition(j, j, truthy);
				states.addTransition(j, j+1, truthy);
			}else{
				var assertions = new machine.DNF(state.map(normalizeAssertion));
				states.addTransition(j, j+1, assertions);
			}
		}

		if(result) result.or(states);
		else result = new machine.DNF([states]);
	}
	return result;
};

Query.prototype.concat = function(other){
	if(other.option.isHas){
		if(this.matchesRoot()){
			// TODO error 
		}else{
			// TODO
		}
	}else{
		if(this.matchesRoot()){
			this.traces = other.traces;
		}else{
			// TODO
		}
	}
};

module.exports = Query;