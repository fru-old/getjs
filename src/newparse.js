// This file will relly on state.js

// Language definition

// START -> TERM '.' START
// START -> TERM

// TERM -> '**'
// TERM -> REST
// TERM -> NAME
// TERM -> '*'  
// TERM -> NAME REST
// TERM -> '*'  REST

// REST -> REST REST
// REST -> ':' NAME
// REST -> '[' BREAKET
// REST -> '#' NAME

// BREAKET -> NAME ']'
// BREAKET -> NAME '===' VALUE ']'
// BREAKET -> NAME '!==' VALUE ']'
// BREAKET -> NAME '=='  VALUE ']'
// BREAKET -> NAME '!='  VALUE ']'
// BREAKET -> NAME '<'   VALUE ']'
// BREAKET -> NAME '>'   VALUE ']'
// BREAKET -> NAME '<='  VALUE ']'
// BREAKET -> NAME '>='  VALUE ']'

// VALUE -> VALUE VALUE
// VALUE -> NAME 
// VALUE -> '{{' NAME '}}'

var querylang = {
	start: 0,      // BEGIN
	ended: [1, 2], // NEXT, REST

	context: {
		result: [[]],
		last: function(){

		},
		add: function(VALUEe){

		}
	},

	tokenize: {
		// All groups used here must be non capturing e.g. (?:...).
		'[=!<>]+': {
			type: 'operator',
			invalid: function(operator){
				var allowed = /^((===)|(!==)|(==)|(!==)|<|(<=)|>|(>=)|(~=))$/;
				return !allowed.test(operator);
			}
		},
		'[A-Za-z0-9]+': { type: 'name' },
		'{{?': { type: '{' },
		'}}?': { type: '}' },
		':|#|\\[|\\]|\\.|\\*\\*?|~': {
			type: function(simple){ return simple; }
		}
	},

	// BEGIN -> 0
	// NEXT -> 1
	// REST -> 2
	// COLON -> 3
	// HASH -> 4
	// IDENTFIER -> 5
	// ATTRIBUTE -> 6
	// OPERATOR -> 7
	// VALUE -> 8
	// BREAKET -> 9
	// BREAKET_CLOSE -> 10
	// NEXT_VALUE -> 11

	states: {
		// BEGIN -> ** NEXT
		'0,1,**': function(){ 
			this.result.push([{type: '_', name: [{wildcard: 2}]}]);
		},
		// BEGIN -> * REST
		'0,2,*': function(){ 

		},
		// BEGIN -> name REST
		'0,2,name': function(name){ 

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
		'2,0,.': null,

		// NEXT -> . BEGIN
		'1,0,.': function(){

		},
		// COLON -> name REST
		'3,2,name': function(name){

		},
		// HASH -> name REST
		'4,2,name': function(name){

		},
		// ATTRIBUTE -> name OPERATOR
		'6,7,name': function(name){

		},
		// OPERATOR -> operator VALUE
		'7,8,operator': function(operator){
			var predicate;
			switch (operator) {
				case '~=':
					predicate = function(a,b){ return a.indexOf(b) !== -1; };
					break;
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
		// NEXT_VALUE -> { BREAKET
		'11,9,{': null,
		// BREAKET_CLOSE -> } NEXT_VALUE
		'10,11,}': null,

		// BREAKET -> name BREAKET_CLOSE
		'9,10,name': function(breaket){

		},
		// VALUE -> name NEXT_VALUE
		'8,11,name': function(name){

		},
		// NEXT_VALUE -> name NEXT_VALUE
		'11,11,name': function(name){

		},
		// NEXT_VALUE -> ] REST
		'11,2,]': null
	}
};