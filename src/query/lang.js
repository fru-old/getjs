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