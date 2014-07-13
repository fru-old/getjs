// ** This file describes the state machine that underlies runjs selectors. They
// are specified in a declarative manner. **

// Disjunctive normal form (DNF) is a normalized format that any boolean logic
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
	this.terms = [{
		truthy: truthy || [],
		falsey: falsey || []
	}];
}

DNF.normalize = function(target){
	if(target instanceof DNF)return target;
	if(!target.dnf){
		target.dnf = new DNF([target]);
	}
	return target.dnf;
};

DNF.prototype.or = function(target){
	var self  = this || {};
	var added = DNF.normalize(target).terms;
	var dnf   = DNF.normalize(self);
	dnf.terms = dnf.terms.concat(added);
	return self;
};

/**
 * Resolve if a dnf expression is true or false
 * @param {function} resolver - resolve a single expression to true or false
 */
DNF.prototype.resolve = function(resolver){
	var result = false;
	for(var i = 0; i < this.terms.length; i++){
		var termResult = true;
		var t = this.terms[i].truthy;
		var f = this.terms[i].falsey;
		for(var i = 0; i < t.length; i++){
			termResult &= resolver(t[i]);
		}
		for(var i = 0; i < f.length; i++){
			termResult &= !resolver(f[i]);
		}
		if(termResult)result = true;
	}
	return result;
};

DNF.prototype.map = function(mapper){
	function copy(array){
		var result = [];
		for(var i = 0; i < array.length; i++){
			result[i] = mapper(array[i]);
		}
		return result;
	}
	var result = [];
	for(var i = 0; i < this.terms.length; i++){
		result[i] = {
			truthy: copy(this.terms[i].truthy),
			falsey: copy(this.terms[i].falsey)
		};
	}
	return result;
}

// Assertions are used to filter node objects. Attributes, properties and meta
// information are asserted using predicate functions.
//
// assertion := {
// 	   type: string,        // one of 'attr', 'prop', 'meta'
//     name: string,        // the key of the property to be tested
//     predicate: function  // evaulate property and return bool
//     value: any,          // the reference value to be tested against
// }
function Assertion(type, name, predicate, value){
	/**
 	 * Test a node against assertion
 	 */
	this.resolve = function(node){
		var value = (node[type] || {})[name];
		return predicate(value, value);
	};
};

// statesInfo := [state]
// state := {
//     transitions: [transition],
//     endstate: boolean
// }
// transition := {
//     nextState: number,
//     assertion: dnf<assertion>
// }
function States(transitions, endstates, states){

	transitions = transitions || {};
	this.addTransition = function(from, to, dnfAssertions){
		if(!transitions[from])transitions[from] = [];
		transitions[from].push({
			next: to,
			dnfa: DNF.normalize(dnfAssertions)
		});
	};

	endstates = endstates || {};
	this.setEndState = function(i){
		endstate[i] = true;
	};

	states = states || [0];

	this.resolve = function(){
		for(var i = 0; i < states.length; i++){
			if(endstates[i])return true;
		}
		return false;
	};

	function findTransitions(from, node){
		var ts = transitions[from] || [];
		var result = [];
		for(var i = 0; i < ts.length; i++){
			var matches = ts[i].dnfa.resolve(function(assertion){
				return assertion.resolve(node);
			});

			if(matches){
				result.push(ts[i].next);
			}	
		}
		return result;
	};

	this.transition(node){
		if(states.length === 0)return this;
		var added  = {};
		var result = [];
		for(var i = 0; i < states.length; i++){
			var array = findTransitions(i, states[i]);
			for(var a = 0; a < array.length; a++){
				if(!added[array[a]]){
					added[array[a]] = true;
					result.push(array[a]);
				}
			}
		}
		return new States(transitions, endstates, result);
	};

	this.transition = function(){
		var dnf = DNF.normalize(this);
		return dnf.map(function(){

		});
	}
}


