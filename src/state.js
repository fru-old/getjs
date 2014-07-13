// ** This file describes the state machine that underlies runjs selectors. They
// are specified in a declarative manner. **

// Disjunctive normal form (DNF) is a normaized format that any boolean logic
// formular can be transformed to. This may incur in some cases an exponential
// growth of the resulting DNF formular. Runjs uses dnf because it allows bool 
// expressions to be more easily reasoned about.
// 
// dnf<exp> := [term]
// term     := {truthy: [exp], falsey: [exp]}
//
// A term contains expressions that must all be truthy and falsey respectivly 
// for the term to evaluate true. For a dnf to evaluate true only a single term 
// in the array has to be true. So the outer array constitutes OR expressions 
// and the inner arrays are AND expressions.

function DNF(truthy, falsey){

	var terms = arguments[2] || [{
		truthy: truthy || [],
		falsey: falsey || []
	}];

	this.each = function(map){
		for(var i = 0; i < terms.length; i++){
			terms[i] = map(terms[i]) || terms[i];
		}
	};
	this.copy = function(){
		return new DNF([], [], terms.slice(0));
	};
	this.conj = function(dnf){
		if(dnf instanceof DNF){
			dnf.each(function(term){
				terms.push(term);
			});
		}
	};
}

/**
 * Resolve if an dnf expression is true or false
 * @param {function} resolver - resolve a single expression to true or false
 */
DNF.prototype.resolve = function(resolver){
	var result = false;
	this.each(function(term){
		var termResult = true;
		var t = term.truthy;
		var f = term.falsey;
		for(var i = 0; i < t.length; i++){
			termResult &= resolver(t[i]);
		}
		for(var i = 0; i < f.length; i++){
			termResult &= !resolver(f[i]);
		}
		if(termResult)result = true;
	});
	return result;
}

// Assertions are used to filter node objects. Attributes, properties and meta
// information are asserted using predicate functions.
//
// assertion := {
// 	   type: string,        // one of 'attr', 'prop', 'meta'
//     name: string,        // the key of the property to be tested
//     value: any,          // the reference value to be tested against
//     predicate: function  // evaulate property and return bool
// }

function Assertion(type, name, predicate, value){
	/**
 	 * Test a node against assertions
 	 */
	this.match = function(node){
		var value = (node[type] || {})[name];
		return predicate(value, value);
	}
}



// statesInfo := [state]
// state := {
//     transitions: [transition],
//     endstate: boolean
// }
// transition := {
//     nextState: number,
//     assertion: dnf<assertion>
// }

function States(){

	var endstates = {};
	this.setEndState = function(i){
		endstate[i] = true;
	};
	this.isEndState = function(i){
		return endstate[i];
	};

	var transitions = {};
	this.addTransition = function(from, to, dnfAssertions){
		if(!transitions[from])transitions[from] = [];
		transitions[from].push({
			next: to,
			dnfa: dnfAssertions
		});
	};
	this.transition = function(from, node){
		var ts = transitions[from] || [];
		var result = [];
		for(var i = 0; i < ts.length; i++){
			var matches = ts[i].dnfa.resolve(function(a){
				return a.match(node);
			});

			if(matches){
				result.push(ts[i].next);
			}	
		}
		return result;
	};
}

/**
 * Contains a set of active states
 */
function ActiveStates(active, statesInfo){
	var states = active || [0];
	this.states = function(){
		return states.slice(0);
	};
	this.info = statesInfo || new StatesInfo();

	function transform(func){
		var added  = {};
		var result = [];
		for(var i = 0; i < states.length; i++){
			var array = func(states[i]);
			for(var a = 0; a < array.length; a++){
				if(!added[array[a]]){
					added[array[a]] = true;
					result.push(array[a]);
				}
			}
		}
		return new ActiveStates(result, this.info);
	};

	this.isEmpty = function(){
		return states.length === 0;
	};
	this.isMatch = function(statesInfo){
		for(var i = 0; i < states.length; i++){
			if(this.info.isEndState(i))return true;
		}
		return false;
	};
	this.transition = function(node){
		transform(function(state){
			return state.
		});
	};
}

ActiveStates.prototype.transition = function(node, statesInfo){
	return this.transform(function(i){
		var transitions = states[i].transitions;
		var result = [];
		for(var t = 0; t < transitions.length; t++){
			if(Assertion.assertNode(node, transitions[t].assertion)){
				result.push(transitions[t].nextState);
			}
		}
		return result;
	});
}