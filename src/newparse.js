var machine = require('./state');

module.exports = function(lang){
	var tokenize = tokenizer(lang);
	var states   = new machine.States();
	for(var i in lang.endStates){
		states.setEndState(lang.endStates[i]);
	}
	for(var j in lang.states){
		var rule = j.split(',');
		console.log(rule[0]);
	}
	return function(input){
		var context = lang.context();
		var tokens  = tokenize(input);
		for(var t in tokens){

		}
		return context.value();
	};
};

function run (value, parameter, context){
	if(typeof value !== 'function'){
		return value;
	}
	return value.call(context, parameter);
}

var tokenizer = module.exports.tokenizer = function(lang){
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
};








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

module.exports.querylang = {
	endStates: [1, 2], // NEXT, REST

	context: function(){ 
		var context = {
			result: [[]],
			last: function(){

			},
			add: function(assertion){

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
				var allowed = /^((===)|(!==)|(==)|(!==)|<|(<=)|>|(>=)|(~=))$/;
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
	// IDENTFIER -> 5
	// ATTRIBUTE -> 6
	// OPERATOR -> 7
	// VALUE -> 8
	// BREAKET -> 9
	// BREAKET_CLOSE -> 10
	// END_VALUE -> 11

	states: {
		// BEGIN -> ** NEXT
		'0,1,**': function(){ 
			this.add({
				type: '**'
			});
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
				name: name,
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
		'2,0,.': null,

		// NEXT -> . BEGIN
		'1,0,.': function(){
			result.push([]);
		},
		// COLON -> name REST
		'3,2,name': function(name){
			this.add({
				type: ':',
				name: name
			});
		},
		// HASH -> name REST
		'4,2,name': function(name){
			this.add({
				type: '#',
				name: name
			});	
		},
		// ATTRIBUTE -> name OPERATOR
		'6,7,name': function(name){
			var last = this.last();
			if(!last || last.type !== ':'){
				this.add(last = {});
			}
			last.type = last.name || '[';
			last.name = name;
			last.predicate = function(a,b){ return a !== undefined; };
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
		// BREAKET_CLOSE -> } END_VALUE
		'10,11,}': null,

		// BREAKET -> name BREAKET_CLOSE
		'9,10,name': function(breaket){
			this.last().value = function(lookup){
				return lookup(breaket);
			};
		},
		// VALUE -> name END_VALUE
		'8,11,name': function(name){
			this.last().value = function(lookup){
				return name;
			};
		},
		// END_VALUE -> ] REST
		'11,2,]': null
	}
};