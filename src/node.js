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
	this.timestamp = 0;
	// Still need to run on children {timestamp, operation}
	this.pending   = [];
	this.detached  = isRoot || false;
	this.creation  = ID.ascending();
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
		return (values[key] = value);
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
	var count = 0, self = this;
	this.start = function(){
		count++;
	};
	this.close = function(){
		if(count>0)count--;
		if(count === 0){
			count = -1;
			if(done)done();
		}
	};
	this.branch = function(done){
		var result = new DoneCounter(function(){
			if(done)done();
			self.close();
		});
		this.start();
		result.expired = this.expired;
		return result;
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
function execute(node, operation, timestamp, done){
	var counter = new DoneCounter(done);
	counter.start();
	if(node.timestamp < timestamp){
		node.timestamp = timestamp;
		var context = new Context(node, timestamp, counter);
		var result  = operation(context, node);
		if(result){
			node.pending.push({
				timestamp: timestamp,
				operation: result
			});
		}
	}
	counter.close();
}

// Get child at specific version and timestamp; run operation <= timestamp
function resolve(parent, child, timestamp, done){
	(function recurse(i){
		var index = parent.pending[i] || {};
		var ended = parent.pending.length <= i;
		var isold = index.timestamp > timestamp;
		if(ended || isold){
			done();
		}else{
			execute(child, index.operation, index.timestamp, function(){
				recurse(i+1);
			});
		}
	}(0));
}

// Called after all matches may have been resolved. This validates the
// assertions of the operations <= timestamp and removes the finished.
function cleanup(parent, timestamp){
	while(parent.pending.length > 0){
		if(parent.pending[0].timestamp > timestamp)break;
		parent.pending.shift();
	}
}

function expired(){
	throw new Error('This reference has expired.');
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
function Context(node, timestamp, count){

	/**
	 *
	 */
	this.clone = function(){
		if(count.expired())expired();
		var root;
		function doClone(context, node){
			root = cloning(node, !root);
			return doClone;
		}
		execute(node, doClone, ID.ascending(), function(){});
		// On this operation execute MUST return immediately
		return new Root(root);
	};

	this.isRoot = function(){
		if(count.expired())expired();
		return node.detached;
	};

	this.isInfinite = function(){
		if(count.expired())expired();
		return !!(node.children||{}).infinite;
	}

	this.set = function(type, key, value){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].set(key, value);
	};

	this.get = function(type, key){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].get(key);
	};

	this.all = function(type){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].clone(true);
	};

	this.next = function(start, assertion, each, done){
		if(count.expired())expired();
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		node.children.next(start, assertion, function(err, i, element, ended){
			if(ended || err){
				_error = err;
				_ended = ended;
				branch.close();
			}else{
				resolve(node, element, timestamp, function(){
					each(i, new Context(element, timestamp, branch));
					branch.close();
				});
			}
		});
	};

	this.find = function(start, assertion, each, done){
		if(count.expired())expired();
		if(this.isInfinite()){
			return done(null, {length: 0});
		}
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		(function recurse(n){
			node.children.next(n, assertion, function(err, i, element, ended){
				if(ended || err){
					_error = err;
					_ended = ended;
					branch.close();
				}else{
					resolve(node, element, timestamp, function(){
						each(i, new Context(element, timestamp, branch));
						recurse(i+1);
					});
				}	
			});
		}(start));
	};

}

// TODO
// 1: simple: get, set & next
// 2: hidden nodes & infinite nodes

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

Node.Root = function(node){
	this.execute = function(operation, done){
		if(!node.detached)expired();
		execute(node, operation, ID.ascending(), done);
	};
};

function Roots(stream){
	this.prependTo = function(context, index){
		
	};
	this.appendTo = function(context){

	};
}

module.exports = Node;