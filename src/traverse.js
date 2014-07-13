// This file is the core of run.js and describes the basic transformations,  
// there syntax and how these are applied to trees. Because of the lazy nature
// of run.js the transformations are only applied once needed. Transforamtions 
// are speciefied in a declarative manner to optimize lazy evaluation. This 
// API should generally not be exposed to the user.  

/**
 * Check if the argument is a function
 */
function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

/**
 * Childreen class that contains a collection of nodes and exposes all basic
 * transformations that can be executed on the collection.
 */
function Childreen(array){
	this.target   = array ? array.slice(0) : [];
}

Childreen.prototype.append = function(element){
	this.target.push(element);
};

Childreen.prototype.insert = function(index, element){
	this.target.splice(index, 0, element);
};

Childreen.prototype.get = function(index, done){
	done(this.target[index]);
};

Childreen.prototype.each = function(each, dnfAssertions, start, done){
	var index = start||0;
	var self  = this;
	if(index >= this.target.length){
		return done && done();
	}
	function next(){
		self.each(each, done, dnfAssertions, index+1);
	}
	each(index, next);
};

Childreen.prototype.concat = function(childreen, index, done){
	var self = this;
	childreen.each(function(i){
		childreen.get(i, function(element){
			if(index >= 0){
				self.insert(index, element);
				index += 1;
			}else{
				self.append(element);
			}
		});
	}, null, null, done);
};

Childreen.prototype.remove = function(index, count){
	return this.target.splice(index, 1)[0];
};

Childreen.prototype.length = function(done){
	done(this.target.length);
};

Childreen.prototype.finite = function(done){
	done(true);
};

// Basic operations that are executed on a previously selected node. These 
// operations are a lot like bytecodes as there are compact, generic and
// meant to be generated from more high level transformations.
//
// A basic operation either changes atributes, properties or the array of 
// childreen of a node.
// 
// Basic operations are bundled to form an operation with a distinct id.
// 
// operation := {
//     applied: number,  // counts the number of childs this was propagated to
//     id: number,       // the id of this operation
//     ops: [basic],     // basic operations that will be executed
//     ...
// }
// 
// basic := {
//     name: 'wrap',
//     args: ['span'],
//     enabled: true
// }
// 
// Enabled can also be a function that would have access to the current nodes 
// attributes, state and context information. When falsey the basic operation 
// will not run.

/**
 * Global id generator to return ascending ids. 
 */
var ID = {
	current: 1,
	ascending: function(){
		return ID.current++;
	} 
}

/** 
 * Represents a tree node
 */
function Node(){
	this.attr = {};
	this.prop = {};
	this.tag  = null;
	this.text = null;

	this.childreen = new Childreen();
	this.pending   = []; // Array of pending operations to be applied on childreen
	this.previous  = {}; // Operations that are pending or true when allready run
	this.minimum   = -1; // Pending can't have an id less then this

	// TODO write methods to transform pending and operation.count
}

Node.prototype.transform = function(){
	// operations can only change childreen, attributes or properties

	// detach, append, insert, dowrap, unwrap, maping, seting, hassub
	// Traverse over subtree and produce result - hassub

	// operations that "deal" with a child like "detach child at index n"
	// means that every previous operation like "wrap child at index n" has 
	// to be executed or added to pending operation on child n first. 

	// This function can call resolve for this and every child of this.
};

/**
 * Propagate transformations of id <= maximum to the child at index
 * This is called on traversal to pass operations to childreen
 */
Node.prototype.propagate = function(index, maximum){
	// copy only to childreen if this transformation was not applied to parent
	
	// xyz.** -> detach does not detach all descendents of xyz only the childreen

	// But an operation can specifically attach new operations to this.
	// They are not run on this node but pending to be appliable to the childreen.
};






///////// TODO descibe contextual information that will be passed to opertations
// No bytecode stack but contextual information 
// Also contains meta information
// And Match state
// And link to .parent













































































