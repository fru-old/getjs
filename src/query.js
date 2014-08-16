var parse   = require('./parse');
var machine = require('./state');


function Query(){
	this.root = null;
	this.traces = [];
}

function buildAssertion(type, name, operator, valueName, data){
	var predicate;
	switch (operator) {
		case 'in':
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
		case null:
			predicate = function(a,b){ return a !== undefined; };
			break;
		default:
			throw new Error('Unknown operator '+operator);
	}

	var value;
	if(valueName.length === 1 && valueName[0].breakets){
		value = data(valueName[0].breakets);
	}else if(!operator){
		value = null;
	}else{
		value = readName(valueName, data);
	}
	return new machine.Assertion(type, name, predicate, value);
}

function readName(name, data){
	var result = '';
	for(var i in name){
		if(name[i].breakets){
			result += data(name[i].breakets);
		}else if(name[i].constant){
			result += name[i].constant;
		}else if(name[i].wildcard){
			throw new Error('* not supported here.');
		}
	}
	return result;
}

function isWildcard(check, count){
	if((check[0]||{}).type === '_'){
		// {type: '_', name: [{wildcard: 2}]}
		var number = (check[0].name||{}).wildcard;
		return number === count;
	}
	return false;
}

function buildAssertions(assertions, data){
	var truthy = [];
	assertions.map(function(assertion){
		if(isWildcard(assertion, 1)){
			truthy.push(machine.Assertion.truthy);
		}else{
			var type, name, operator = null, value;
			switch (assertion.type) {
				case '_':
					type = 'tags';
					name = 'name';
					operator = '==';
					value = assertion.name;
					break;
				case '#':
					type = 'attr';
					name = 'id';
					operator = '==';
					value = assertion.name;
					break;
				case '[':
					type = 'prop';
					name = assertion.prop;
					if(assertion.assert){
						operator = assertion.assert;
						value = assertion.value;
					}
					break;
				case ':':
					if(assertion.prop){
						type = assertion.name;
						name = assertion.prop;
						if(assertion.assert){
							operator = assertion.assert;
							value = assertion.value;
						}	
					}else{
						type = 'attr';
						name = 'class';
						operator = 'in';
						value = assertion.name;
					}
					break;
			}
			truthy.push(buildAssertion(type, name, operator, value));
		}
	});
	return new machine.DNF(truthy);
}

Query.buildStateMachine = function(traces, data){
	var result;
	traces.map(function(trace){
		var states = new machine.States();
		trace.map(function(state, index){
			if(state.length === 1 && isWildcard(state,2)){
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
