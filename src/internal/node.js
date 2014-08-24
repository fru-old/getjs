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
Node.DoneCounter = function(done){
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
};

Node.prototype.scheduleClone = function(root){
	var copy = new Node(this.nodedata, this.children, root);
	copy.pending = this.pending.slice(0);
	
	// Both nodes need to be marked for cloning
	node.cloned = true;
	copy.cloned = true;
	
	return copy;
};

Node.prototype.resolveClone = function(){
	if(this.cloned){
		var data = {};

		for(var i in this.nodedata){
			data[i] = this.nodedata[i].clone();
		}
		this.nodedata = data;
		this.cloned   = false;
	}
};

/**
 * Run operation (can be used on non-root nodes).
 */
Node.prototype.execute = function(operation, timestamp, done){
	if(!timestamp)timestamp = ID.ascending();
	var counter = new Node.DoneCounter(done);
	counter.start();
	if(this.timestamp < timestamp){
		this.timestamp = timestamp;
		var result  = operation(this, timestamp, counter);
		if(result){
			this.pending.push({
				timestamp: timestamp,
				operation: result
			});
		}
	}
	counter.close();
};

/**
 * Get child at specific version timestamp; run operation <= timestamp.
 */
Node.prototype.resolve = function(child, timestamp, done){
	(function recurse(i){
		var index = this.pending[i] || {};
		var ended = this.pending.length <= i;
		var isOld = index.timestamp > timestamp;
		if(ended || isOld){
			done();
		}else{
			child.execute(index.operation, index.timestamp, function(){
				recurse(i+1);
			});
		}
	}(0));
};

/**
 * Called after all matches may have been resolved. This validates the
 * assertions of the operations <= timestamp and removes the finished.
 */
Node.prototype.cleanup = function(timestamp){
	while(this.pending.length > 0){
		if(this.pending[0].timestamp > timestamp)break;
		this.pending.shift();
	}
};

module.exports = Node;