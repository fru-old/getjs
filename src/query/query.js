var parser  = require('../internal/parser');
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
		if(trace[j+1].type === '**'){
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
			throw new Error('Use get() before has().');
		}else{
			var trace = other.traces[0];
			var last  = self.traces.length-1;
			if(self.traces[last].type === '**'){
				throw new Error('Can not use .has with **.');
			}
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

module.exports = Query;