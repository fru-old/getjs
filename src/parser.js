var machine = require('./state');

function run(value, parameter, context){
	if(typeof value !== 'function'){
		return value;
	}
	return value.call(context, parameter);
}

function assert(state, type){
	return {
		resolve: function(token){
			if(token.type !== type)return false;
			run(state, token.token, token.context);
			return true;
		}
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
};

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