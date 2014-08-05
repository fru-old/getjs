
/**
 * Global id generator to return ascending ids. 
 */
var ID = {
	current: 1,
	ascending: function(){
		return ID.current++;
	} 
};

/**
 * 
 */
function Timestamp(){
	this.major = ID.ascending();
	this.minor = 0;
}

Timestamp.prototype.next = function(){
	var result = new Timestamp();
	result.major = this.major;
	result.minor = ID.ascending();
	return result;
};

Timestamp.prototype.similar = function(other){
	return this.major === other.major
};

Timestamp.prototype.less = function(other){
	if(this.major < other.major)return true;
	return this.major === other.major && this.minor < other.minor;
};

/**
 *
 */
function Wrapper(initial, children, root){
	// This contains the diffrent versions of this wrapped node
	this.versions = {};
	// Current version
	this.current = ID.ascending();

	this.versions[this.current] = {
		children: children || new ArrayStream(), 
		node: initial
	};
	// Timestamp of the last operation
	this.timestamp = new Timestamp();
	// Operations that still need to run on child nodes
	this.pending = {
		minor: [], // {timestamp, operation}
		major: []  // {timestamp, operation}
	}; 

	this.root = root || false;
};

/**
 * Called when an operation is currently running which addes a new operation to
 * be run locally
 */
Wrapper.prototype.splitOperation = function(operation, index){
	operation = operation(this, index);
	this.pending.minor.push({
		timestamp: this.timestamp.next(),
		operation: operation
	});
};

/**
 * Called to add an operation initally to the root and when a specific operation 
 * was found by resolved from pending and needs to be applied.
 */
Wrapper.prototype.applyOperation = function(operation, index, timestamp){
	if(!this.timestamp.less(timestamp))return;
	operation = operation(this, index);

	if(this.root){
		this.pending.major.push({
			timestamp: new Timestamp(),
			operation: operation
		});
	}else{
		if(!timestamp)timestamp = new Timestamp();
		var minor = 
	}


	// run an operation on this node
	

	if(!operation)return;

	// add operation to pending
	// correct on initial apply -> for cascading operations not
	if(minor){
		
	}else{
		this.pending.major.push({
			timestamp: new Timestamp(),
			operation: operation
		});
	}
};

Wrapper.prototype.

Wrapper.prototype.isNotAfter = function(timestamp){
	return !this.timestamp || !timestamp.less(this.timestamp);
};

Wrapper.prototype.beforeChange = function(){
	var current  = this.current;
	var versions = this.versions;
	if(typeof versions[current] === 'number'){
		var old = versions[versions[current]];
		versions[current] = {
			children: old.children, 
			node: old.node.clone()
		};
	}
	return versions[current];
};

function initalizeCloning(wrapper){
	var current  = wrapper.current;
	var versions = wrapper.versions;
	var target   = current;
	if(typeof versions[current] === 'number'){
		target = versions[current];
	}
	var result = new Wrapper();
	result.versions = wrapper.versions;
	result.current  = ID.ascending();
	result.versions[result.current] = target;
	return result;
};

Wrapper.prototype.recursiveClone = function(){

};

/**
 * Used when clearing operations
 */
Wrapper.prototype.recursiveResolve = function(){

};









Pointer.prototype.next = function(assertions, timestamp, each, done){
	function unwrap(err, i, element, ended){
		element = element.versions[element.current];
		done(err, i, element, ended);
	}
	this.pointer.next(index, assertions, offset, unwrap);
};

Pointer.prototype.clear = function(){
	// Recurivly replaces streams and childstreams with the result of 
	// resolving to a specific version
	// {target: [empty stream without pending], result: }
};

Pointer.prototype.clone = function(){
	// Recurivly replaces streams and childstreams with the result of 
	// issueCloning
	// {target: , result: }
};

Pointer.prototype.concat = function(nodes){

};

Pointer.prototype.insert = function(index, nodes){

};

Pointer.prototype.detach = function(index){
	// {target: , result: }
};