function Wrapper(node, timestamp, count){

	if(!timestamp)

	/**
	 * Iterate over all nodes that match an assertion.
	 */
	this.childrenFind = function(){

	};

	/**
	 * Get the next node that statisfies an assertion.
	 */
	this.childrenNext = function(){

	};

	/**
	 * Add func to the pending operations that will be run on child nodes.
	 */
	this.childrenRun = function(func){

	};

	/**
	 *
	 */
	this.append = function(nodes){
		// calls mapper
	};

	/**
	 *
	 */
	this.prepend = function(index, nodes){
		// calls mapper
	};

	/**
	 *
	 */
	this.detach = function(index, length){
		// calls mapper when length > x
	};

	/**
	 *
	 */
	this.clear = function(replacement){
		// calls mapper
	};

	/**
	 *
	 */
	this.get = function(type, name){

	};

	/**
	 *
	 */
	this.set = function(type, name, value, readonly){

	};

	/**
	 * If this node is root this can return a context
	 */
	this.getRootContext = function(){
		if(!node.detached){
			throw new Error('The node must be root.');
		}
		return new Context(node);
	};
}



Context.RootCollection = function(stream){
	this.prependTo = function(index, target){
		return target.prepend(index, stream);
	};
	this.appendTo = function(target){
		return target.append(stream);
	};
};

function expired(){
	throw new Error('This reference has expired.');
}


// get (problem when id is generated it needs to be cloned)
// childrenFind (must return context)
// childrenNext (must return context)
// childrenRun (add operation to pending)
// internal
// hidding doesnt use timestamps and hence it is implemented here


// pending persistant 
// (may be 2. result of operation)
// (is then executed always before everythig else)
// (persist has a minimal timestamp)
// interceptor has to be on node not on context
// event context can not trigger secondary events 
// get.symbol -> tags.id created on read
// clone stream
// two way binding: -render subtree twice -events change subtree
// resolve _ in node get so the type of node can be concidered
// or resolve via reference prop to attr values

// is it possible to have a dupplicate sub tree in tree and ensure no loops?
// how to handel events?

