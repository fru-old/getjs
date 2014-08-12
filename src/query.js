var parse   = require('./parse');
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
				case ':':
					break;
				case '[':
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

	if(!result){
		// TODO
	}
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
