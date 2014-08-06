
/**
 * Global id generator to return ascending ids. 
 */
var ID = {
	current: 1,
	ascending: function(){
		return ID.current++;
	} 
};


// Context 
function DoneCounter(done){
	var count = 0;
	this.start = function(){
		count++;
	};
	this.close = function(){
		count--;
		if(count === 0){
			counter = -1;
			done();
		}
	};
	this.expired = function(){
		return count < 0;
	};
}

// Run operation
function execute(child, operation, done){

} 

// Get child at specific version and timestamp; run operation <= timestamp
function resolve(parent, child, timestamp, done){
	// execute any operation on child
}

// Called after all matches may have been resolved. This validates the
// assertions of the operations <= timestamp and removes the finished.
function cleanup(parent, timestamp, remove){
	
}





// The context wraps the child stream and nodedata accesss to support the 
// following features
// - being notified before nodedata or the child stream is changed to clone the
//   node if this is needed
// - expiring the context when done counting
// - No default interceptors
// - hidden nodes & readonly
// - clone already iterates the tree as an operation on all recursive children
// Last:
// - mapping / intercepting the nodes methods; this may be done by intercepting the context

/**
 * Wraps access to a node 
 */
function Context(node, count){

	// Immediate
	//root() // bool
	//set(type, key, value)
	//get(type, key)
	//detach -> context
	//...

	// Asynch
	//next(start, assertion, done)
	//find(start, assertion, each, done)
	//exec(operation, done) // never expires, throws if not detached
}