
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




