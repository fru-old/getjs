
function Set(array){
	if(array.set)return array;

	var result = [];
	result.set = {};

	var oldpush = Array.prototype.push;
	result.push = function(element){
		var key = JSON.stringify(element);
		if(result.set[key]){
			oldpush.call(result, element);
			result.set[key] = true;	
		}
	}

	return result;
}






/**
 * Match a dom element and transform state
 * @param {object} node            - the dom node that will be matched
 * @param {object} previousMatches - current state to be transformed 
 * @param {number} maxLookAhead    - maximum transition look ahead
 */
function transition(node, previousMatches, maxLookAhead){

	// TODO cleanup names used:
	// transition, match, matches, before...

	var states   = previousMatches.states;
	var previous = previousMatches.matches;
	maxLookAhead = maxLookAhead || 2;
	var matches  = [];
	var counter  = 0;

	for(var i = 0; i < states.length; i++){
		var targetSet =  result.matches[i] = new Set([]);

		for(var ahead = 0; ahead <= maxLookAhead; ahead++){
			var iBefore = i - maxLookAhead + ahead;
			if(iBefore < 0)continue;

			for(var c = 0; c < previous[iBefore].length; c++){

				// todo check if these parameters are optimal
				var previousMatch = {
					position: iBefore,
					state: states[iBefore],
					states: states,
					context: previous[iBefore][c]
				};
				
				findPossibleTransitions(node, previousMatch, i, targetSet);
			}
		}
		counter += targetSet.length;
	}

	return {
		states:  states,
		matches: matches,
		hasMatches: counter > 0,
		hasEndState: (matches[matches.length-1] || []).length > 0;
	};

	// current contains all possible states
	// current has a coolection of states that the parent of element could have matched
	// if the last state matches current will 
}

function findPossibleTransitions(node, previousMatch, transitionToState, foundMatches){
	// todo next
}



function Node(underlying){
	//count
	//attr
	//filter(selector): -> stream 
}

Node.prototype.getFiniteCount = function(max){
 	var c = this.count();
 	if(!c || c === Number.POSITIVE_INFINITY)return null;
 	if(c < 0)return 0;
 	return c > max ? max : c;
}

// key could be hasEndState
function resolveDNF(dnf, resolver){

	function resolveInnerDNF(inner){
		if(!inner)return false;
		var t = inner.truthy || {};
		var f = inner.falsey || {};
		if(!t.length && !f.length){
			return resolver(inner);
		}

		var result = true;
		for(var i = 0; i < t.length; i++){
			result &= resolver(t[i]);
		}
		for(var i = 0; i < f.length; i++){
			result &= !resolver(f[i]);
		}
		return result;
	}

	var result = false;
	if(dnf && dnf.length){
		for(var i = 0; i < dnf.length; i++){
			result |= resolveInnerDNF(dnf[i]);
		}
	}else{
		result = resolveInnerDNF(dnf);
	}
	return !!result;
}

function matchAttributes(){

}






























































/*
 * This file is the core of run.js and describes the basic transformations,  
 * there syntax and how these are applied to trees. Because of the lazy nature
 * of run.js the transformations are only applied once needed. Transforamtions 
 * are speciefied in a declarative manner to optimize lazy evaluation. This 
 * API should generally not be exposed to the user.  
 */

 function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};






























/*
 * View of single node so that no operation has to directly change the 
 * underlying tree
 */ 

function Node(){

    // Every node is [startchildreen, generator=null, endchildreen]
    this.hint = function(){

    }
}

/*
 * Basic operations that are executed on a previously selected node. These 
 * operations are a lot like bytecodes as there are compact, generic and
 * meant to be generated from more high level transformations.
 *  
 * operation := {name, args, enabled}
 * 
 * example: {
 *      name: 'wrap',
 *      args: ['span'],
 *      enabled: true
 * }
 * 
 * Enabled can also be a function that would have access to the current nodes 
 * attributes, state and context information. When falsey the operation will 
 * not run.
 *
 * Like bytecode an operation can access a stack to store and retrieve args or 
 * operands. TODO: decribe stack usage
 */

Node.prototype.run= function(operation, stack){
    var enabled = operation.enabled;
    if(isFunction(enabled))
    if(enabled){

    }
}

/*
 * 
 */


/*
 * Ths basic attribute selector is used to find and filter nodes. 
 * 
 * attribute := {name, expected, comparator}
 * 
 * examples: {name: 'id', expected: 'header', comparator: run.equals}
 * examples: {name: 'class', expected: 'cname', comparator: run.in}
 */

/*
 * Disjunctive normal form (DNF) is a normaized format that any boolean logic
 * formular can be transformed to. This may incur in some cases an exponential
 * growth of the resulting DNF formular. 
 * 
 * dnf  := [term]
 * term := {truthy: [], falsey: []}
 *
 * A term contains expressions that musst all be truthy and falsey respectivly 
 * for the term to evaluate true. For a dnf to evaluate true only a single term 
 * in the array has to be true. So the outer array constitutes OR expressions 
 * and the inner arrays are AND expressions. 
 */




