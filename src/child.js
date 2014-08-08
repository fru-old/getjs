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
	this.children  = children || new Stream.Array();
	this.nodedata  = nodedata || new Node.DefaultData();
	// Timestamp of the last operation
	this.timestamp = ID.ascending();
	// Still need to run on children {timestamp, operation}
	this.pending   = [];
	this.detached  = isRoot || false;
}

Node.prototype.onchange = function(){
	if(this.cloned){
		var data = {}, pending = [];
		for(var i in this.nodedata){
			data[i] = this.nodedata[i].clone();
		}
		for(var j in this.pending){
			pending[j] = this.pending[j];
		}
		this.nodedata = data;
		this.cloned   = false;
	}
};

Node.KeyValue = function(initial){
	var values = initial || {};
	this.set = function(key, value){
		return values[key] = value;
	};
	this.get = function(key){
		return values[key];
	};
	this.clone = function(raw){
		var result = {};
		for(var i in values){
			result[i] = values[i];
		}
		return raw ? result : new Node.KeyValue(result);
	};
};

Node.DefaultData = function(){
	this.attr = new Node.KeyValue();
	this.prop = new Node.KeyValue();
	this.path = new Node.KeyValue();
	this.tags = new Node.KeyValue();
	this.text = new Node.KeyValue();
	this.mark = new Node.KeyValue();
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

function cloning(node, root){
	// Both nodes need to be marked for cloning
	node.cloned = true;

	var clone = new Node(node.nodedata, node.children, root);
	clone.pending = node.pending;
	clone.cloned  = true;
	return clone;
}

// Run operation
function execute(node, index, operation, timestamp, done){
	var version = node.version();
	var counter = new DoneCounter(done);
	counter.start();
	if(version.timestamp < timestamp){
		version.timestamp = timestamp;
		var context = new Context(node, index, counter);
		var result  = operation(context, node);
		if(result){
			result.timestamp = timestamp;
			version.pending.push(result);
		}
	}
	counter.close();
}

// Get child at specific version and timestamp; run operation <= timestamp
function resolve(parent, child, index, timestamp, done){
	parent = parent.version();
	(function recurse(i){
		var index = parent.pending[i] || {};
		var ended = parent.pending.length <= i;
		var isold = index.timestamp > timestamp
		if(ended || isold){
			done();
		}else{
			execute(child, index, index.operation, index.timestamp, function(){
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



// The context wraps the child stream and nodedata access to support the 
// following features
// - being notified before nodedata or the child stream is changed to clone the
//   node if this is needed
// - expiring the context when done counting
// - No default interceptors
// - hidden nodes & read-only
// - clone already iterates the tree as an operation on all recursive children
// Last:
// - mapping / intercepting the nodes methods; this may be done by intercepting the context

/**
 * Wraps access to a node 
 */
function Context(node, index, count){
	this._node  = node;
	this._index = index;
	this._count = count;
}

Context.prototype.clone = function(){
	var root;
	function doClone(context, node){
		root = cloning(node, !root);
		return {operation: doClone};
	}
	execute(this._node, null, doClone, ID.ascending(), function(){});
	// On this operation execute must return immediately
	return new Root(root);
};

// Immediate
//root() // bool
//set(type, key, value)
//get(type, key)
//all(type) clone raw
//detach -> context
//...

// Async
//next(start, assertion, done)
//find(start, assertion, each, done)

//tags.readonly
//tags.infinite


function Root(node){
	this._node = node;
	//exec(operation, done) // never expires, throws if not detached
}
