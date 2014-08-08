var Stream = require('./stream');

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
 * Node instance
 */
function Node(nodedata, children, isRoot){
	// This contains the diffrent versions of this wrapped node
	this.versions = {};
	// Current version
	this.current = ID.ascending();

	this.versions[this.current] = {
		children:  children || new Stream.Array(), 
		nodedata:  nodedata || new Node.Data(),
		timestamp: ID.ascending(), // Timestamp of the last operation
		// Still need to run on children {assertion, timestamp, operation}
		pending:   [],
		detached:  isRoot || false
	};

	this.version = function(){
		return this.versions[this.current];
	};
}

Node.Data = function(){
	this.attr = new Node.KeyValue();
	this.prop = new Node.KeyValue();
	this.path = new Node.KeyValue();
	this.tags = new Node.KeyValue();
	this.text = new Node.KeyValue();
	this.mark = new Node.KeyValue();
};

Node.KeyValue = function(){
	var values = {};
	this.set = function(key, value){
		return values[key] = value;
	};
	this.get = function(key){
		return values[key];
	};
	this.clone = function(raw){

	};
};

/**
 * Counts when the done callback should be invoked.
 */
function DoneCounter(done){
	var count = 0;
	this.start = function(){
		count++;
	};
	this.close = function(){
		if(count>0)count--;
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
function execute(node, meta, operation, timestamp, done){
	var version = node.version();
	var counter = new DoneCounter(done);
	var context = new Context(version, meta, counter);
	counter.start();
	if(version.timestamp < timestamp){
		version.timestamp = timestamp;
		var result = operation.call(context, context);
		if(result){
			result.timestamp = timestamp;
			version.pending.push(result);
		}
	}
	counter.close();
}

// Get child at specific version and timestamp; run operation <= timestamp
function resolve(parent, child, meta, timestamp, done){
	parent = parent.version();
	(function recurse(i){
		var index = parent.pending[i] || {};
		var ended = parent.pending.length <= i;
		var isold = index.timestamp > timestamp
		if(ended || isold){
			done();
		}else{
			execute(child, meta, index.operation, index.timestamp, function(){
				recurse(i+1);
			});
		}
	}(0));
}

// Called after all matches may have been resolved. This validates the
// assertions of the operations <= timestamp and removes the finished.
function cleanup(parent, timestamp){
	parent = parent.version();
	while(parent.pending.length > 0){
		if(parent.pending[0].timestamp > timestamp)break;
		parent.pending.shift();
	}
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
function Context(node, meta, count){

	// Immediate
	//root() // bool
	//set(type, key, value)
	//get(type, key)
	//all(type) clone raw
	//detach -> context
	//...

	// Asynch
	//next(start, assertion, done)
	//find(start, assertion, each, done)

	//tags.readonly
	//tags.infinite
}


function Root(){
	//exec(operation, done) // never expires, throws if not detached
}

















// -------------------------------------------------------------------------


/**
 * 
 */
function Node(data, children, root){
	// This contains the diffrent versions of this wrapped node
	this.versions = {};
	// Current version
	this.current = ID.ascending();

	this.versions[this.current] = {
		children: children || new Stream.Array(), 
		nodedata: data || new Node.Data();
	};
	// Timestamp of the last operation
	this.timestamp = ID.ascending();
	// Still need to run on children {assertion, timestamp, operation}
	this.pending  = []; 
	this.detached = root || false;
}

Node.Data = function(){
	this.attr = new Node.KeyValue();
	this.prop = new Node.KeyValue();
	this.path = new Node.KeyValue();
	this.tags = new Node.KeyValue();
	this.text = new Node.KeyValue();
};

Node.KeyValue = function(){
	var values = {};
	this.set = function(key, value){
		return values[key] = value;
	};
	this.get = function(key){
		return values[key];
	};
};

Node.prototype.execute = function(operation){
	if(!this.detached)throw new Error('Can only execute on root.');
	var timestamp = ID.ascending();
	cascade(this, 0, {
		operation: operation,
		timestamp: timestamp
	}, context(this, timestamp));
};

function context(node, timestamp){
	// How can this provide live iteration and changes in tree
}

function cascade(node, index, subject, context){
	if(node.timestamp >= subject.timestamp)return;
	var result = subject.operation(node, index, context);
	if(result)node.pending.push(result);
}

function pending(node, until){
	var result = [];
	while(node.pending.length && node.pending[0].timestamp <= until){
		result.push(node.pending.shift());
	}
	return result;
}

function cascadeall(){

}



Node.prototype.iterate = function(operation){
	
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